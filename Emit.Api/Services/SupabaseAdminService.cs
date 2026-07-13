using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Emit.Api.Services;

/// <summary>
/// Résultat de la création d'un utilisateur via l'API Admin Supabase
/// </summary>
public class SupabaseCreateUserResult
{
    public bool Success { get; set; }
    public string? AuthUserId { get; set; }
    public string? Error { get; set; }
}

public interface ISupabaseAdminService
{
    /// <summary>
    /// Crée un utilisateur dans Supabase Auth (auto-confirmed) via l'API Admin
    /// </summary>
    Task<SupabaseCreateUserResult> CreateUserAsync(string email, string password, string fullName, CancellationToken ct = default);

    /// <summary>
    /// Met à jour le mot de passe d'un utilisateur Supabase Auth via l'API Admin
    /// </summary>
    Task<string?> UpdateUserPasswordAsync(string authUserId, string newPassword, CancellationToken ct = default);

    /// <summary>
    /// Supprime un utilisateur dans Supabase Auth via l'API Admin.
    /// Entraîne la suppression en cascade de sa ligne dans public.profiles
    /// (si la FK profiles.id → auth.users.id est en ON DELETE CASCADE).
    /// Retourne null si succès, sinon un message d'erreur.
    /// </summary>
    Task<string?> DeleteUserAsync(string authUserId, CancellationToken ct = default);
}

public class SupabaseAdminService : ISupabaseAdminService
{
    private readonly HttpClient _http;
    private readonly ILogger<SupabaseAdminService> _logger;
    private readonly string _supabaseUrl;
    private readonly string _serviceRoleKey;

    public SupabaseAdminService(IHttpClientFactory httpFactory, IConfiguration cfg, ILogger<SupabaseAdminService> logger)
    {
        _logger = logger;
        _supabaseUrl = cfg["Supabase:Url"] ?? throw new InvalidOperationException("Supabase:Url is not configured");
        _serviceRoleKey = cfg["Supabase:ServiceRoleKey"] ?? throw new InvalidOperationException("Supabase:ServiceRoleKey is not configured");
        _http = httpFactory.CreateClient();
        _http.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<SupabaseCreateUserResult> CreateUserAsync(string email, string password, string fullName, CancellationToken ct = default)
    {
        try
        {
            var url = $"{_supabaseUrl.TrimEnd('/')}/auth/v1/admin/users";

            var payload = new
            {
                email,
                password,
                email_confirm = true,
                user_metadata = new
                {
                    full_name = fullName,
                    role = "enseignant"
                }
            };

            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });

            var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Supabase Admin API error ({StatusCode}): {Body}", response.StatusCode, responseBody);
                return new SupabaseCreateUserResult
                {
                    Success = false,
                    Error = $"Erreur API Supabase ({response.StatusCode}): {ExtractErrorMessage(responseBody)}"
                };
            }

            // Extraire l'ID de l'utilisateur créé
            using var doc = JsonDocument.Parse(responseBody);
            var authUserId = doc.RootElement.GetProperty("id").GetString();

            _logger.LogInformation("Compte Supabase Auth créé pour {Email} avec ID {AuthUserId}", email, authUserId);

            return new SupabaseCreateUserResult
            {
                Success = true,
                AuthUserId = authUserId
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la création du compte Supabase Auth pour {Email}", email);
            return new SupabaseCreateUserResult
            {
                Success = false,
                Error = ex.InnerException?.Message ?? ex.Message
            };
        }
    }

    /// <summary>
    /// Met à jour le mot de passe d'un utilisateur Supabase Auth via l'API Admin
    /// PUT /auth/v1/admin/users/{user_id}  body: { "password": "..." }
    /// </summary>
    public async Task<string?> UpdateUserPasswordAsync(string authUserId, string newPassword, CancellationToken ct = default)
    {
        try
        {
            var url = $"{_supabaseUrl.TrimEnd('/')}/auth/v1/admin/users/{authUserId}";

            var payload = new { password = newPassword };
            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });

            var request = new HttpRequestMessage(HttpMethod.Put, url);
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Supabase Admin API error (PUT user password) ({StatusCode}): {Body}", response.StatusCode, responseBody);
                return $"Erreur API Supabase ({response.StatusCode}): {ExtractErrorMessage(responseBody)}";
            }

            _logger.LogInformation("Mot de passe Supabase Auth mis à jour pour l'utilisateur {AuthUserId}", authUserId);
            return null; // Succès
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la mise à jour du mot de passe Supabase Auth pour {AuthUserId}", authUserId);
            return ex.InnerException?.Message ?? ex.Message;
        }
    }

    /// <summary>
    /// Supprime un utilisateur Supabase Auth via l'API Admin
    /// DELETE /auth/v1/admin/users/{user_id}
    /// </summary>
    public async Task<string?> DeleteUserAsync(string authUserId, CancellationToken ct = default)
    {
        try
        {
            var url = $"{_supabaseUrl.TrimEnd('/')}/auth/v1/admin/users/{authUserId}";

            var request = new HttpRequestMessage(HttpMethod.Delete, url);
            request.Headers.Add("apikey", _serviceRoleKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);

            var response = await _http.SendAsync(request, ct);

            // 404 = déjà supprimé côté Supabase, on considère ça comme un succès (idempotent)
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogInformation("Utilisateur Supabase Auth {AuthUserId} déjà absent (404), suppression ignorée", authUserId);
                return null;
            }

            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Supabase Admin API error (DELETE user) ({StatusCode}): {Body}", response.StatusCode, responseBody);
                return $"Erreur API Supabase ({response.StatusCode}): {ExtractErrorMessage(responseBody)}";
            }

            _logger.LogInformation("Compte Supabase Auth {AuthUserId} supprimé", authUserId);
            return null; // Succès
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la suppression du compte Supabase Auth {AuthUserId}", authUserId);
            return ex.InnerException?.Message ?? ex.Message;
        }
    }

    private static string ExtractErrorMessage(string responseBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            if (doc.RootElement.TryGetProperty("msg", out var msg))
                return msg.GetString() ?? responseBody;
            if (doc.RootElement.TryGetProperty("error_description", out var desc))
                return desc.GetString() ?? responseBody;
            if (doc.RootElement.TryGetProperty("message", out var message))
                return message.GetString() ?? responseBody;
        }
        catch { /* ignore */ }
        return responseBody;
    }
}