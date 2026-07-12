using AutoMapper;
using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Entities;
using Emit.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;

[ApiController, Authorize, Route("api/enseignants")]
public class EnseignantsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMapper _map;
    private readonly ISupabaseAdminService _supabase;
    private readonly IEmailService _email;
    private readonly ILogger<EnseignantsController> _logger;

    public EnseignantsController(
        AppDbContext db,
        IMapper map,
        ISupabaseAdminService supabase,
        IEmailService email,
        ILogger<EnseignantsController> logger)
    {
        _db = db; _map = map;
        _supabase = supabase;
        _email = email;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EnseignantDto>>> GetAll()
        => Ok(_map.Map<List<EnseignantDto>>(await _db.Enseignants
            .Include(e => e.Cours)
            .Include(e => e.Disponibilites)
            .Include(e => e.Slots)
            .ToListAsync()));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EnseignantDto>> Get(Guid id)
    {
        var e = await _db.Enseignants
            .Include(x => x.Cours)
            .Include(x => x.Disponibilites)
            .Include(x => x.Slots)
            .FirstOrDefaultAsync(x => x.Id == id);
        return e is null ? NotFound() : _map.Map<EnseignantDto>(e);
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<EnseignantDto>> Create(EnseignantDto dto)
    {
        // 1️⃣ Générer un mot de passe temporaire sécurisé
        var tempPassword = GenerateTemporaryPassword();
        var fullName = $"{dto.Prenom} {dto.Nom}";

        // 2️⃣ Créer le compte Supabase Auth en premier (avant toute sauvegarde DB)
        var supabaseResult = await _supabase.CreateUserAsync(dto.Email, tempPassword, fullName);

        if (!supabaseResult.Success)
        {
            _logger.LogError("Échec création Supabase Auth pour {Email}: {Error}", dto.Email, supabaseResult.Error);
            return BadRequest(new { message = $"Impossible de créer le compte enseignant : {supabaseResult.Error}" });
        }

        // 3️⃣ Créer l'entité Enseignant en mémoire
        var e = _map.Map<Enseignant>(dto);
        e.Id = Guid.NewGuid();
        e.SupabaseAuthUserId = supabaseResult.AuthUserId;
        _db.Enseignants.Add(e);

        // 4️⃣ Créer le User local (table Users) pour la compatibilité BCrypt/JWT
        var localUser = new User
        {
            Id = Guid.NewGuid(),
            Prenom = dto.Prenom,
            Nom = dto.Nom,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
            Role = Role.Enseignant,
            EnseignantId = e.Id
        };
        _db.Users.Add(localUser);

        // 5️⃣ Journaliser
        _db.Journal.Add(new LogEntry { Action = LogAction.Ajout, Entite = $"Enseignant {e.Prenom} {e.Nom}" });
        await _db.SaveChangesAsync();

        // 6️⃣ Envoyer l'email de bienvenue (en arrière-plan, ne pas bloquer si échec)
        _ = Task.Run(async () =>
        {
            try
            {
                var emailResult = await _email.SendWelcomeEmailAsync(dto.Email, fullName, tempPassword);
                if (!emailResult.Success)
                    _logger.LogWarning("Échec envoi email à {Email}: {Error}", dto.Email, emailResult.Error);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Exception lors de l'envoi de l'email à {Email}", dto.Email);
            }
        });

        // 7️⃣ Retourner la réponse
        var resultDto = _map.Map<EnseignantDto>(e);
        return CreatedAtAction(nameof(Get), new { id = e.Id }, resultDto);
    }

    /// <summary>
    /// Génère un mot de passe temporaire sécurisé (12 caractères, mixte)
    /// </summary>
    private static string GenerateTemporaryPassword()
    {
        const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string lower = "abcdefghijkmnpqrstuvwxyz";
        const string digits = "23456789";
        const string special = "!@#$%&";
        const string all = upper + lower + digits + special;

        var random = Random.Shared;
        var chars = new char[12];

        // Au moins 1 de chaque catégorie
        chars[0] = upper[random.Next(upper.Length)];
        chars[1] = lower[random.Next(lower.Length)];
        chars[2] = digits[random.Next(digits.Length)];
        chars[3] = special[random.Next(special.Length)];

        // Remplir le reste
        for (int i = 4; i < chars.Length; i++)
            chars[i] = all[random.Next(all.Length)];

        // Mélanger
        for (int i = chars.Length - 1; i > 0; i--)
        {
            int j = random.Next(i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }

        return new string(chars);
    }

    [HttpPut("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, EnseignantDto dto)
    {
        var e = await _db.Enseignants.FindAsync(id);
        if (e is null) return NotFound();
        e.Prenom = dto.Prenom; e.Nom = dto.Nom; e.Email = dto.Email;
        e.Specialite = dto.Specialite; e.Statut = dto.Statut;
        _db.Journal.Add(new LogEntry { Action = LogAction.Modification, Entite = $"Enseignant {e.Prenom} {e.Nom}" });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var e = await _db.Enseignants.FindAsync(id);
        if (e is null) return NotFound();
        _db.Enseignants.Remove(e);
        _db.Journal.Add(new LogEntry { Action = LogAction.Suppression, Entite = $"Enseignant {e.Prenom} {e.Nom}" });
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
