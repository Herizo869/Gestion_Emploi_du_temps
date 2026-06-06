namespace Emit.Api.Entities;

public class LogEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public Guid? UtilisateurId { get; set; }
    public string Utilisateur { get; set; } = "Admin";
    public LogAction Action { get; set; }
    public string Entite { get; set; } = null!;
    public string? Ancien { get; set; }
    public string? Nouveau { get; set; }
}
