using Emit.Api.Data;
using Emit.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Services;

/// <summary>
/// Service de fond qui vérifie toutes les minutes si des cours sont terminés
/// et remet automatiquement les salles concernées à l'état "Disponible".
/// </summary>
public class SalleDisponibiliteService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SalleDisponibiliteService> _logger;

    // Correspondance enum Jour → DayOfWeek
    private static readonly Dictionary<Jour, DayOfWeek> JourMap = new()
    {
        { Jour.Lundi,    DayOfWeek.Monday    },
        { Jour.Mardi,    DayOfWeek.Tuesday   },
        { Jour.Mercredi, DayOfWeek.Wednesday },
        { Jour.Jeudi,    DayOfWeek.Thursday  },
        { Jour.Vendredi, DayOfWeek.Friday    },
    };

    public SalleDisponibiliteService(
        IServiceScopeFactory scopeFactory,
        ILogger<SalleDisponibiliteService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SalleDisponibiliteService démarré.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await LibererSallesTerminees();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la vérification de disponibilité des salles.");
            }

            // Attendre 1 minute avant la prochaine vérification
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }

        _logger.LogInformation("SalleDisponibiliteService arrêté.");
    }

    private async Task LibererSallesTerminees()
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var maintenant = TimeOnly.FromDateTime(DateTime.Now);
        var jourActuel = DateTime.Now.DayOfWeek;

        // Chercher tous les slots dont le cours est terminé aujourd'hui
        // (jour correspondant à aujourd'hui ET heure de fin dépassée)
        var slotsTermines = await db.Slots
            .Include(s => s.Salle)
            .Where(s => JourMap[s.Jour] == jourActuel && s.HeureFin <= maintenant)
            .ToListAsync();

        if (!slotsTermines.Any()) return;

        // Récupérer les IDs de salles avec des cours encore en cours ou à venir aujourd'hui
        var sallesEncoureOuAVenir = await db.Slots
            .Where(s => JourMap[s.Jour] == jourActuel && s.HeureFin > maintenant)
            .Select(s => s.SalleId)
            .Distinct()
            .ToListAsync();

        // Salles libérées = salles dont tous les cours du jour sont terminés
        var sallesALiberer = slotsTermines
            .Select(s => s.Salle)
            .DistinctBy(s => s.Id)
            .Where(s => !sallesEncoureOuAVenir.Contains(s.Id) && !s.Disponible)
            .ToList();

        if (!sallesALiberer.Any()) return;

        foreach (var salle in sallesALiberer)
        {
            salle.Disponible = true;
            _logger.LogInformation(
                "Salle {Numero} ({Batiment}) libérée automatiquement à {Heure}.",
                salle.Numero, salle.Batiment, maintenant);
        }

        await db.SaveChangesAsync();
        _logger.LogInformation("{Count} salle(s) remise(s) disponible(s).", sallesALiberer.Count);
    }
}
