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

    [HttpGet]
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

    [HttpPost("{id:guid}/publish"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var s = await _db.Semestres.FindAsync(id);
        if (s is null) return NotFound();
        s.Statut = StatutSemestre.Publie;
        s.DatePublication = DateTime.UtcNow;
        _db.Journal.Add(new LogEntry { Action = LogAction.Publication, Entite = $"Semestre {s.Libelle} {s.Annee}" });
        await _db.SaveChangesAsync();
        return Ok(_map.Map<SemestreDto>(s));
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
