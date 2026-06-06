using AutoMapper;
using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;

[ApiController, Authorize, Route("api/enseignants")]
public class EnseignantsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMapper _map;
    public EnseignantsController(AppDbContext db, IMapper map) { _db = db; _map = map; }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EnseignantDto>>> GetAll()
        => Ok(_map.Map<List<EnseignantDto>>(await _db.Enseignants.Include(e => e.Cours).ToListAsync()));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EnseignantDto>> Get(Guid id)
    {
        var e = await _db.Enseignants.Include(x => x.Cours).FirstOrDefaultAsync(x => x.Id == id);
        return e is null ? NotFound() : _map.Map<EnseignantDto>(e);
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<EnseignantDto>> Create(EnseignantDto dto)
    {
        var e = _map.Map<Enseignant>(dto);
        e.Id = Guid.NewGuid();
        _db.Enseignants.Add(e);
        _db.Journal.Add(new LogEntry { Action = LogAction.Ajout, Entite = $"Enseignant {e.Prenom} {e.Nom}" });
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = e.Id }, _map.Map<EnseignantDto>(e));
    }

    [HttpPut("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, EnseignantDto dto)
    {
        var e = await _db.Enseignants.FindAsync(id);
        if (e is null) return NotFound();
        e.Prenom = dto.Prenom; e.Nom = dto.Nom; e.Email = dto.Email;
        e.Specialite = dto.Specialite; e.Statut = dto.Statut;
        _db.Journal.Add(new LogEntry { Action = LogAction.Modification, Entite = $"Enseignant {e.Prenom} {e.Nom}" });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var e = await _db.Enseignants.FindAsync(id);
        if (e is null) return NotFound();
        _db.Enseignants.Remove(e);
        _db.Journal.Add(new LogEntry { Action = LogAction.Suppression, Entite = $"Enseignant {e.Prenom} {e.Nom}" });
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
