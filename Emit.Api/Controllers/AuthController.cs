using Emit.Api.Data;
using Emit.Api.Dtos.Auth;
using Emit.Api.Entities;
using Emit.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITokenService _token;

    public AuthController(AppDbContext db, ITokenService token)
    {
        _db = db; _token = token;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Email == dto.Email);
        if (u is null || !BCrypt.Net.BCrypt.Verify(dto.Password, u.PasswordHash))
            return Unauthorized(new { message = "Identifiants invalides" });

        // 🔒 Vérifier que l'enseignant est bien lié à un compte dans la table Enseignants
        if (u.Role == Role.Enseignant && u.EnseignantId is null)
        {
            return StatusCode(403, new
            {
                message = "Votre compte n'a pas encore été créé ou validé par un administrateur. " +
                          "Veuillez contacter l'administration pour activer votre accès."
            });
        }

        return Ok(new AuthResponseDto
        {
            Token = _token.Create(u),
            User = new UserDto
            {
                Id = u.Id, Prenom = u.Prenom, Nom = u.Nom, Email = u.Email,
                Role = u.Role.ToString(), EnseignantId = u.EnseignantId
            }
        });
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> Register(RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return Conflict(new { message = "Email déjà utilisé" });

        if (!Enum.TryParse<Role>(dto.Role, true, out var role))
            return BadRequest(new { message = "Role invalide" });

        var u = new User
        {
            Prenom = dto.Prenom, Nom = dto.Nom, Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role, EnseignantId = dto.EnseignantId
        };
        _db.Users.Add(u);
        await _db.SaveChangesAsync();

        return Ok(new UserDto
        {
            Id = u.Id, Prenom = u.Prenom, Nom = u.Nom, Email = u.Email,
            Role = u.Role.ToString(), EnseignantId = u.EnseignantId
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var idStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(idStr, out var id)) return Unauthorized();
        var u = await _db.Users.FindAsync(id);
        if (u is null) return NotFound();
        return new UserDto
        {
            Id = u.Id, Prenom = u.Prenom, Nom = u.Nom, Email = u.Email,
            Role = u.Role.ToString(), EnseignantId = u.EnseignantId
        };
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateProfile(UpdateProfileDto dto)
    {
        var idStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(idStr, out var id)) return Unauthorized();
        var u = await _db.Users.FindAsync(id);
        if (u is null) return NotFound();

        // Vérifier si l'email est déjà pris par un autre utilisateur
        if (u.Email != dto.Email && await _db.Users.AnyAsync(x => x.Email == dto.Email))
            return Conflict(new { message = "Email déjà utilisé" });

        u.Prenom = dto.Prenom;
        u.Nom = dto.Nom;
        u.Email = dto.Email;
        await _db.SaveChangesAsync();

        return new UserDto
        {
            Id = u.Id, Prenom = u.Prenom, Nom = u.Nom, Email = u.Email,
            Role = u.Role.ToString(), EnseignantId = u.EnseignantId
        };
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var idStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(idStr, out var id)) return Unauthorized();
        var u = await _db.Users.FindAsync(id);
        if (u is null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, u.PasswordHash))
            return BadRequest(new { message = "Mot de passe actuel incorrect" });

        u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Mot de passe modifié avec succès" });
    }
}
