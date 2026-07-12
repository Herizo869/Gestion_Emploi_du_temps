using System.Net;
using System.Net.Mail;

namespace Emit.Api.Services;

public class EmailResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
}

public interface IEmailService
{
    /// <summary>
    /// Envoie un email de bienvenue avec les identifiants de connexion à un enseignant
    /// </summary>
    Task<EmailResult> SendWelcomeEmailAsync(string toEmail, string toName, string temporaryPassword, CancellationToken ct = default);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _cfg;
    private readonly ILogger<EmailService> _logger;
    private readonly bool _enabled;

    public EmailService(IConfiguration cfg, ILogger<EmailService> logger)
    {
        _cfg = cfg;
        _logger = logger;
        _enabled = cfg.GetValue<bool>("Email:Enabled");
    }

    public async Task<EmailResult> SendWelcomeEmailAsync(string toEmail, string toName, string temporaryPassword, CancellationToken ct = default)
    {
        if (!_enabled)
        {
            _logger.LogInformation("[EMAIL SIMULÉ] Destinataire: {ToName} <{ToEmail}>", toName, toEmail);
            _logger.LogInformation("[EMAIL SIMULÉ] Sujet: Vos identifiants de connexion EMIT EDT");
            _logger.LogInformation("[EMAIL SIMULÉ] Mot de passe temporaire: {Pwd}", temporaryPassword);
            _logger.LogInformation("[EMAIL SIMULÉ] URL de connexion: {Url}", _cfg["Email:LoginUrl"] ?? "http://localhost:5173/login");
            return new EmailResult { Success = true };
        }

        try
        {
            var smtpHost = _cfg["Email:SmtpHost"] ?? throw new InvalidOperationException("Email:SmtpHost is not configured");
            var smtpPort = _cfg.GetValue<int>("Email:SmtpPort");
            var smtpUser = _cfg["Email:SmtpUser"];
            var smtpPass = _cfg["Email:SmtpPass"];
            var fromEmail = _cfg["Email:FromEmail"] ?? "noreply@emit.mg";
            var fromName = _cfg["Email:FromName"] ?? "EMIT EDT";
            var loginUrl = _cfg["Email:LoginUrl"] ?? "http://localhost:5173/login";

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(smtpUser, smtpPass)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = "Bienvenue sur EMIT EDT - Vos identifiants de connexion",
                IsBodyHtml = true,
                Body = BuildWelcomeHtml(toName, toEmail, temporaryPassword, loginUrl)
            };

            message.To.Add(new MailAddress(toEmail, toName));
            await client.SendMailAsync(message, ct);

            _logger.LogInformation("Email de bienvenue envoyé à {ToEmail}", toEmail);
            return new EmailResult { Success = true };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'envoi de l'email à {ToEmail}", toEmail);
            return new EmailResult { Success = false, Error = ex.Message };
        }
    }

    private static string BuildWelcomeHtml(string name, string email, string tempPassword, string loginUrl)
    {
        return $@"
<!DOCTYPE html>
<html lang=""fr"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
</head>
<body style=""margin:0; padding:0; background-color:#f4f6f9; font-family: 'Segoe UI', Arial, sans-serif;"">
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#f4f6f9; padding:40px 20px;"">
        <tr>
            <td align=""center"">
                <table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);"">
                    <!-- Header -->
                    <tr>
                        <td style=""background: linear-gradient(135deg, #0B1D3A 0%, #1A3A6B 100%); padding:32px 40px; text-align:center;"">
                            <h1 style=""color:#ffffff; margin:0; font-size:24px; font-weight:700;"">EMIT EDT</h1>
                            <p style=""color:#8BA4C7; margin:8px 0 0; font-size:14px;"">Système de Gestion d'Emploi du Temps</p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style=""padding:32px 40px;"">
                            <p style=""color:#1e293b; font-size:16px; margin:0 0 20px;"">Bonjour <strong>{name}</strong>,</p>
                            <p style=""color:#475569; font-size:14px; line-height:1.6; margin:0 0 24px;"">
                                Votre compte enseignant a été créé avec succès sur la plateforme EMIT EDT.
                                Vous trouverez ci-dessous vos identifiants de connexion provisoires.
                            </p>

                            <!-- Identifiants -->
                            <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:24px;"">
                                <tr>
                                    <td style=""padding:20px;"">
                                        <table width=""100%"">
                                            <tr>
                                                <td style=""padding:6px 0;"">
                                                    <span style=""color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;"">Email</span>
                                                    <p style=""color:#0B1D3A; font-size:15px; font-weight:600; margin:2px 0;"">{email}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style=""padding:6px 0;"">
                                                    <span style=""color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;"">Mot de passe temporaire</span>
                                                    <p style=""color:#0B1D3A; font-size:15px; font-weight:600; margin:2px 0; font-family: 'Courier New', monospace; letter-spacing:1px; background:#e2e8f0; display:inline-block; padding:4px 12px; border-radius:4px;"">{tempPassword}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Instructions -->
                            <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#eff6ff; border-radius:8px; border:1px solid #bfdbfe; margin-bottom:24px;"">
                                <tr>
                                    <td style=""padding:16px 20px;"">
                                        <p style=""color:#1e40af; font-size:13px; font-weight:600; margin:0 0 8px;"">📋 Prochaines étapes :</p>
                                        <ol style=""color:#1e40af; font-size:13px; line-height:1.8; margin:0; padding-left:20px;"">
                                            <li>Cliquez sur le bouton ci-dessous pour accéder à la page de connexion</li>
                                            <li>Connectez-vous avec votre email et le mot de passe temporaire</li>
                                            <li>Changez votre mot de passe dans les paramètres de votre profil</li>
                                            <li>Renseignez vos disponibilités pour le semestre en cours</li>
                                        </ol>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
                                <tr>
                                    <td align=""center"" style=""padding:0 0 24px;"">
                                        <a href=""{loginUrl}""
                                           style=""display:inline-block; background:linear-gradient(135deg, #0B1D3A 0%, #1A3A6B 100%); color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 36px; border-radius:8px;"">
                                            Se connecter à EMIT EDT
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style=""color:#94a3b8; font-size:12px; line-height:1.5; margin:0; border-top:1px solid #e2e8f0; padding-top:20px;"">
                                Cet email est automatique. Pour des raisons de sécurité, veuillez changer votre mot de passe dès votre première connexion.<br>
                                Si vous n'avez pas demandé la création de ce compte, veuillez ignorer cet email.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style=""background-color:#f8fafc; padding:16px 40px; text-align:center; border-top:1px solid #e2e8f0;"">
                            <p style=""color:#94a3b8; font-size:11px; margin:0;"">EMIT — Établissement de Management et des Technologies de l'Information</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
    }
}
