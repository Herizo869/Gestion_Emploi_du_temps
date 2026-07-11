using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;

[ApiController, Authorize, Route("api/edt")]
public class EdtController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEdtGeneratorService _gen;
    public EdtController(AppDbContext db, IEdtGeneratorService gen) { _db = db; _gen = gen; }

    private IQueryable<Entities.SlotEDT> Base() => _db.Slots
        .Include(s => s.Cours).Include(s => s.Enseignant)
        .Include(s => s.Salle).Include(s => s.Niveau).Include(s => s.Filiere);

    [HttpGet, AllowAnonymous]
    public async Task<ActionResult<IEnumerable<SlotEDTDto>>> Get(
        [FromQuery] Guid? semestreId, [FromQuery] Guid? niveauId,
        [FromQuery] Guid? filiereId, [FromQuery] Guid? salleId, [FromQuery] Guid? enseignantId)
    {
        var q = Base();
        if (semestreId.HasValue) q = q.Where(s => s.SemestreId == semestreId);
        if (niveauId.HasValue)   q = q.Where(s => s.NiveauId == niveauId);
        if (filiereId.HasValue)  q = q.Where(s => s.FiliereId == filiereId);
        if (salleId.HasValue)    q = q.Where(s => s.SalleId == salleId);
        if (enseignantId.HasValue) q = q.Where(s => s.EnseignantId == enseignantId);
        var list = await q.ToListAsync();
        return Ok(list.Select(SlotMapper.ToDto));
    }

    [HttpGet("me")]
    public async Task<ActionResult<IEnumerable<SlotEDTDto>>> GetMine([FromQuery] Guid? semestreId)
    {
        var ens = User.FindFirst("enseignantId")?.Value;
        if (!Guid.TryParse(ens, out var eid)) return Forbid();
        var q = Base().Where(s => s.EnseignantId == eid);
        if (semestreId.HasValue) q = q.Where(s => s.SemestreId == semestreId);
        var list = await q.ToListAsync();
        return Ok(list.Select(SlotMapper.ToDto));
    }

    [HttpPost("generate/{semestreId:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Generate(Guid semestreId)
    {
        var res = await _gen.GenerateAsync(semestreId);
        return Ok(res);
    }

    [HttpGet("{semestreId:guid}/conflits"), Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<ConflitDto>>> Conflits(Guid semestreId)
        => Ok(await _gen.DetectConflitsAsync(semestreId));

    // Parse "07h00 - 08h00" -> (07:00, 08:00)
    private static bool TryParseCreneau(string creneau, out TimeOnly debut, out TimeOnly fin)
    {
        debut = default; fin = default;
        var parts = creneau.Split('-', StringSplitOptions.TrimEntries);
        if (parts.Length != 2) return false;
        return TimeOnly.TryParse(parts[0].Replace('h', ':'), out debut)
            && TimeOnly.TryParse(parts[1].Replace('h', ':'), out fin);
    }

    // PUT /api/edt/{id} — Admin : modification manuelle d'un créneau
    [HttpPut("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SlotUpdateDto dto)
    {
        var slot = await Base().FirstOrDefaultAsync(s => s.Id == id);
        if (slot is null) return NotFound();

        if (!TimeOnly.TryParse(dto.HeureDebut, out var heureDebut) ||
            !TimeOnly.TryParse(dto.HeureFin, out var heureFin))
            return BadRequest(new { message = "Format d'heure invalide (attendu HH:mm)." });

        // Conflit : même semestre, même jour, même heure de début,
        // même salle ou même enseignant, sur un créneau différent.
        var autresSlots = await _db.Slots
            .Include(s => s.Salle).Include(s => s.Enseignant)
            .Where(s => s.SemestreId == slot.SemestreId && s.Id != id
                     && s.Jour == dto.Jour && s.HeureDebut == heureDebut)
            .ToListAsync();

        var conflitSalle = autresSlots.FirstOrDefault(s => s.SalleId == dto.SalleId);
        var conflitEnseignant = autresSlots.FirstOrDefault(s => s.EnseignantId == dto.EnseignantId);

        // Nouveau : l'enseignant a-t-il déclaré être indisponible sur ce créneau ce jour-là ?
        var indispoEnseignant = await _db.Disponibilites
            .Where(d => d.SemestreId == slot.SemestreId
                     && d.EnseignantId == dto.EnseignantId
                     && d.EstIndisponible
                     && d.Jour == dto.Jour.ToString())
            .ToListAsync();
        var conflitIndispo = indispoEnseignant.FirstOrDefault(d =>
            TryParseCreneau(d.Creneau, out var db, out var df) && heureDebut < df && db < heureFin);

        if (conflitSalle != null || conflitEnseignant != null || conflitIndispo != null)
        {
            var conflits = new List<ConflitDto>();
            if (conflitSalle != null)
                conflits.Add(new ConflitDto
                {
                    Id = $"S-{conflitSalle.SalleId}-{dto.Jour}-{heureDebut:HH\\:mm}",
                    Type = "Salle",
                    Description = $"{conflitSalle.Salle.Numero} déjà occupée le {dto.Jour} à {heureDebut:HH\\:mm}",
                    Date = DateTime.UtcNow
                });
            if (conflitEnseignant != null)
                conflits.Add(new ConflitDto
                {
                    Id = $"E-{conflitEnseignant.EnseignantId}-{dto.Jour}-{heureDebut:HH\\:mm}",
                    Type = "Enseignant",
                    Description = $"{conflitEnseignant.Enseignant.Prenom[0]}. {conflitEnseignant.Enseignant.Nom} déjà occupé(e) le {dto.Jour} à {heureDebut:HH\\:mm}",
                    Date = DateTime.UtcNow
                });
            if (conflitIndispo != null)
                conflits.Add(new ConflitDto
                {
                    Id = $"I-{dto.EnseignantId}-{dto.Jour}-{heureDebut:HH\\:mm}",
                    Type = "Indisponibilite",
                    Description = $"Cet enseignant a déclaré être indisponible le {dto.Jour} à {heureDebut:HH\\:mm}",
                    Date = DateTime.UtcNow
                });

            var occupees = autresSlots.Select(s => s.SalleId).ToHashSet();
            var sallesLibres = await _db.Salles
                .Where(s => s.Disponible && !occupees.Contains(s.Id))
                .Select(s => s.Numero)
                .ToListAsync();

            return Conflict(new SlotConflitResponse
            {
                Message = "Conflit détecté sur ce créneau.",
                Conflits = conflits,
                SallesLibres = sallesLibres
            });
        }

        slot.SalleId = dto.SalleId;
        slot.EnseignantId = dto.EnseignantId;
        slot.Jour = dto.Jour;
        slot.HeureDebut = heureDebut;
        slot.HeureFin = heureFin;

        _db.Journal.Add(new Entities.LogEntry
        {
            Action = Entities.LogAction.Modification,
            Entite = $"Créneau {slot.Cours?.Intitule} modifié"
        });

        await _db.SaveChangesAsync();

        var updated = await Base().FirstAsync(s => s.Id == id);
        return Ok(SlotMapper.ToDto(updated));
    }

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var s = await _db.Slots.FindAsync(id);
        if (s is null) return NotFound();
        _db.Slots.Remove(s);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}