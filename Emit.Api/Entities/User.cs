namespace Emit.Api.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Prenom { get; set; } = null!;
    public string Nom { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public Role Role { get; set; }
    public Guid? EnseignantId { get; set; }
    public Enseignant? Enseignant { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
