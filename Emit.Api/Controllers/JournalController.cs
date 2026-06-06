using AutoMapper;
using Emit.Api.Data;
using Emit.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;

[ApiController, Authorize(Roles = "Admin"), Route("api/journal")]
public class JournalController : ControllerBase
{
    private readonly AppDbContext _db; private readonly IMapper _map;
    public JournalController(AppDbContext db, IMapper map) { _db = db; _map = map; }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LogEntryDto>>> GetAll([FromQuery] int take = 100)
    {
        var list = await _db.Journal.OrderByDescending(l => l.Date).Take(take).ToListAsync();
        return Ok(_map.Map<List<LogEntryDto>>(list));
    }
}
