using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize(Roles = "Admin")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SettingsController(AppDbContext db) => _db = db;

    /// <summary>Récupère les paramètres système</summary>
    [HttpGet]
    public async Task<ActionResult<SystemSettingsDto>> Get()
    {
        var settings = await _db.SystemSettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            // Créer les paramètres par défaut si la table est vide
            settings = new SystemSettings();
            _db.SystemSettings.Add(settings);
            await _db.SaveChangesAsync();
        }

        return Ok(MapToDto(settings));
    }

    /// <summary>Met à jour les paramètres système</summary>
    [HttpPut]
    public async Task<ActionResult<SystemSettingsDto>> Update(SystemSettingsDto dto)
    {
        var settings = await _db.SystemSettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new SystemSettings();
            _db.SystemSettings.Add(settings);
        }

        // Établissement
        settings.EtablissementNom = dto.EtablissementNom;
        settings.EtablissementSousTitre = dto.EtablissementSousTitre;

        // Email
        settings.EmailEnabled = dto.EmailEnabled;
        settings.SmtpHost = dto.SmtpHost;
        settings.SmtpPort = dto.SmtpPort;
        settings.SmtpUser = dto.SmtpUser;
        if (!string.IsNullOrEmpty(dto.SmtpPass)) // Ne pas écraser si vide (mot de passe caché)
            settings.SmtpPass = dto.SmtpPass;
        settings.FromEmail = dto.FromEmail;
        settings.FromName = dto.FromName;
        settings.LoginUrl = dto.LoginUrl;

        // Politique mot de passe
        settings.PwdMinLength = dto.PwdMinLength;
        settings.PwdRequireUppercase = dto.PwdRequireUppercase;
        settings.PwdRequireDigit = dto.PwdRequireDigit;
        settings.PwdRequireSpecial = dto.PwdRequireSpecial;

        settings.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(MapToDto(settings));
    }

    private static SystemSettingsDto MapToDto(SystemSettings s) => new()
    {
        EtablissementNom = s.EtablissementNom,
        EtablissementSousTitre = s.EtablissementSousTitre,
        EmailEnabled = s.EmailEnabled,
        SmtpHost = s.SmtpHost,
        SmtpPort = s.SmtpPort,
        SmtpUser = s.SmtpUser,
        SmtpPass = "", // Ne jamais renvoyer le mot de passe
        FromEmail = s.FromEmail,
        FromName = s.FromName,
        LoginUrl = s.LoginUrl,
        PwdMinLength = s.PwdMinLength,
        PwdRequireUppercase = s.PwdRequireUppercase,
        PwdRequireDigit = s.PwdRequireDigit,
        PwdRequireSpecial = s.PwdRequireSpecial,
    };
}
