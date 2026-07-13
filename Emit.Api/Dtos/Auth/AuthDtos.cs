using System.ComponentModel.DataAnnotations;

namespace Emit.Api.Dtos.Auth;

public class LoginDto
{
    [Required, EmailAddress] public string Email { get; set; } = null!;
    [Required, MinLength(6)] public string Password { get; set; } = null!;
}

public class RegisterDto
{
    [Required] public string Prenom { get; set; } = null!;
    [Required] public string Nom { get; set; } = null!;
    [Required, EmailAddress] public string Email { get; set; } = null!;
    [Required, MinLength(6)] public string Password { get; set; } = null!;
    [Required] public string Role { get; set; } = "Enseignant";
    public Guid? EnseignantId { get; set; }
}

public class UpdateProfileDto
{
    [Required] public string Prenom { get; set; } = null!;
    [Required] public string Nom { get; set; } = null!;
    [Required, EmailAddress] public string Email { get; set; } = null!;
}

public class ChangePasswordDto
{
    [Required, MinLength(6)] public string CurrentPassword { get; set; } = null!;
    [Required, MinLength(6)] public string NewPassword { get; set; } = null!;
}

/// <summary>
/// DTO pour le reset de mot de passe (dépannage — sans auth)
/// </summary>
public class ResetPasswordDto
{
    [Required, EmailAddress] public string Email { get; set; } = null!;
    [Required, MinLength(6)] public string NewPassword { get; set; } = null!;
}

public class AuthResponseDto
{
    public string Token { get; set; } = null!;
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Prenom { get; set; } = null!;
    public string Nom { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
    public Guid? EnseignantId { get; set; }
}
