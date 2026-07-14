using AutoMapper;
using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Entities;
using Emit.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;

[ApiController, Authorize, Route("api/salles")]
public class SallesController : ControllerBase
{
    private readonly AppDbContext _db; private readonly IMapper _map;
    private readonly IEdtGeneratorService _gen;
    public SallesController(AppDbContext db, IMapper map, IEdtGeneratorService gen) { _db = db; _map = map; _gen = gen; }

    [HttpGet] public async Task<ActionResult<IEnumerable<SalleDto>>> GetAll()
        => Ok(_map.Map<List<SalleDto>>(await _db.Salles.ToListAsync()));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SalleDto>> Get(Guid id)
    {
        var s = await _db.Salles.FindAsync(id);
        return s is null ? NotFound() : _map.Map<SalleDto>(s);
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<SalleDto>> Create(SalleDto dto)
    {
        var s = _map.Map<Salle>(dto); s.Id = Guid.NewGuid();
        _db.Salles.Add(s);
        _db.Journal.Add(new LogEntry { Action = LogAction.Ajout, Entite = $"Salle {s.Numero}" });
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = s.Id }, _map.Map<SalleDto>(s));
    }

    [HttpPut("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, SalleDto dto)
    {
        var s = await _db.Salles.FindAsync(id);
        if (s is null) return NotFound();
        s.Numero = dto.Numero; s.Batiment = dto.Batiment; s.Capacite = dto.Capacite;
        s.Type = dto.Type; s.Disponible = dto.Disponible; s.Occupation = dto.Occupation;
        _db.Journal.Add(new LogEntry { Action = LogAction.Modification, Entite = $"Salle {s.Numero}" });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var s = await _db.Salles.FindAsync(id);
        if (s is null) return NotFound();

        // Supprimer d'abord les créneaux EDT liés à cette salle (FK Restrict)
        var slots = await _db.Slots.Where(sl => sl.SalleId == id).ToListAsync();
        _db.Slots.RemoveRange(slots);

        _db.Salles.Remove(s);
        _db.Journal.Add(new LogEntry { Action = LogAction.Suppression, Entite = $"Salle {s.Numero}" });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("recalculate-occupation"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> RecalculateOccupation()
    {
        await _gen.RecalculateOccupationsAsync();
        _db.Journal.Add(new LogEntry { Action = LogAction.Modification, Entite = "Occupation des salles recalculée" });
        await _db.SaveChangesAsync();
        var salles = await _db.Salles.ToListAsync();
        return Ok(_map.Map<List<SalleDto>>(salles));
    }
}
