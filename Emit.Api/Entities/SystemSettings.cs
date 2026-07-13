namespace Emit.Api.Entities;

public class SystemSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // ── Établissement ──────────────────────────────────────
    public string EtablissementNom { get; set; } = "EMIT";
    public string EtablissementSousTitre { get; set; } = "Établissement de Management et des Technologies de l'Information";

    // ── Email / SMTP ────────────────────────────────────────
    public bool EmailEnabled { get; set; } = true;
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = "";
    public string SmtpPass { get; set; } = "";
    public string FromEmail { get; set; } = "";
    public string FromName { get; set; } = "EMIT EDT";
    public string LoginUrl { get; set; } = "http://localhost:5173/login";

    // ── Politique de mot de passe ───────────────────────────
    public int PwdMinLength { get; set; } = 6;
    public bool PwdRequireUppercase { get; set; }
    public bool PwdRequireDigit { get; set; }
    public bool PwdRequireSpecial { get; set; }
}