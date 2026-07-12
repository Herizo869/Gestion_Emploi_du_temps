using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Entities;
using Microsoft.EntityFrameworkCore;


namespace Emit.Api.Services;


public interface IEdtGeneratorService
{

    Task<EdtGenerationResult> GenerateAsync(Guid semestreId);


    Task<List<ConflitDto>> DetectConflitsAsync(Guid semestreId);

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

    public EdtGeneratorService(AppDbContext db)
    {
        _db = db;
    }

    // Créneaux standards EMIT — grille 1h
    private static readonly (TimeOnly debut, TimeOnly fin)[] Creneaux = new[]
    {

        (new TimeOnly(7,30), new TimeOnly(9,00)),

        (new TimeOnly(9,15), new TimeOnly(10,45)),

        (new TimeOnly(11,00), new TimeOnly(12,30)),

        (new TimeOnly(13,30), new TimeOnly(15,00)),

        (new TimeOnly(15,15), new TimeOnly(16,45)),

        (new TimeOnly(17,00), new TimeOnly(18,30))

    };

    private static readonly Jour[] Jours =
        { Jour.Lundi, Jour.Mardi, Jour.Mercredi, Jour.Jeudi, Jour.Vendredi };

    // Parse "07h00 - 08h00" → (07:00, 08:00)
    private static bool TryParseCreneau(string creneau, out TimeOnly debut, out TimeOnly fin)
    {
        debut = default; fin = default;
        var parts = creneau.Split('-', StringSplitOptions.TrimEntries);
        if (parts.Length != 2) return false;
        return TimeOnly.TryParse(parts[0].Replace('h', ':'), out debut)
            && TimeOnly.TryParse(parts[1].Replace('h', ':'), out fin);
    }

    // Charge les disponibilités et indisponibilités déclarées pour le semestre,
    // groupées par (Enseignant, Cours) — chaque cours a désormais sa propre grille.
    private async Task<(Dictionary<(Guid ens, Guid cours), List<(Jour jour, TimeOnly debut, TimeOnly fin)>> dispos,
                         Dictionary<(Guid ens, Guid cours), List<(Jour jour, TimeOnly debut, TimeOnly fin)>> indispos)>
        ChargerDisponibilitesAsync(Guid semestreId)
    {


        var indispos =
            await _db.Disponibilites

            .Where(d =>
                d.SemestreId == semestreId
                &&
                d.EstIndisponible)

            .ToListAsync();

        var parCoursDispos = new Dictionary<(Guid, Guid), List<(Jour, TimeOnly, TimeOnly)>>();
        var parCoursIndispos = new Dictionary<(Guid, Guid), List<(Jour, TimeOnly, TimeOnly)>>();

        foreach(var d in indispos)
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

    // Vérifie si l'enseignant est disponible pour CE cours précis sur un créneau donné
    private static bool EstEnseignantDisponible(
        Dictionary<(Guid ens, Guid cours), List<(Jour jour, TimeOnly debut, TimeOnly fin)>> dispos,
        Dictionary<(Guid ens, Guid cours), List<(Jour jour, TimeOnly debut, TimeOnly fin)>> indispos,
        Guid enseignantId, Guid coursId, Jour jour, TimeOnly debut, TimeOnly fin)
    {
        var cle = (enseignantId, coursId);

        // 1. Si l'enseignant est déclaré indisponible (rouge) sur ce créneau POUR CE COURS, il n'est pas disponible.
        if (indispos.TryGetValue(cle, out var listeIndispos))
        {
            if (listeIndispos.Any(p => p.jour == jour && debut < p.fin && p.debut < fin))
                return false;
        }

        // 2. Si l'enseignant a défini au moins une disponibilité (vert) pour CE cours sur ce semestre :
        // il doit avoir au moins une disponibilité (vert) qui chevauche ce créneau.
        if (dispos.TryGetValue(cle, out var listeDispos) && listeDispos.Count > 0)
        {
            return listeDispos.Any(p => p.jour == jour && debut < p.fin && p.debut < fin);
        }

        // 3. S'il n'a défini aucune disponibilité (vert) pour ce cours (grille non renseignée),
        // il est disponible par défaut (sauf si exclu par les indisponibilités).
        return true;
    }

    public async Task<EdtGenerationResult> GenerateAsync(Guid semestreId)
    {
        var semestre = await _db.Semestres.FindAsync(semestreId)
            ?? throw new InvalidOperationException("Semestre introuvable");

        // Reset: on supprime les slots existants du semestre
        var existing = await _db.Slots.Where(s => s.SemestreId == semestreId).ToListAsync();
        _db.Slots.RemoveRange(existing);
        await _db.SaveChangesAsync();




    var result =
        new EdtGenerationResult();

        // Recalculer les HeuresPlanifiees de chaque cours basées sur les slots restants (dans d'autres semestres)
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
            c.HeuresPlanifiees = (int)(slotCount * 1.5);
        }
        await _db.SaveChangesAsync();

        var salles = await _db.Salles.Where(s => s.Disponible).ToListAsync();
        var (disponibilites, indisponibilites) = await ChargerDisponibilitesAsync(semestreId);

        // Index des occupations en mémoire (rapide)
        var busyEnseignant = new HashSet<(Guid, Jour, TimeOnly)>();
        var busySalle = new HashSet<(Guid, Jour, TimeOnly)>();
        var busyGroupe = new HashSet<(Guid, Guid, Jour, TimeOnly)>(); // (niveau,filiere,jour,h)

        foreach (var c in cours.OrderByDescending(c => c.VolumeHoraire))
        {
            int heuresRestantes = c.VolumeHoraire - c.HeuresPlanifiees;
            int seancesNecessaires = (int)Math.Ceiling(heuresRestantes / 1.5);
            int placees = 0;

            var enseignant = c.Enseignants.FirstOrDefault()?.Enseignant;
            if (enseignant == null)
            {
                result.CoursNonPlanifies.Add($"{c.Intitule} (pas d'enseignant)");
                continue;
            }

            // Salle compatible
            var sallesCompat = salles.Where(s =>
                (c.Type == CoursType.TP && s.Type == TypeSalle.TP) ||
                (c.Type == CoursType.CM && (s.Type == TypeSalle.Cours || s.Type == TypeSalle.Amphi)) ||
                (c.Type == CoursType.TD && s.Type == TypeSalle.Cours))
                .ToList();
            if (sallesCompat.Count == 0) sallesCompat = salles.ToList();

            foreach (var jour in Jours)
            {
                foreach (var (debut, fin) in Creneaux)
                {
                    if (placees >= seancesNecessaires) break;

                    if (busyEnseignant.Contains((enseignant.Id, jour, debut))) continue;
                    if (busyGroupe.Contains((c.NiveauId, c.FiliereId, jour, debut))) continue;
                    if (!EstEnseignantDisponible(disponibilites, indisponibilites, enseignant.Id, c.Id, jour, debut, fin)) continue;

                    var salle = sallesCompat.FirstOrDefault(s => !busySalle.Contains((s.Id, jour, debut)));
                    if (salle == null) continue;

                    var slot = new SlotEDT
                    {
                        Jour = jour, HeureDebut = debut, HeureFin = fin,
                        CoursId = c.Id, EnseignantId = enseignant.Id, SalleId = salle.Id,
                        NiveauId = c.NiveauId, FiliereId = c.FiliereId, SemestreId = semestreId
                    };
                    _db.Slots.Add(slot);

                    busyEnseignant.Add((enseignant.Id, jour, debut));
                    busySalle.Add((salle.Id, jour, debut));
                    busyGroupe.Add((c.NiveauId, c.FiliereId, jour, debut));
                    placees++;
                    result.SlotsCrees++;
                }
                if (placees >= seancesNecessaires) break;
            }

            c.HeuresPlanifiees += (int)(placees * 1.5);
            if (placees < seancesNecessaires)
                result.CoursNonPlanifies.Add($"{c.Intitule} ({placees}/{seancesNecessaires} séances)");
        }

    }







    _db.Journal.Add(
        new LogEntry
        {
            Action = LogAction.Generation,
            Entite = $"Semestre {semestre.Libelle} {semestre.Annee}",
            Nouveau = $"{result.SlotsCrees} slots créés"
        });

        await _db.SaveChangesAsync();
        result.Conflits = await DetectConflitsAsync(semestreId);
        return result;
    }

    public async Task<List<ConflitDto>> DetectConflitsAsync(Guid semestreId)
    {
        var slots = await _db.Slots
            .Where(s => s.SemestreId == semestreId)
            .Include(s => s.Enseignant).Include(s => s.Salle)
            .ToListAsync();



    var conflits =
        new List<ConflitDto>();

        var dupEns = slots
            .GroupBy(s => new { s.EnseignantId, s.Jour, s.HeureDebut })
            .Where(g => g.Count() > 1);
        foreach (var g in dupEns)
        {
            var en = g.First().Enseignant;
            conflits.Add(new ConflitDto
            {
                Id = $"E-{g.Key.EnseignantId}-{g.Key.Jour}-{g.Key.HeureDebut}",
                Type = "Enseignant",
                Description = $"{en.Prenom[0]}. {en.Nom} planifié {g.Count()} fois {g.Key.Jour} {g.Key.HeureDebut:HH\\:mm}",
                Date = DateTime.UtcNow
            });
        }

        var dupSalle = slots
            .GroupBy(s => new { s.SalleId, s.Jour, s.HeureDebut })
            .Where(g => g.Count() > 1);
        foreach (var g in dupSalle)
        {
            var sa = g.First().Salle;
            conflits.Add(new ConflitDto
            {
                Id = $"S-{g.Key.SalleId}-{g.Key.Jour}-{g.Key.HeureDebut}",
                Type = "Salle",
                Description = $"{sa.Numero} occupée {g.Count()} fois {g.Key.Jour} {g.Key.HeureDebut:HH\\:mm}",
                Date = DateTime.UtcNow
            });
        }

        // Enseignant planifié sur un créneau qu'il a déclaré indisponible ou non disponible pour ce cours
        var (disponibilites, indisponibilites) = await ChargerDisponibilitesAsync(semestreId);
        foreach (var s in slots)
        {
            if (!EstEnseignantDisponible(disponibilites, indisponibilites, s.EnseignantId, s.CoursId, s.Jour, s.HeureDebut, s.HeureFin))
            {
                conflits.Add(new ConflitDto
                {
                    Id = $"I-{s.Id}",
                    Type = "Indisponibilite",
                    Description = $"{s.Enseignant.Prenom[0]}. {s.Enseignant.Nom} planifié {s.Jour} {s.HeureDebut:HH\\:mm} alors que non disponible pour ce cours",
                    Date = DateTime.UtcNow
                });
            }
        }

    }




    return conflits;

}
    private static bool EstIndisponible(
        Dictionary<Guid,List<(Jour jour,TimeOnly debut,TimeOnly fin)>> indisponibilites,
        Guid enseignantId,
        Jour jour,
        TimeOnly debut,
        TimeOnly fin
    )
    {
        if(!indisponibilites.TryGetValue(
            enseignantId,
            out var indispos))
            return false;

        return indispos.Any(d =>
            d.jour == jour &&
            debut < d.fin &&
            d.debut < fin
        );
    }
}