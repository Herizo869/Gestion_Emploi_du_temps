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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SlotEDTDto>>> Get(
        [FromQuery] Guid? semestreId, [FromQuery] Guid? niveauId,
        [FromQuery] Guid? filiereId, [FromQuery] Guid? salleId)
    {
        var q = Base();
        if (semestreId.HasValue) q = q.Where(s => s.SemestreId == semestreId);
        if (niveauId.HasValue)   q = q.Where(s => s.NiveauId == niveauId);
        if (filiereId.HasValue)  q = q.Where(s => s.FiliereId == filiereId);
        if (salleId.HasValue)    q = q.Where(s => s.SalleId == salleId);
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
