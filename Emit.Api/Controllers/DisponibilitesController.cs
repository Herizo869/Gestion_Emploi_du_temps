using Emit.Api.Data;
using Emit.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;

public class DispoDto
{
    public string Jour { get; set; } = "";
    public string Creneau { get; set; } = "";
    public bool EstDisponible { get; set; }
    public bool EstIndisponible { get; set; }
}

public class ConflitDispoDto
{
    public string Jour { get; set; } = "";
    public string Creneau { get; set; } = "";
    public string Cours1 { get; set; } = "";
    public string Cours2 { get; set; } = "";
}

[ApiController, Authorize, Route("api/disponibilites")]
public class DisponibilitesController : ControllerBase
{
    private readonly AppDbContext _db;
    public DisponibilitesController(AppDbContext db) { _db = db; }

    // Parse "07h00 - 08h00" -> (07:00, 08:00)
    private static bool TryParseCreneau(string creneau, out TimeOnly debut, out TimeOnly fin)
    {
        debut = default; fin = default;
        var parts = creneau.Split('-', StringSplitOptions.TrimEntries);
        if (parts.Length != 2) return false;
        return TimeOnly.TryParse(parts[0].Replace('h', ':'), out debut)
            && TimeOnly.TryParse(parts[1].Replace('h', ':'), out fin);
    }

    // Détecte, pour un enseignant+semestre donné, les créneaux où il est déclaré
    // "disponible" sur DEUX cours différents qui se chevauchent dans le temps.
    private async Task<List<ConflitDispoDto>> DetecterConflitsCoursAsync(Guid enseignantId, Guid semestreId)
    {
        var dispos = await _db.Disponibilites
            .Include(d => d.Cours)
            .Where(d => d.EnseignantId == enseignantId && d.SemestreId == semestreId && d.EstDisponible)
            .ToListAsync();

        var conflits = new List<ConflitDispoDto>();
        for (int i = 0; i < dispos.Count; i++)
        {
            for (int j = i + 1; j < dispos.Count; j++)
            {
                var a = dispos[i]; var b = dispos[j];
                if (a.CoursId == b.CoursId) continue;
                if (a.Jour != b.Jour) continue;
                if (!TryParseCreneau(a.Creneau, out var da, out var fa)) continue;
                if (!TryParseCreneau(b.Creneau, out var db_, out var fb)) continue;
                if (da < fb && db_ < fa)
                {
                    conflits.Add(new ConflitDispoDto
                    {
                        Jour = a.Jour,
                        Creneau = $"{a.Creneau} / {b.Creneau}",
                        Cours1 = a.Cours.Intitule,
                        Cours2 = b.Cours.Intitule,
                    });
                }
            }
        }
        return conflits;
    }

    // Retire de l'EDT tout créneau déjà planifié pour cet enseignant SUR CE COURS qui chevauche
    // une plage qu'il vient de déclarer indisponible, et notifie les admins.
    private async Task LibererCreneauxIndisponiblesAsync(Guid enseignantId, Guid coursId, Guid semestreId, List<DispoDto> dtos)
    {
        var indispos = dtos.Where(d => d.EstIndisponible).ToList();
        if (indispos.Count == 0) return;

        var slots = await _db.Slots
            .Include(s => s.Cours)
            .Where(s => s.EnseignantId == enseignantId && s.CoursId == coursId && s.SemestreId == semestreId)
            .ToListAsync();
        if (slots.Count == 0) return;

        var aLiberer = new List<SlotEDT>();
        foreach (var slot in slots)
        {
            foreach (var d in indispos)
            {
                if (!Enum.TryParse<Jour>(d.Jour, out var jourEnum) || jourEnum != slot.Jour) continue;
                if (!TryParseCreneau(d.Creneau, out var debut, out var fin)) continue;
                if (slot.HeureDebut < fin && debut < slot.HeureFin)
                {
                    aLiberer.Add(slot);
                    break;
                }
            }
        }
        if (aLiberer.Count == 0) return;

        _db.Slots.RemoveRange(aLiberer);

        var enseignant = await _db.Enseignants.FindAsync(enseignantId);
        var admins = await _db.Users.Where(u => u.Role == Role.Admin).ToListAsync();
        foreach (var slot in aLiberer)
        {
            foreach (var admin in admins)
            {
                _db.Notifications.Add(new Notification
                {
                    Type = NotifType.Planning,
                    Titre = "Créneau libéré automatiquement",
                    Description = $"{enseignant?.Prenom} {enseignant?.Nom} s'est déclaré(e) indisponible le {slot.Jour} à {slot.HeureDebut:HH\\:mm} pour \"{slot.Cours?.Intitule}\" — le créneau a été retiré de l'EDT et doit être replanifié.",
                    UserId = admin.Id
                });
            }

            _db.Journal.Add(new LogEntry
            {
                Action = LogAction.Suppression,
                Entite = $"Créneau {slot.Cours?.Intitule} ({slot.Jour} {slot.HeureDebut:HH\\:mm}) libéré — indisponibilité déclarée"
            });
        }
    }

    // GET /api/disponibilites/{enseignantId}?semestreId=...&coursId=... — Admin
    [HttpGet("{enseignantId:guid}")]
    public async Task<IActionResult> Get(Guid enseignantId, [FromQuery] Guid semestreId, [FromQuery] Guid coursId)
    {
        if (semestreId == Guid.Empty || coursId == Guid.Empty)
            return BadRequest("semestreId et coursId sont requis.");

        var dispos = await _db.Disponibilites
            .Where(d => d.EnseignantId == enseignantId && d.SemestreId == semestreId && d.CoursId == coursId)
            .ToListAsync();
        return Ok(dispos.Select(d => new DispoDto
        {
            Jour = d.Jour,
            Creneau = d.Creneau,
            EstDisponible = d.EstDisponible,
            EstIndisponible = d.EstIndisponible,
        }));
    }

    // PUT /api/disponibilites/{enseignantId}?semestreId=...&coursId=... — Admin
    [HttpPut("{enseignantId:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Save(Guid enseignantId, [FromQuery] Guid semestreId, [FromQuery] Guid coursId, [FromBody] List<DispoDto> dtos)
    {
        if (semestreId == Guid.Empty || coursId == Guid.Empty)
            return BadRequest("semestreId et coursId sont requis.");

        var cours = await _db.Cours.FindAsync(coursId);
        if (cours is null) return NotFound("Cours introuvable.");

        var existing = await _db.Disponibilites
            .Where(d => d.EnseignantId == enseignantId && d.SemestreId == semestreId && d.CoursId == coursId)
            .ToListAsync();
        _db.Disponibilites.RemoveRange(existing);

        var newDispos = dtos.Select(d => new Disponibilite
        {
            Id = Guid.NewGuid(),
            EnseignantId = enseignantId,
            SemestreId = semestreId,
            CoursId = coursId,
            NiveauId = cours.NiveauId,
            Jour = d.Jour,
            Creneau = d.Creneau,
            EstDisponible = d.EstDisponible,
            EstIndisponible = d.EstIndisponible,
        });
        await _db.Disponibilites.AddRangeAsync(newDispos);

        await LibererCreneauxIndisponiblesAsync(enseignantId, coursId, semestreId, dtos);
        await _db.SaveChangesAsync();

        var conflits = await DetecterConflitsCoursAsync(enseignantId, semestreId);
        return Ok(new { conflits });
    }

    // GET /api/disponibilites/conflits?semestreId=...&enseignantId=... — Admin
    [HttpGet("conflits")]
    public async Task<ActionResult<List<ConflitDispoDto>>> Conflits([FromQuery] Guid semestreId, [FromQuery] Guid enseignantId)
        => Ok(await DetecterConflitsCoursAsync(enseignantId, semestreId));

    // GET /api/disponibilites/me?semestreId=...&coursId=... — Enseignant connecté
    [HttpGet("me")]
    public async Task<IActionResult> GetMe([FromQuery] Guid semestreId, [FromQuery] Guid coursId)
    {
        if (semestreId == Guid.Empty || coursId == Guid.Empty)
            return BadRequest("semestreId et coursId sont requis.");

        var email = User.Identity?.Name;
        var enseignant = await _db.Enseignants.FirstOrDefaultAsync(e => e.Email == email);
        if (enseignant is null) return NotFound();

        var dispos = await _db.Disponibilites
            .Where(d => d.EnseignantId == enseignant.Id && d.SemestreId == semestreId && d.CoursId == coursId)
            .ToListAsync();
        return Ok(dispos.Select(d => new DispoDto
        {
            Jour = d.Jour,
            Creneau = d.Creneau,
            EstDisponible = d.EstDisponible,
            EstIndisponible = d.EstIndisponible,
        }));
    }

    // PUT /api/disponibilites/me?semestreId=...&coursId=... — Enseignant connecté
    [HttpPut("me")]
    public async Task<IActionResult> SaveMe([FromQuery] Guid semestreId, [FromQuery] Guid coursId, [FromBody] List<DispoDto> dtos)
    {
        if (semestreId == Guid.Empty || coursId == Guid.Empty)
            return BadRequest("semestreId et coursId sont requis.");

        var email = User.Identity?.Name;
        var enseignant = await _db.Enseignants.FirstOrDefaultAsync(e => e.Email == email);
        if (enseignant is null) return NotFound();

        var cours = await _db.Cours.FirstOrDefaultAsync(c => c.Id == coursId && c.Enseignants.Any(ce => ce.EnseignantId == enseignant.Id));
        if (cours is null) return Forbid();

        var existing = await _db.Disponibilites
            .Where(d => d.EnseignantId == enseignant.Id && d.SemestreId == semestreId && d.CoursId == coursId)
            .ToListAsync();
        _db.Disponibilites.RemoveRange(existing);

        var newDispos = dtos.Select(d => new Disponibilite
        {
            Id = Guid.NewGuid(),
            EnseignantId = enseignant.Id,
            SemestreId = semestreId,
            CoursId = coursId,
            NiveauId = cours.NiveauId,
            Jour = d.Jour,
            Creneau = d.Creneau,
            EstDisponible = d.EstDisponible,
            EstIndisponible = d.EstIndisponible,
        });
        await _db.Disponibilites.AddRangeAsync(newDispos);

        await LibererCreneauxIndisponiblesAsync(enseignant.Id, coursId, semestreId, dtos);
        await _db.SaveChangesAsync();

        var conflits = await DetecterConflitsCoursAsync(enseignant.Id, semestreId);
        return Ok(new { conflits });
    }

    // GET /api/disponibilites/mes-conflits?semestreId=... — Enseignant connecté
    [HttpGet("mes-conflits")]
    public async Task<IActionResult> MesConflits([FromQuery] Guid semestreId)
    {
        var email = User.Identity?.Name;
        var enseignant = await _db.Enseignants.FirstOrDefaultAsync(e => e.Email == email);
        if (enseignant is null) return NotFound();
        return Ok(await DetecterConflitsCoursAsync(enseignant.Id, semestreId));
    }
}