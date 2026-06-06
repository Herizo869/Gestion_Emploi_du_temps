using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Emit.Api.Entities;
using Microsoft.IdentityModel.Tokens;

namespace Emit.Api.Services;

public interface ITokenService
{
    string Create(User user);
}

public class TokenService : ITokenService
{
    private readonly IConfiguration _cfg;
    public TokenService(IConfiguration cfg) => _cfg = cfg;

    public string Create(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, $"{user.Prenom} {user.Nom}"),
            new(ClaimTypes.Role, user.Role.ToString()),
        };
        if (user.EnseignantId.HasValue)
            claims.Add(new Claim("enseignantId", user.EnseignantId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: _cfg["Jwt:Issuer"],
            audience: _cfg["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_cfg["Jwt:ExpiresMinutes"] ?? "120")),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
