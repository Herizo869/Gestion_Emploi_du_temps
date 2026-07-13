using AutoMapper;
using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Emit.Api.Controllers;

[ApiController, Authorize, Route("api/cours")]
public class CoursController : ControllerBase
{
    private readonly AppDbContext _db; private readonly IMapper _map;
    public CoursController(AppDbContext db, IMapper map) { _db = db; _map = map; }

    private IQueryable<Cours> Query() => _db.Cours
        .Include(c => c.Niveau).Include(c => c.Filiere)
        .Include(c => c.Enseignants);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CoursDto>>> GetAll()
        => Ok(_map.Map<List<CoursDto>>(await Query().ToListAsync()));

    [HttpGet("me")]
    public async Task<ActionResult<IEnumerable<CoursDto>>> GetMine()
    {
        var ens = User.FindFirst("enseignantId")?.Value;
        if (!Guid.TryParse(ens, out var eid))
            return StatusCode(403, new {
                message = "Aucun profil enseignant n'est associé à ce compte. Contactez un administrateur pour lier votre compte à une fiche enseignant (email correspondant requis)."
            });

        var list = await Query().Where(c => c.Enseignants.Any(x => x.EnseignantId == eid)).ToListAsync();
        return Ok(_map.Map<List<CoursDto>>(list));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CoursDto>> Get(Guid id)
    {
        var c = await Query().FirstOrDefaultAsync(x => x.Id == id);
        return c is null ? NotFound() : _map.Map<CoursDto>(c);
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<CoursDto>> Create(CoursDto dto)
    {
        var c = new Cours
        {
            Intitule = dto.Intitule, Type = dto.Type,
            VolumeHoraire = dto.VolumeHoraire, HeuresPlanifiees = 0,
            NiveauId = dto.NiveauId, FiliereId = dto.FiliereId
        };
        foreach (var eid in dto.EnseignantIds)
            c.Enseignants.Add(new CoursEnseignant { Cours = c, EnseignantId = eid });
        _db.Cours.Add(c);
        _db.Journal.Add(new LogEntry { Action = LogAction.Ajout, Entite = $"Cours {c.Intitule}" });
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = c.Id }, _map.Map<CoursDto>(await Query().FirstAsync(x => x.Id == c.Id)));
    }

    [HttpPut("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, CoursDto dto)
    {
        var c = await _db.Cours.Include(x => x.Enseignants).FirstOrDefaultAsync(x => x.Id == id);
        if (c is null) return NotFound();
        c.Intitule = dto.Intitule; c.Type = dto.Type; c.VolumeHoraire = dto.VolumeHoraire;
        c.NiveauId = dto.NiveauId; c.FiliereId = dto.FiliereId;
        _db.CoursEnseignants.RemoveRange(c.Enseignants);
        foreach (var eid in dto.EnseignantIds)
            _db.CoursEnseignants.Add(new CoursEnseignant { CoursId = c.Id, EnseignantId = eid });
        _db.Journal.Add(new LogEntry { Action = LogAction.Modification, Entite = $"Cours {c.Intitule}" });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var c = await _db.Cours.FindAsync(id);
        if (c is null) return NotFound();
        _db.Cours.Remove(c);
        _db.Journal.Add(new LogEntry { Action = LogAction.Suppression, Entite = $"Cours {c.Intitule}" });
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
