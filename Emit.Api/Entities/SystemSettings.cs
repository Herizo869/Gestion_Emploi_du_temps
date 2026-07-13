namespace Emit.Api.Entities;

/// <summary>
/// Paramètres système modifiables par l'admin (table mono-ligne)
/// </summary>
public class SystemSettings
{
    /// <summary>Identifiant fixe (toujours 1 — table mono-ligne)</summary>
    public int Id { get; set; } = 1;

    // ─── Établissement ───
    public string EtablissementNom { get; set; } = "EMIT";
    public string EtablissementSousTitre { get; set; } = "Établissement de Management et des Technologies de l'Information";

    // ─── Email / SMTP ───
    public bool EmailEnabled { get; set; }
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = "";
    public string SmtpPass { get; set; } = "";
    public string FromEmail { get; set; } = "noreply@emit.mg";
    public string FromName { get; set; } = "EMIT EDT";
    public string LoginUrl { get; set; } = "http://localhost:5173/login";

    // ─── Politique mot de passe ───
    public int PwdMinLength { get; set; } = 6;
    public bool PwdRequireUppercase { get; set; }
    public bool PwdRequireDigit { get; set; }
    public bool PwdRequireSpecial { get; set; }

    /// <summary>Date de dernière modification</summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
