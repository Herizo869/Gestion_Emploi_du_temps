using System.IdentityModel.Tokens.Jwt;
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

// Nécessaire pour SupabaseAdminService (IHttpClientFactory injecté dans son constructeur)
builder.Services.AddHttpClient();

// Création de compte Supabase Auth lors de l'ajout d'un enseignant (Admin API)
builder.Services.AddScoped<ISupabaseAdminService, SupabaseAdminService>();

// Envoi de l'email de bienvenue avec les identifiants temporaires
builder.Services.AddScoped<IEmailService, EmailService>();

// --- JWT (double validation : backend local + Supabase Auth via JWKS) ---
var supabaseUrl = cfg["Supabase:Url"]!;
var jwksUrl = $"{supabaseUrl}/auth/v1/.well-known/openid-configuration";
var localKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));

var jwtEvents = new JwtBearerEvents
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
        var emailClaim = context.Principal?.FindFirst(ClaimTypes.Email)?.Value
                      ?? context.Principal?.FindFirst("email")?.Value
                      ?? "";
        var identity = (ClaimsIdentity)context.Principal!.Identity!;

        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, sub ?? Guid.NewGuid().ToString()));
        identity.AddClaim(new Claim(ClaimTypes.Email, emailClaim));
        identity.AddClaim(new Claim(ClaimTypes.Name, emailClaim));

        var isAdmin = emailClaim == "miaroandriamanalintsoa007@gmail.com"
                   || emailClaim == "herizoandrian8@gmail.com"
                   || emailClaim == "admin@emit.mg";
        identity.AddClaim(new Claim(ClaimTypes.Role, isAdmin ? "Admin" : "Enseignant"));

        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();

        try
        {
            var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var enseignant = await db.Enseignants.AsNoTracking()
                .FirstOrDefaultAsync(e => EF.Functions.ILike(e.Email, emailClaim));

            if (enseignant is not null)
            {
                identity.AddClaim(new Claim("enseignantId", enseignant.Id.ToString()));
                logger.LogInformation(
                    "Claim enseignantId ajouté pour '{Email}' -> {EnseignantId}",
                    emailClaim, enseignant.Id);
            }
            else if (!isAdmin)
            {
                logger.LogWarning(
                    "Aucun enseignant trouvé en base pour l'email '{Email}' — le claim 'enseignantId' ne sera pas ajouté.",
                    emailClaim);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Erreur lors de la résolution de l'enseignant pour '{Email}'", emailClaim);
        }
    },
};

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "LocalOrSupabase";
    options.DefaultChallengeScheme = "LocalOrSupabase";
})
    // Schéma composite : essaie d'abord le token local, puis Supabase
    .AddPolicyScheme("LocalOrSupabase", "Local or Supabase", options =>
    {
        options.ForwardDefaultSelector = ctx =>
        {
            var auth = ctx.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(auth) || !auth.StartsWith("Bearer "))
                return "Supabase"; // anonymous → Supabase (AllowAnonymous gère le reste)

            try
            {
                var token = auth["Bearer ".Length..].Trim();
                // Les tokens Supabase commencent par "eyJ" (base64url) et contiennent un payload
                // qui a "iss": "https://{project}.supabase.co/auth/v1"
                // Les tokens locaux ont "iss": "EmitApi"
                var handler = new JwtSecurityTokenHandler();
                if (handler.CanReadToken(token))
                {
                    var jwt = handler.ReadJwtToken(token);
                    var iss = jwt.Issuer;
                    if (iss == cfg["Jwt:Issuer"])
                        return "Local";
                }
            }
            catch { }

            return "Supabase";
        };
    })
    // 1) Token local (HS256, signé par TokenService.cs)
    .AddJwtBearer("Local", opt =>
    {
        opt.MapInboundClaims = false;
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = cfg["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = cfg["Jwt:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = localKey,
            ClockSkew = TimeSpan.FromMinutes(1),
        };
        opt.Events = jwtEvents;
    })
    // 2) Token Supabase Auth (JWKS, ES256/RS256 asymétrique)
    .AddJwtBearer("Supabase", opt =>
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
                // Pas de requête sur profiles ici (évite de saturer le pool de connexions).
                // Le rôle est déterminé directement depuis les claims JWT Supabase.
                var sub = context.Principal?.FindFirst("sub")?.Value;
                var emailClaim = context.Principal?.FindFirst("email")?.Value ?? "";
                var identity = (ClaimsIdentity)context.Principal!.Identity!;

                identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, sub ?? Guid.NewGuid().ToString()));
                identity.AddClaim(new Claim(ClaimTypes.Email, emailClaim));
                identity.AddClaim(new Claim(ClaimTypes.Name, emailClaim));

                var isAdmin = emailClaim == "miaroandriamanalintsoa007@gmail.com" || emailClaim == "herizoandrian8@gmail.com";
                identity.AddClaim(new Claim(ClaimTypes.Role, isAdmin ? "Admin" : "Enseignant"));

                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();

                // Une seule requête légère pour lier l'enseignant (utilisé par EDT/me, cours/me, etc.)
                // Comparaison insensible à la casse (EF.Functions.ILike) pour éviter les faux négatifs
                // dus à une différence de casse entre l'email Supabase Auth et l'email en base.
                try
                {
                    var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();

                    var enseignant = await db.Enseignants.AsNoTracking()
                        .FirstOrDefaultAsync(e => EF.Functions.ILike(e.Email, emailClaim));

                    if (enseignant is not null)
                    {
                        identity.AddClaim(new Claim("enseignantId", enseignant.Id.ToString()));
                        logger.LogInformation(
                            "Claim enseignantId ajouté pour '{Email}' -> {EnseignantId}",
                            emailClaim, enseignant.Id);
                    }
                    else if (!isAdmin)
                    {
                        // Compte enseignant Supabase sans ligne correspondante dans Enseignants :
                        // toutes les routes "/me" liées à un enseignant renverront 403.
                        logger.LogWarning(
                            "Aucun enseignant trouvé en base pour l'email '{Email}' — le claim 'enseignantId' ne sera pas ajouté.",
                            emailClaim);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Erreur lors de la résolution de l'enseignant pour '{Email}'", emailClaim);
                    // Ignorer — le claim enseignantId est optionnel
                }
            },
        };
    });

builder.Services.AddAuthorization();

// --- CORS ---
var origins = cfg.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(o => o.AddPolicy("Front", p =>
    p.SetIsOriginAllowed(origin =>
        {
            if (args.Contains("--allow-all-origins")) return true;
            return origins.Any(o => o.Equals(origin, StringComparison.OrdinalIgnoreCase));
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .WithExposedHeaders("Content-Disposition", "Content-Length")));

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

// Validation des configurations critiques au démarrage
var serviceRoleKey = cfg["Supabase:ServiceRoleKey"];
if (string.IsNullOrWhiteSpace(serviceRoleKey))
    throw new InvalidOperationException(
        "Supabase:ServiceRoleKey n'est pas configuré. " +
        "Définissez la variable d'environnement Supabase__ServiceRoleKey " +
        "ou configurez-la dans appsettings.Development.json / launchSettings.json");

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