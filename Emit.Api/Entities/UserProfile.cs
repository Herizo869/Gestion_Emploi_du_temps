namespace Emit.Api.Entities;

public class UserProfile
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "enseignant";
}