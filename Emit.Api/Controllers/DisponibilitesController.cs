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

    // Vérifie, AVANT sauvegarde, si les nouvelles disponibilités (dtos) pour ce cours
    // chevauchent une disponibilité "verte" déjà enregistrée sur un AUTRE cours du même enseignant.
    private async Task<List<ConflitDispoDto>> DetecterConflitsAvantSauvegardeAsync(
        Guid enseignantId, Guid semestreId, Guid coursId, List<DispoDto> dtos)
    {
        var autresDispos = await _db.Disponibilites
            .Include(d => d.Cours)
            .Where(d => d.EnseignantId == enseignantId && d.SemestreId == semestreId
                     && d.CoursId != coursId && d.EstDisponible)
            .ToListAsync();

        if (autresDispos.Count == 0) return new List<ConflitDispoDto>();

        var coursActuel = await _db.Cours.FindAsync(coursId);
        var conflits = new List<ConflitDispoDto>();

        foreach (var d in dtos.Where(d => d.EstDisponible))
        {
            if (!TryParseCreneau(d.Creneau, out var da, out var fa)) continue;

            foreach (var autre in autresDispos)
            {
                if (autre.Jour != d.Jour) continue;
                if (!TryParseCreneau(autre.Creneau, out var db_, out var fb)) continue;

                if (da < fb && db_ < fa)
                {
                    conflits.Add(new ConflitDispoDto
                    {
                        Jour = d.Jour,
                        Creneau = $"{d.Creneau} / {autre.Creneau}",
                        Cours1 = coursActuel?.Intitule ?? "",
                        Cours2 = autre.Cours.Intitule,
                    });
                }
            }
        }
        return conflits;
    }

    // Vérifie, AVANT sauvegarde, si les nouvelles disponibilités (dtos) pour ce cours
    // chevauchent une disponibilité "verte" déjà enregistrée sur un AUTRE cours DU MÊME
    // NIVEAU ET DU MÊME PARCOURS (filière) — peu importe l'enseignant. Les étudiants de
    // ce niveau/parcours ne peuvent pas suivre 2 cours en même temps.
    private async Task<List<ConflitDispoDto>> DetecterConflitsMemeNiveauFiliereAsync(
        Guid semestreId, Cours coursActuel, List<DispoDto> dtos)
    {
        var autresDispos = await _db.Disponibilites
            .Include(d => d.Cours)
            .Where(d => d.SemestreId == semestreId
                     && d.CoursId != coursActuel.Id
                     && d.EstDisponible
                     && d.Cours.NiveauId == coursActuel.NiveauId
                     && d.Cours.FiliereId == coursActuel.FiliereId)
            .ToListAsync();

        if (autresDispos.Count == 0) return new List<ConflitDispoDto>();

        var conflits = new List<ConflitDispoDto>();

        foreach (var d in dtos.Where(d => d.EstDisponible))
        {
            if (!TryParseCreneau(d.Creneau, out var da, out var fa)) continue;

            foreach (var autre in autresDispos)
            {
                if (autre.Jour != d.Jour) continue;
                if (!TryParseCreneau(autre.Creneau, out var db_, out var fb)) continue;

                if (da < fb && db_ < fa)
                {
                    conflits.Add(new ConflitDispoDto
                    {
                        Jour = d.Jour,
                        Creneau = $"{d.Creneau} / {autre.Creneau}",
                        Cours1 = coursActuel.Intitule,
                        Cours2 = autre.Cours.Intitule,
                    });
                }
            }
        }
        return conflits;
    }

    // Retire de l'EDT tout créneau déjà planifié pour cet enseignant SUR CE COURS qui chevauche
    // une plage qu'il vient de déclarer indisponible, et notifie les admins.
    // Retourne les notifications créées (pas encore poussées en temps réel — voir appelant).
    private async Task<List<Notification>> LibererCreneauxIndisponiblesAsync(Guid enseignantId, Guid coursId, Guid semestreId, List<DispoDto> dtos)
    {
        var indispos = dtos.Where(d => d.EstIndisponible).ToList();
        if (indispos.Count == 0) return new List<Notification>();

        var slots = await _db.Slots
            .Include(s => s.Cours)
            .Where(s => s.EnseignantId == enseignantId && s.CoursId == coursId && s.SemestreId == semestreId)
            .ToListAsync();
        if (slots.Count == 0) return new List<Notification>();

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
        if (aLiberer.Count == 0) return new List<Notification>();

        _db.Slots.RemoveRange(aLiberer);

        var enseignant = await _db.Enseignants.FindAsync(enseignantId);
        var admins = await _db.Users.Where(u => u.Role == Role.Admin).ToListAsync();
        var notificationsCreees = new List<Notification>();

        foreach (var slot in aLiberer)
        {
            foreach (var admin in admins)
            {
                var notif = new Notification
                {
                    Type = NotifType.Planning,
                    Titre = "Créneau libéré automatiquement",
                    Description = $"{enseignant?.Prenom} {enseignant?.Nom} s'est déclaré(e) indisponible le {slot.Jour} à {slot.HeureDebut:HH\\:mm} pour \"{slot.Cours?.Intitule}\" — le créneau a été retiré de l'EDT et doit être replanifié.",
                    UserId = admin.Id
                };
                _db.Notifications.Add(notif);
                notificationsCreees.Add(notif);
            }

            _db.Journal.Add(new LogEntry
            {
                Action = LogAction.Suppression,
                Entite = $"Créneau {slot.Cours?.Intitule} ({slot.Jour} {slot.HeureDebut:HH\\:mm}) libéré — indisponibilité déclarée"
            });
        }

        return notificationsCreees;
    }

    // Notifie tous les admins (persisté + push temps réel) qu'un conflit a été détecté.
    private async Task NotifierAdminsConflitAsync(string titre, string description)
    {
        var admins = await _db.Users.Where(u => u.Role == Role.Admin).ToListAsync();
        if (admins.Count == 0) return;

        var notifs = admins.Select(a => new Notification
        {
            Type = NotifType.Planning,
            Titre = titre,
            Description = description,
            UserId = a.Id
        }).ToList();

        _db.Notifications.AddRange(notifs);
        await _db.SaveChangesAsync();
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

        // Vérifie le chevauchement AVANT toute écriture : si un conflit existe avec un
        // autre cours du même enseignant, on bloque et on n'enregistre rien.
        var conflits = await DetecterConflitsAvantSauvegardeAsync(enseignantId, semestreId, coursId, dtos);
        if (conflits.Count > 0)
        {
            return Conflict(new { message = "Chevauchement détecté avec un autre cours de cet enseignant.", conflits });
        }

        // Vérifie le chevauchement avec un AUTRE cours du même niveau et du même parcours
        // (conflit d'emploi du temps pour les étudiants, peu importe l'enseignant).
        var conflitsNiveau = await DetecterConflitsMemeNiveauFiliereAsync(semestreId, cours, dtos);
        if (conflitsNiveau.Count > 0)
        {
            return Conflict(new
            {
                message = "Chevauchement détecté avec un autre cours du même niveau et du même parcours : les étudiants ne peuvent pas suivre les deux cours en même temps.",
                conflits = conflitsNiveau
            });
        }

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

        var notifsCreees = await LibererCreneauxIndisponiblesAsync(enseignantId, coursId, semestreId, dtos);
        await _db.SaveChangesAsync();

        return Ok(new { conflits = new List<ConflitDispoDto>() });
    }

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

        // Vérifie le chevauchement AVANT toute écriture.
        var conflits = await DetecterConflitsAvantSauvegardeAsync(enseignant.Id, semestreId, coursId, dtos);
        if (conflits.Count > 0)
        {
            await NotifierAdminsConflitAsync(
                "Conflit de disponibilité détecté",
                $"{enseignant.Prenom} {enseignant.Nom} a tenté de déclarer une disponibilité en conflit avec un autre de ses cours (\"{cours.Intitule}\").");
            return Conflict(new { message = "Chevauchement détecté avec un autre de vos cours.", conflits });
        }

        // Vérifie le chevauchement avec un AUTRE cours du même niveau et du même parcours
        // (conflit d'emploi du temps pour les étudiants, peu importe l'enseignant).
        var conflitsNiveau = await DetecterConflitsMemeNiveauFiliereAsync(semestreId, cours, dtos);
        if (conflitsNiveau.Count > 0)
        {
            await NotifierAdminsConflitAsync(
                "Conflit de disponibilité détecté",
                $"{enseignant.Prenom} {enseignant.Nom} a tenté de déclarer une disponibilité en conflit avec un autre cours du même niveau/parcours pour \"{cours.Intitule}\".");
            return Conflict(new
            {
                message = "Chevauchement détecté avec un autre cours du même niveau et du même parcours : les étudiants ne peuvent pas suivre les deux cours en même temps.",
                conflits = conflitsNiveau
            });
        }

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

        var notifsCreees = await LibererCreneauxIndisponiblesAsync(enseignant.Id, coursId, semestreId, dtos);
        await _db.SaveChangesAsync();

        return Ok(new { conflits = new List<ConflitDispoDto>() });
    }
}