using AutoMapper;
using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;

[ApiController, Authorize, Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMapper _map;
    public SettingsController(AppDbContext db, IMapper map) { _db = db; _map = map; }

    private async Task<SystemSettings> GetOrCreateAsync()
    {
        var s = await _db.SystemSettings.FirstOrDefaultAsync();
        if (s is null)
        {
            s = new SystemSettings();
            _db.SystemSettings.Add(s);
            await _db.SaveChangesAsync();
        }
        return s;
    }

    [HttpGet]
    public async Task<ActionResult<SystemSettingsDto>> Get()
        => Ok(_map.Map<SystemSettingsDto>(await GetOrCreateAsync()));

    [HttpPut, Authorize(Roles = "Admin")]
    public async Task<ActionResult<SystemSettingsDto>> Update(SystemSettingsDto dto)
    {
        var s = await GetOrCreateAsync();

        s.EtablissementNom = dto.EtablissementNom;
        s.EtablissementSousTitre = dto.EtablissementSousTitre;

        s.EmailEnabled = dto.EmailEnabled;
        s.SmtpHost = dto.SmtpHost;
        s.SmtpPort = dto.SmtpPort;
        s.SmtpUser = dto.SmtpUser;
        // On n'écrase le mot de passe que si l'admin en a saisi un nouveau
        if (!string.IsNullOrWhiteSpace(dto.SmtpPass))
            s.SmtpPass = dto.SmtpPass;
        s.FromEmail = dto.FromEmail;
        s.FromName = dto.FromName;
        s.LoginUrl = dto.LoginUrl;

        s.PwdMinLength = dto.PwdMinLength;
        s.PwdRequireUppercase = dto.PwdRequireUppercase;
        s.PwdRequireDigit = dto.PwdRequireDigit;
        s.PwdRequireSpecial = dto.PwdRequireSpecial;

        _db.Journal.Add(new LogEntry { Action = LogAction.Modification, Entite = "Paramètres système" });
        await _db.SaveChangesAsync();

        return Ok(_map.Map<SystemSettingsDto>(s));
    }
}