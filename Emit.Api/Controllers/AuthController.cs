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
    private readonly ISupabaseAdminService _supabaseAdmin;

    public AuthController(AppDbContext db, ITokenService token, ISupabaseAdminService supabaseAdmin)
    {
        _db = db; _token = token; _supabaseAdmin = supabaseAdmin;
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
        // 🔑 Chercher par email (ClaimTypes.Email = email Supabase Auth)
        var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(emailClaim)) return Unauthorized();

        var u = await _db.Users.FirstOrDefaultAsync(x => x.Email == emailClaim);
        if (u is null) return NotFound();

        // Vérifier si le nouvel email est déjà pris par un autre utilisateur
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
        // 🔑 Chercher par email (ClaimTypes.Email = email Supabase Auth)
        var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(emailClaim)) return Unauthorized();

        var u = await _db.Users.FirstOrDefaultAsync(x => x.Email == emailClaim);
        if (u is null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, u.PasswordHash))
            return BadRequest(new { message = "Mot de passe actuel incorrect" });

        u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Mot de passe modifié avec succès" });
    }

    /// <summary>
    /// ⚠️ ENDPOINT DE DÉPANNAGE — Sans authentification
    /// Réinitialise le mot de passe d'un utilisateur à la fois dans le backend C# ET Supabase Auth.
    /// Utile quand les mots de passe sont désynchronisés.
    ///
    /// À SUPPRIMER après usage !
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword(ResetPasswordDto dto)
    {
        // 1️⃣ Trouver l'utilisateur dans la base C# (avec son éventuel lien Enseignant)
        var u = await _db.Users.Include(x => x.Enseignant).FirstOrDefaultAsync(x => x.Email == dto.Email);
        if (u is null)
            return NotFound(new { message = "Aucun utilisateur trouvé avec cet email" });

        // 2️⃣ Mettre à jour le mot de passe dans le backend C#
        u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _db.SaveChangesAsync();

        // 3️⃣ Mettre à jour le mot de passe dans Supabase Auth
        // Le SupabaseAuthUserId est stocké sur l'entité Enseignant (si l'utilisateur est un enseignant)
        var supabaseAuthId = u.Enseignant?.SupabaseAuthUserId;
        if (!string.IsNullOrEmpty(supabaseAuthId))
        {
            var error = await _supabaseAdmin.UpdateUserPasswordAsync(supabaseAuthId, dto.NewPassword);
            if (error != null)
            {
                return Ok(new
                {
                    message = "Mot de passe mis à jour dans le backend C# uniquement. Supabase : " + error,
                    warning = "Le mot de passe Supabase n'a pas pu être mis à jour. Utilisez le Dashboard Supabase pour le reset."
                });
            }
        }
        else
        {
            // Si pas d'enseignant lié (admin pur), on ne peut pas updater Supabase via l'API Admin
            // car on n'a pas le SupabaseAuthUserId. L'admin devra le faire manuellement.
            return Ok(new
            {
                message = "Mot de passe mis à jour dans le backend C#. Pour Supabase Auth, réinitialisez-le depuis le Dashboard Supabase (Authentication > Users).",
                warning = "Supabase Auth non mis à jour (pas de SupabaseAuthUserId)"
            });
        }

        return Ok(new { message = "Mot de passe réinitialisé avec succès dans le backend C# et Supabase Auth ! Vous pouvez vous connecter avec le nouveau mot de passe." });
    }
}
