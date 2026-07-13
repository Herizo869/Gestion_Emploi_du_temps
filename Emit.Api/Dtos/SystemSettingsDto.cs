namespace Emit.Api.Dtos;

public class SystemSettingsDto
{
    public Guid Id { get; set; }
    // Établissement
    public string EtablissementNom { get; set; } = "EMIT";
    public string EtablissementSousTitre { get; set; } = "";

    // Email / SMTP
    public bool EmailEnabled { get; set; }
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = "";
    public string SmtpPass { get; set; } = "";
    public string FromEmail { get; set; } = "";
    public string FromName { get; set; } = "";
    public string LoginUrl { get; set; } = "";

    // Politique mot de passe
    public int PwdMinLength { get; set; } = 6;
    public bool PwdRequireUppercase { get; set; }
    public bool PwdRequireDigit { get; set; }
    public bool PwdRequireSpecial { get; set; }
}
