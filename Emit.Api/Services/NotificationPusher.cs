using AutoMapper;
using Emit.Api.Dtos;
using Emit.Api.Entities;
using Emit.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Emit.Api.Services;

/// <summary>
/// Pousse les notifications déjà persistées en base vers les clients connectés
/// via SignalR. À appeler APRÈS SaveChangesAsync (on ne pousse que ce qui a
/// réellement été enregistré).
/// </summary>
public interface INotificationPusher
{
    Task PushAsync(Notification notification, CancellationToken ct = default);
    Task PushManyAsync(IEnumerable<Notification> notifications, CancellationToken ct = default);
}

public class NotificationPusher : INotificationPusher
{
    private readonly IHubContext<NotificationsHub> _hub;
    private readonly IMapper _map;

    public NotificationPusher(IHubContext<NotificationsHub> hub, IMapper map)
    {
        _hub = hub;
        _map = map;
    }

    public Task PushAsync(Notification notification, CancellationToken ct = default)
    {
        var dto = _map.Map<NotificationDto>(notification);
        // Le groupe correspond à l'UserId (voir NotificationsHub.OnConnectedAsync)
        return _hub.Clients.Group(notification.UserId.ToString())
            .SendAsync("ReceiveNotification", dto, ct);
    }

    public async Task PushManyAsync(IEnumerable<Notification> notifications, CancellationToken ct = default)
    {
        foreach (var n in notifications)
            await PushAsync(n, ct);
    }
}