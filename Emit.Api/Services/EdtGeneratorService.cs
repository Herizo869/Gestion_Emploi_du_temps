using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Services;

public interface IEdtGeneratorService
{
    Task<EdtGenerationResult> GenerateAsync(Guid semestreId);
    Task<List<ConflitDto>> DetectConflitsAsync(Guid semestreId);
    Task RecalculateOccupationsAsync();
}

public class EdtGenerationResult
{
    public int SlotsCrees { get; set; }
    public List<string> CoursNonPlanifies { get; set; } = new();
    public List<ConflitDto> Conflits { get; set; } = new();
}

public class EdtGeneratorService : IEdtGeneratorService
{
    private readonly AppDbContext _db;
    public EdtGeneratorService(AppDbContext db) => _db = db;

    // Créneaux standards (jour + horaire)
    private static readonly (TimeOnly debut, TimeOnly fin)[] Creneaux = new[]
    {
        (new TimeOnly(7,  0), new TimeOnly(8,  0)),
        (new TimeOnly(8,  0), new TimeOnly(9,  0)),
        (new TimeOnly(9,  0), new TimeOnly(10, 0)),
        (new TimeOnly(10, 0), new TimeOnly(11, 0)),
        (new TimeOnly(11, 0), new TimeOnly(12, 0)),
        (new TimeOnly(14, 0), new TimeOnly(15, 0)),
        (new TimeOnly(15, 0), new TimeOnly(16, 0)),
        (new TimeOnly(16, 0), new TimeOnly(17, 0)),
        (new TimeOnly(17, 0), new TimeOnly(18, 0)),
    };

    private static readonly Jour[] Jours =
        { Jour.Lundi, Jour.Mardi, Jour.Mercredi, Jour.Jeudi, Jour.Vendredi };

    // Parse "07h00 - 08h00" → (07:00, 08:00)
    private static bool TryParseCreneau(string creneau, out TimeOnly debut, out TimeOnly fin)
    {
        debut = default; fin = default;
        var parts = creneau.Split('-', StringSplitOptions.TrimEntries);
        if (parts.Length != 2) return false;
        var debutStr = parts[0].Trim().Replace('h', ':');
        var finStr   = parts[1].Trim().Replace('h', ':');
        return TimeOnly.TryParse(debutStr, out debut)
            && TimeOnly.TryParse(finStr,   out fin);
    }

    /// <summary>
    /// Recalcule le taux d'occupation (0-100) de chaque salle à partir
    /// des créneaux EDT de tous les semestres.
    /// Occupation = (nombre de créneaux où la salle est réservée / nombre total de créneaux possibles) * 100
    /// </summary>
    public async Task RecalculateOccupationsAsync()
    {
        const int totalCreneaux = 6 * 5; // 6 créneaux/jour × 5 jours = 30

        var salles = await _db.Salles.ToListAsync();
        var slots = await _db.Slots
            .Include(s => s.Salle)
            .ToListAsync();

        var slotCountBySalle = slots
            .GroupBy(s => s.SalleId)
            .ToDictionary(g => g.Key, g => g.Count());

        foreach (var salle in salles)
        {
            var count = slotCountBySalle.GetValueOrDefault(salle.Id, 0);
            salle.Occupation = (int)Math.Round((double)count / totalCreneaux * 100);
        }

        await _db.SaveChangesAsync();
    }

    // Charge les disponibilités/indisponibilités déclarées pour le semestre,
    // groupées par (EnseignantId, CoursId).
    private async Task<(
        Dictionary<(Guid ens, Guid cours), List<(Jour jour, TimeOnly debut, TimeOnly fin)>> dispos,
        Dictionary<(Guid ens, Guid cours), List<(Jour jour, TimeOnly debut, TimeOnly fin)>> indispos)>
        ChargerDisponibilitesAsync(Guid semestreId)
    {
        var dbDispos = await _db.Disponibilites
            .Where(d => d.SemestreId == semestreId)
            .ToListAsync();

        var parCoursDispos   = new Dictionary<(Guid, Guid), List<(Jour, TimeOnly, TimeOnly)>>();
        var parCoursIndispos = new Dictionary<(Guid, Guid), List<(Jour, TimeOnly, TimeOnly)>>();

        foreach (var d in dbDispos)
        {
            if (!Enum.TryParse<Jour>(d.Jour, out var jourEnum)) continue;
            if (!TryParseCreneau(d.Creneau, out var debut, out var fin)) continue;

            var cle = (d.EnseignantId, d.CoursId);

            if (d.EstDisponible)
            {
                if (!parCoursDispos.TryGetValue(cle, out var liste))
                    parCoursDispos[cle] = liste = new();
                liste.Add((jourEnum, debut, fin));
            }
            else if (d.EstIndisponible)
            {
                if (!parCoursIndispos.TryGetValue(cle, out var liste))
                    parCoursIndispos[cle] = liste = new();
                liste.Add((jourEnum, debut, fin));
            }
        }

        return (parCoursDispos, parCoursIndispos);
    }

    // Vérifie si l'enseignant est disponible pour CE cours précis sur un créneau donné.
    private static bool EstEnseignantDisponible(
        Dictionary<(Guid ens, Guid cours), List<(Jour jour, TimeOnly debut, TimeOnly fin)>> dispos,
        Dictionary<(Guid ens, Guid cours), List<(Jour jour, TimeOnly debut, TimeOnly fin)>> indispos,
        Guid enseignantId, Guid coursId, Jour jour, TimeOnly debut, TimeOnly fin)
    {
        var cle = (enseignantId, coursId);

        // 1. Indisponible explicitement (rouge) → refus
        if (indispos.TryGetValue(cle, out var listeIndispos))
        {
            if (listeIndispos.Any(p => p.jour == jour && debut < p.fin && p.debut < fin))
                return false;
        }

        // 2. Au moins une dispo (vert) déclarée pour ce cours → doit matcher
        if (dispos.TryGetValue(cle, out var listeDispos) && listeDispos.Count > 0)
        {
            return listeDispos.Any(p => p.jour == jour && debut < p.fin && p.debut < fin);
        }

        // 3. Aucune dispo déclarée pour ce cours → disponible par défaut
        return true;
    }

    public async Task<EdtGenerationResult> GenerateAsync(Guid semestreId)
    {
        var semestre = await _db.Semestres.FindAsync(semestreId)
            ?? throw new InvalidOperationException("Semestre introuvable");

        // Supprimer les slots existants du semestre
        var existing = await _db.Slots.Where(s => s.SemestreId == semestreId).ToListAsync();
        _db.Slots.RemoveRange(existing);
        await _db.SaveChangesAsync();

        var result = new EdtGenerationResult();

        // Recalculer HeuresPlanifiees depuis les slots des autres semestres
        var remainingSlots = await _db.Slots
            .GroupBy(s => s.CoursId)
            .Select(g => new { CoursId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CoursId, x => x.Count);

        var cours = await _db.Cours
            .Include(c => c.Niveau)
            .Include(c => c.Filiere)
            .Include(c => c.Enseignants).ThenInclude(ce => ce.Enseignant)
            .ToListAsync();

        foreach (var c in cours)
        {
            remainingSlots.TryGetValue(c.Id, out var slotCount);
            c.HeuresPlanifiees = slotCount; // 1 slot = 1h
        }
        await _db.SaveChangesAsync();

        var salles = await _db.Salles.Where(s => s.Disponible).ToListAsync();
        var (disponibilites, indisponibilites) = await ChargerDisponibilitesAsync(semestreId);

        // Index des occupations en mémoire
        var busyEnseignant = new HashSet<(Guid, Jour, TimeOnly)>();
        var busySalle      = new HashSet<(Guid, Jour, TimeOnly)>();
        var busyGroupe     = new HashSet<(Guid, Guid, Jour, TimeOnly)>();

        // Traiter en priorité les cours ayant des disponibilités déclarées
        var coursAvecDispos  = cours.Where(c => disponibilites.Keys.Any(k => k.cours == c.Id)).ToList();
        var coursSansDispos  = cours.Where(c => !disponibilites.Keys.Any(k => k.cours == c.Id)).ToList();
        var coursOrdonnes    = coursAvecDispos
            .OrderByDescending(c => c.VolumeHoraire)
            .Concat(coursSansDispos.OrderByDescending(c => c.VolumeHoraire))
            .ToList();

        foreach (var c in coursOrdonnes)
        {
            int heuresRestantes   = c.VolumeHoraire - c.HeuresPlanifiees;
            int seancesNecessaires = heuresRestantes; // 1 séance = 1h
            int placees = 0;

            var enseignant = c.Enseignants.FirstOrDefault()?.Enseignant;
            if (enseignant == null)
            {
                result.CoursNonPlanifies.Add($"{c.Intitule} (pas d'enseignant)");
                continue;
            }

            // Salles compatibles avec le type de cours
            var sallesCompat = salles.Where(s =>
                (c.Type == CoursType.TP  && s.Type == TypeSalle.TP) ||
                (c.Type == CoursType.CM  && (s.Type == TypeSalle.Cours || s.Type == TypeSalle.Amphi)) ||
                (c.Type == CoursType.TD  && s.Type == TypeSalle.Cours))
                .ToList();
            if (sallesCompat.Count == 0) sallesCompat = salles.ToList();

            foreach (var jour in Jours)
            {
                foreach (var (debut, fin) in Creneaux)
                {
                    if (placees >= seancesNecessaires) break;

                    if (busyEnseignant.Contains((enseignant.Id, jour, debut))) continue;
                    if (busyGroupe.Contains((c.NiveauId, c.FiliereId, jour, debut))) continue;
                    if (!EstEnseignantDisponible(disponibilites, indisponibilites,
                            enseignant.Id, c.Id, jour, debut, fin)) continue;

                    var salle = sallesCompat.FirstOrDefault(s =>
                        !busySalle.Contains((s.Id, jour, debut)));
                    if (salle == null) continue;

                    _db.Slots.Add(new SlotEDT
                    {
                        Jour        = jour,
                        HeureDebut  = debut,
                        HeureFin    = fin,
                        CoursId     = c.Id,
                        EnseignantId = enseignant.Id,
                        SalleId     = salle.Id,
                        NiveauId    = c.NiveauId,
                        FiliereId   = c.FiliereId,
                        SemestreId  = semestreId,
                    });

                    busyEnseignant.Add((enseignant.Id, jour, debut));
                    busySalle.Add((salle.Id, jour, debut));
                    busyGroupe.Add((c.NiveauId, c.FiliereId, jour, debut));
                    placees++;
                    result.SlotsCrees++;
                }
                if (placees >= seancesNecessaires) break;
            }

            c.HeuresPlanifiees += placees;

            if (placees < seancesNecessaires)
                result.CoursNonPlanifies.Add(
                    $"{c.Intitule} ({placees}/{seancesNecessaires} séances placées)");
        }

        _db.Journal.Add(new LogEntry
        {
            Action  = LogAction.Generation,
            Entite  = $"Semestre {semestre.Libelle} {semestre.Annee}",
            Nouveau = $"{result.SlotsCrees} slots créés",
        });

        await _db.SaveChangesAsync();

        // Recalculer l'occupation des salles après la génération
        await RecalculateOccupationsAsync();
        result.Conflits = await DetectConflitsAsync(semestreId);
        return result;
    }

    public async Task<List<ConflitDto>> DetectConflitsAsync(Guid semestreId)
    {
        var slots = await _db.Slots
            .Where(s => s.SemestreId == semestreId)
            .Include(s => s.Enseignant)
            .Include(s => s.Salle)
            .Include(s => s.Niveau)
            .ToListAsync();

        var conflits = new List<ConflitDto>();

        // ─── Conflit ENSEIGNANT ────────────────────────────────────────────────
        for (int i = 0; i < slots.Count; i++)
        {
            for (int j = i + 1; j < slots.Count; j++)
            {
                var a = slots[i];
                var b = slots[j];
                if (a.EnseignantId == b.EnseignantId
                    && a.Jour == b.Jour
                    && a.HeureDebut < b.HeureFin
                    && b.HeureDebut < a.HeureFin)
                {
                    conflits.Add(new ConflitDto
                    {
                        Id          = $"E-{a.Id}-{b.Id}",
                        Type        = "Enseignant",
                        Description = $"{a.Enseignant.Prenom} {a.Enseignant.Nom} possède deux cours le {a.Jour} entre {a.HeureDebut:HH:mm} et {a.HeureFin:HH:mm}",
                        Date        = DateTime.UtcNow,
                    });
                }
            }
        }

        // ─── Conflit SALLE ─────────────────────────────────────────────────────
        for (int i = 0; i < slots.Count; i++)
        {
            for (int j = i + 1; j < slots.Count; j++)
            {
                var a = slots[i];
                var b = slots[j];
                if (a.SalleId == b.SalleId
                    && a.Jour == b.Jour
                    && a.HeureDebut < b.HeureFin
                    && b.HeureDebut < a.HeureFin)
                {
                    conflits.Add(new ConflitDto
                    {
                        Id          = $"S-{a.Id}-{b.Id}",
                        Type        = "Salle",
                        Description = $"La salle {a.Salle.Numero} est utilisée deux fois le {a.Jour} entre {a.HeureDebut:HH:mm} et {a.HeureFin:HH:mm}",
                        Date        = DateTime.UtcNow,
                    });
                }
            }
        }

        // ─── Conflit GROUPE (même niveau + filière) ────────────────────────────
        for (int i = 0; i < slots.Count; i++)
        {
            for (int j = i + 1; j < slots.Count; j++)
            {
                var a = slots[i];
                var b = slots[j];
                if (a.NiveauId == b.NiveauId
                    && a.FiliereId == b.FiliereId
                    && a.Jour == b.Jour
                    && a.HeureDebut < b.HeureFin
                    && b.HeureDebut < a.HeureFin)
                {
                    conflits.Add(new ConflitDto
                    {
                        Id          = $"G-{a.Id}-{b.Id}",
                        Type        = "Groupe",
                        Description = $"Le groupe {a.Niveau?.Libelle} possède deux cours simultanés le {a.Jour} ({a.HeureDebut:HH:mm}-{a.HeureFin:HH:mm})",
                        Date        = DateTime.UtcNow,
                    });
                }
            }
        }

        // ─── Conflit INDISPONIBILITÉ enseignant ────────────────────────────────
        var (disponibilites, indisponibilites) = await ChargerDisponibilitesAsync(semestreId);
        foreach (var s in slots)
        {
            if (!EstEnseignantDisponible(disponibilites, indisponibilites,
                    s.EnseignantId, s.CoursId, s.Jour, s.HeureDebut, s.HeureFin))
            {
                conflits.Add(new ConflitDto
                {
                    Id          = $"I-{s.Id}",
                    Type        = "Indisponibilite",
                    Description = $"{s.Enseignant.Prenom} {s.Enseignant.Nom} planifié le {s.Jour} à {s.HeureDebut:HH:mm} alors qu'indisponible pour ce cours",
                    Date        = DateTime.UtcNow,
                });
            }
        }

        return conflits;
    }
}
