using AutoMapper;
using Emit.Api.Data;
using Emit.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Emit.Api.Controllers;

[ApiController, Authorize, Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _db; private readonly IMapper _map;
    public NotificationsController(AppDbContext db, IMapper map) { _db = db; _map = map; }

    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetMine()
    {
        var list = await _db.Notifications
            .Where(n => n.UserId == UserId)
            .OrderByDescending(n => n.DateCreation).ToListAsync();
        return Ok(_map.Map<List<NotificationDto>>(list));
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var n = await _db.Notifications.FindAsync(id);
        if (n is null || n.UserId != UserId) return NotFound();
        n.Lu = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
