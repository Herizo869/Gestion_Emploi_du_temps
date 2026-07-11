using AutoMapper;
using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;

[ApiController, Authorize, Route("api/niveaux")]
public class NiveauxController : ControllerBase
{
    private readonly AppDbContext _db; private readonly IMapper _map;
    public NiveauxController(AppDbContext db, IMapper map) { _db = db; _map = map; }

    [HttpGet, AllowAnonymous]
    public async Task<ActionResult<IEnumerable<NiveauDto>>> GetAll()
    {
        var list = await _db.Niveaux.Include(n => n.Filieres).ThenInclude(f => f.Cours).ToListAsync();
        return Ok(_map.Map<List<NiveauDto>>(list));
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<NiveauDto>> Create(NiveauDto dto)
    {
        var n = new Niveau { Libelle = dto.Libelle, EffectifMax = dto.EffectifMax };
        _db.Niveaux.Add(n);
        await _db.SaveChangesAsync();
        return Ok(_map.Map<NiveauDto>(n));
    }
}

[ApiController, Authorize, Route("api/filieres")]
public class FilieresController : ControllerBase
{
    private readonly AppDbContext _db; private readonly IMapper _map;
    public FilieresController(AppDbContext db, IMapper map) { _db = db; _map = map; }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FiliereDto>>> GetAll([FromQuery] Guid? niveauId)
    {
        var q = _db.Filieres.Include(f => f.Cours).AsQueryable();
        if (niveauId.HasValue) q = q.Where(f => f.NiveauId == niveauId.Value);
        return Ok(_map.Map<List<FiliereDto>>(await q.ToListAsync()));
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<FiliereDto>> Create([FromBody] FiliereDto dto, [FromQuery] Guid niveauId)
    {
        var f = new Filiere { Libelle = dto.Libelle, Description = dto.Description, NiveauId = niveauId };
        _db.Filieres.Add(f);
        await _db.SaveChangesAsync();
        return Ok(_map.Map<FiliereDto>(f));
    }

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var f = await _db.Filieres.FindAsync(id);
        if (f is null) return NotFound();
        _db.Filieres.Remove(f);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    
}
