namespace Emit.Api.Entities;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public NotifType Type { get; set; }
    public string Titre { get; set; } = null!;
    public string Description { get; set; } = "";
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public bool Lu { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
