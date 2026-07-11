using AutoMapper;
using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;

[ApiController, Authorize, Route("api/semestres")]
public class SemestresController : ControllerBase
{
    private readonly AppDbContext _db; private readonly IMapper _map;
    public SemestresController(AppDbContext db, IMapper map) { _db = db; _map = map; }

    [HttpGet, AllowAnonymous]
    public async Task<ActionResult<IEnumerable<SemestreDto>>> GetAll()
        => Ok(_map.Map<List<SemestreDto>>(await _db.Semestres.ToListAsync()));

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<SemestreDto>> Create(SemestreDto dto)
    {
        var s = new Semestre { Libelle = dto.Libelle, Annee = dto.Annee, Statut = StatutSemestre.Brouillon };
        _db.Semestres.Add(s);
        await _db.SaveChangesAsync();
        return Ok(_map.Map<SemestreDto>(s));
    }

    // POST /api/semestres/{id}/publier — Admin
    [HttpPost("{id:guid}/publier"), Authorize(Roles = "Admin")]
    public async Task<ActionResult<SemestreDto>> Publier(Guid id)
    {
        var s = await _db.Semestres.FindAsync(id);
        if (s is null) return NotFound();

        s.Statut = StatutSemestre.Publie;
        s.DatePublication = DateTime.UtcNow;
        _db.Journal.Add(new LogEntry { Action = LogAction.Publication, Entite = $"Semestre {s.Libelle} {s.Annee}" });
        await _db.SaveChangesAsync();
        return Ok(_map.Map<SemestreDto>(s));
    }

    // POST /api/semestres/{id}/depublier — Admin
    [HttpPost("{id:guid}/depublier"), Authorize(Roles = "Admin")]
    public async Task<ActionResult<SemestreDto>> Depublier(Guid id)
    {
        var s = await _db.Semestres.FindAsync(id);
        if (s is null) return NotFound();

        s.Statut = StatutSemestre.Brouillon;
        _db.Journal.Add(new LogEntry { Action = LogAction.Modification, Entite = $"Semestre {s.Libelle} {s.Annee} dépublié" });
        await _db.SaveChangesAsync();
        return Ok(_map.Map<SemestreDto>(s));
    }

    // POST /api/semestres/{id}/archiver — Admin
    [HttpPost("{id:guid}/archiver"), Authorize(Roles = "Admin")]
    public async Task<ActionResult<SemestreDto>> Archiver(Guid id)
    {
        var s = await _db.Semestres.FindAsync(id);
        if (s is null) return NotFound();

        s.Statut = StatutSemestre.Archive;
        _db.Journal.Add(new LogEntry { Action = LogAction.Modification, Entite = $"Semestre {s.Libelle} {s.Annee} archivé" });
        await _db.SaveChangesAsync();
        return Ok(_map.Map<SemestreDto>(s));
    }

    // POST /api/semestres/{id}/dupliquer — Admin
    // Crée une copie du semestre en Brouillon, avec ses créneaux d'EDT.
    [HttpPost("{id:guid}/dupliquer"), Authorize(Roles = "Admin")]
    public async Task<ActionResult<SemestreDto>> Dupliquer(Guid id)
    {
        var source = await _db.Semestres
            .Include(s => s.Slots)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (source is null) return NotFound();

        var copie = new Semestre
        {
            Libelle = $"{source.Libelle} (copie)",
            Annee = source.Annee,
            Statut = StatutSemestre.Brouillon,
        };
        _db.Semestres.Add(copie);

        foreach (var slot in source.Slots)
        {
            _db.Slots.Add(new SlotEDT
            {
                Id = Guid.NewGuid(),
                SemestreId = copie.Id,
                CoursId = slot.CoursId,
                EnseignantId = slot.EnseignantId,
                SalleId = slot.SalleId,
                NiveauId = slot.NiveauId,
                FiliereId = slot.FiliereId,
                Jour = slot.Jour,
                HeureDebut = slot.HeureDebut,
                HeureFin = slot.HeureFin,
            });
        }

        _db.Journal.Add(new LogEntry { Action = LogAction.Ajout, Entite = $"Semestre {copie.Libelle} dupliqué depuis {source.Libelle}" });
        await _db.SaveChangesAsync();
        return Ok(_map.Map<SemestreDto>(copie));
    }

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var s = await _db.Semestres.FindAsync(id);
        if (s is null) return NotFound();
        _db.Semestres.Remove(s);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}