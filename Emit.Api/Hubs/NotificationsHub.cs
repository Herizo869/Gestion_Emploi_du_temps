using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Emit.Api.Hubs;

/// <summary>
/// Hub temps réel pour les notifications. Chaque utilisateur connecté rejoint
/// un groupe nommé d'après son UserId (claim NameIdentifier), ce qui permet de
/// cibler précisément les push sans diffuser à tout le monde.
/// </summary>
[Authorize]
public class NotificationsHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);

        await base.OnDisconnectedAsync(exception);
    }
}