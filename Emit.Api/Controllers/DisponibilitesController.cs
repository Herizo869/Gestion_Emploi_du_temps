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

[ApiController, Authorize, Route("api/disponibilites")]
public class DisponibilitesController : ControllerBase
{
    private readonly AppDbContext _db;
    public DisponibilitesController(AppDbContext db) { _db = db; }

    // GET /api/disponibilites/{enseignantId} — Admin
    [HttpGet("{enseignantId:guid}")]
    public async Task<IActionResult> Get(Guid enseignantId)
    {
        var dispos = await _db.Disponibilites
            .Where(d => d.EnseignantId == enseignantId)
            .ToListAsync();
        return Ok(dispos.Select(d => new DispoDto
        {
            Jour = d.Jour,
            Creneau = d.Creneau,
            EstDisponible = d.EstDisponible,
            EstIndisponible = d.EstIndisponible,
        }));
    }

    // PUT /api/disponibilites/{enseignantId} — Admin
    [HttpPut("{enseignantId:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Save(Guid enseignantId, [FromBody] List<DispoDto> dtos)
    {
        var existing = await _db.Disponibilites
            .Where(d => d.EnseignantId == enseignantId)
            .ToListAsync();
        _db.Disponibilites.RemoveRange(existing);

        var newDispos = dtos.Select(d => new Disponibilite
        {
            Id = Guid.NewGuid(),
            EnseignantId = enseignantId,
            Jour = d.Jour,
            Creneau = d.Creneau,
            EstDisponible = d.EstDisponible,
            EstIndisponible = d.EstIndisponible,
        });
        await _db.Disponibilites.AddRangeAsync(newDispos);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET /api/disponibilites/me — Enseignant connecté
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var email = User.Identity?.Name;
        var enseignant = await _db.Enseignants.FirstOrDefaultAsync(e => e.Email == email);
        if (enseignant is null) return NotFound();

        var dispos = await _db.Disponibilites
            .Where(d => d.EnseignantId == enseignant.Id)
            .ToListAsync();
        return Ok(dispos.Select(d => new DispoDto
        {
            Jour = d.Jour,
            Creneau = d.Creneau,
            EstDisponible = d.EstDisponible,
            EstIndisponible = d.EstIndisponible,
        }));
    }

    // PUT /api/disponibilites/me — Enseignant connecté
    [HttpPut("me")]
    public async Task<IActionResult> SaveMe([FromBody] List<DispoDto> dtos)
    {
        var email = User.Identity?.Name;
        var enseignant = await _db.Enseignants.FirstOrDefaultAsync(e => e.Email == email);
        if (enseignant is null) return NotFound();

        var existing = await _db.Disponibilites
            .Where(d => d.EnseignantId == enseignant.Id)
            .ToListAsync();
        _db.Disponibilites.RemoveRange(existing);

        var newDispos = dtos.Select(d => new Disponibilite
        {
            Id = Guid.NewGuid(),
            EnseignantId = enseignant.Id,
            Jour = d.Jour,
            Creneau = d.Creneau,
            EstDisponible = d.EstDisponible,
            EstIndisponible = d.EstIndisponible,
        });
        await _db.Disponibilites.AddRangeAsync(newDispos);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}