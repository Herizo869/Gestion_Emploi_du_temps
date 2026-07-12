using System.Text;
using System.Security.Claims;

using Emit.Api.Data;
using Emit.Api.Entities;
using Emit.Api.Mappings;
using Emit.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

// --- DB ---
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(cfg.GetConnectionString("Default"),
        npgsqlOptions => npgsqlOptions.CommandTimeout(120)));

// Désactiver les logs SQL verbose
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Warning);

// --- Services ---
builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEdtGeneratorService, EdtGeneratorService>();

// --- JWT (validation Supabase Auth via JWKS) ---
var supabaseUrl = cfg["Supabase:Url"]!;

// Récupère automatiquement les clés publiques depuis le endpoint JWKS de Supabase
// (les nouveaux projets Supabase utilisent ES256/RS256 asymétrique, pas HS256)
var jwksUrl = $"{supabaseUrl}/auth/v1/.well-known/openid-configuration";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.MapInboundClaims = false;
        opt.ConfigurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            jwksUrl,
            new OpenIdConnectConfigurationRetriever(),
            new HttpDocumentRetriever { RequireHttps = true });

        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromMinutes(1),
        };

        opt.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogWarning("Échec validation JWT : {Message}", context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var sub = context.Principal?.FindFirst("sub")?.Value;
                try
                {
                    if (Guid.TryParse(sub, out var supabaseUserId))
                    {
                        var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                        var profile = await db.Profiles.AsNoTracking()
                            .FirstOrDefaultAsync(p => p.Id == supabaseUserId);

                        if (profile is not null)
                        {
                            var identity = (ClaimsIdentity)context.Principal!.Identity!;
                            var roleClaim = profile.Role == "admin" ? "Admin" : "Enseignant";
                            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, profile.Id.ToString()));
                            identity.AddClaim(new Claim(ClaimTypes.Email, profile.Email));
                            identity.AddClaim(new Claim(ClaimTypes.Name, profile.FullName ?? profile.Email));
                            identity.AddClaim(new Claim(ClaimTypes.Role, roleClaim));

                            var enseignant = await db.Enseignants.AsNoTracking()
                                .FirstOrDefaultAsync(e => e.Email == profile.Email);
                            if (enseignant is not null)
                                identity.AddClaim(new Claim("enseignantId", enseignant.Id.ToString()));

                            return;
                        }
                    }
                }
                catch (Exception ex)
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    logger.LogWarning(ex, "Erreur OnTokenValidated, fallback sur les claims JWT");
                }

                // Fallback : utiliser les claims du JWT directement
                var emailClaim = context.Principal?.FindFirst("email")?.Value ?? "";
                var fallbackIdentity = (ClaimsIdentity)context.Principal!.Identity!;
                fallbackIdentity.AddClaim(new Claim(ClaimTypes.NameIdentifier, sub ?? Guid.NewGuid().ToString()));
                fallbackIdentity.AddClaim(new Claim(ClaimTypes.Email, emailClaim));
                fallbackIdentity.AddClaim(new Claim(ClaimTypes.Name, emailClaim));
                // Admin détecté par email (temporaire, à remplacer)
                var fallbackRole = emailClaim == "miaroandriamanalintsoa007@gmail.com" ? "Admin" : "Enseignant";
                fallbackIdentity.AddClaim(new Claim(ClaimTypes.Role, fallbackRole));

                if (Guid.TryParse(sub, out _))
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    logger.LogInformation("Fallback auth réussi pour {Email} (rôle: {Role})", emailClaim, fallbackRole);
                }
            },
        };
    });
builder.Services.AddAuthorization();

// --- CORS ---
var origins = cfg.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(o => o.AddPolicy("Front", p =>
    p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

// --- API + Swagger ---
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "EMIT API", Version = "v1" });
    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    c.AddSecurityDefinition("Bearer", jwtScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { jwtScheme, Array.Empty<string>() } });
});

var app = builder.Build();

// Seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        await DbSeeder.SeedAsync(db);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning("Seed skipped or partial: {Message}", ex.Message);
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("Front");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();