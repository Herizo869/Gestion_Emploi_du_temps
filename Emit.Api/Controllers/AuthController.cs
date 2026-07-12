using System.Security.Claims;
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
    public async Task<ActionResult> Me()
    {
        // Récupère les claims enrichis par OnTokenValidated (depuis public.profiles)
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var nameId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var name = User.FindFirst(ClaimTypes.Name)?.Value;
        var enseignantIdStr = User.FindFirst("enseignantId")?.Value;

        if (!string.IsNullOrEmpty(role) && !string.IsNullOrEmpty(email))
        {
            Guid? enseignantId = Guid.TryParse(enseignantIdStr, out var eid) ? eid : null;
            return Ok(new
            {
                Id = nameId,
                Email = email,
                Prenom = "",
                Nom = name ?? email,
                Role = role,
                EnseignantId = enseignantId,
            });
        }

        // Fallback : Users table locale (ancien système d'auth)
        if (!Guid.TryParse(nameId, out var id)) return Unauthorized();
        var u = await _db.Users.FindAsync(id);
        if (u is null) return NotFound();
        return Ok(new
        {
            u.Id, u.Prenom, u.Nom, u.Email,
            Role = u.Role.ToString(),
            EnseignantId = u.EnseignantId
        });
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
