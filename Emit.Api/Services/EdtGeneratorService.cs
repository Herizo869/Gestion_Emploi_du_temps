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

    // Créneaux standards (jour + horaire)
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
    {

        Jour.Lundi,

        Jour.Mardi,

        Jour.Mercredi,

        Jour.Jeudi,

        Jour.Vendredi

    };





    private static bool TryParseCreneau(

        string creneau,

        out TimeOnly debut,

        out TimeOnly fin

    )
    {

        debut = default;

        fin = default;



        var parts =
            creneau.Split(
                '-',
                StringSplitOptions.TrimEntries
            );



        if(parts.Length != 2)
            return false;




        return

        TimeOnly.TryParse(
            parts[0].Replace(
                'h',
                ':'
            ),
            out debut)

        &&

        TimeOnly.TryParse(
            parts[1].Replace(
                'h',
                ':'
            ),
            out fin);

    }





    // Charger indisponibilités enseignants

    private async Task
    <Dictionary<Guid,List<(Jour jour,TimeOnly debut,TimeOnly fin)>>>
    ChargerIndisponibilitesAsync(Guid semestreId)
    {


        var indispos =
            await _db.Disponibilites

            .Where(d =>
                d.SemestreId == semestreId
                &&
                d.EstIndisponible)

            .ToListAsync();



        var result =
            new Dictionary
            <Guid,List<(Jour,TimeOnly,TimeOnly)>>();



        foreach(var d in indispos)
        {

            if(!Enum.TryParse<Jour>(
                d.Jour,
                out var jour))
                continue;



            if(!TryParseCreneau(
                d.Creneau,
                out var debut,
                out var fin))
                continue;



            if(!result.ContainsKey(
                d.EnseignantId))
            {
                result[d.EnseignantId] =
                    new();
            }



            result[d.EnseignantId]
            .Add(
                (
                    jour,
                    debut,
                    fin
                )
            );

        }



        return result;

    }
    public async Task<EdtGenerationResult> GenerateAsync(Guid semestreId)
{

    var semestre =
        await _db.Semestres.FindAsync(semestreId);


    if(semestre == null)
        throw new InvalidOperationException(
            "Semestre introuvable"
        );



    // Suppression ancien EDT
    var anciensSlots =
        _db.Slots
        .Where(s =>
            s.SemestreId == semestreId
        );


    _db.Slots.RemoveRange(anciensSlots);


    await _db.SaveChangesAsync();




    var result =
        new EdtGenerationResult();




    var cours =
        await _db.Cours

        .Include(c => c.Niveau)

        .Include(c => c.Filiere)

        .Include(c =>
            c.Enseignants
            .ThenInclude(e =>
                e.Enseignant
            )
        )

        .ToListAsync();




    var salles =
        await _db.Salles
        .Where(s =>
            s.Disponible
        )
        .ToListAsync();




    var indisponibilites =
        await ChargerIndisponibilitesAsync(
            semestreId
        );




    // Occupations mémoire

    var enseignantsOccupes =
        new List<(Guid enseignant, Jour jour, TimeOnly debut, TimeOnly fin)>();


    var sallesOccupees =
        new List<(Guid salle, Jour jour, TimeOnly debut, TimeOnly fin)>();


    var groupesOccupes =
        new List<(Guid niveau, Guid filiere, Jour jour, TimeOnly debut, TimeOnly fin)>();






    foreach(var c in cours.OrderByDescending(
        x => x.VolumeHoraire))
    {


        int heuresRestantes =
            c.VolumeHoraire -
            c.HeuresPlanifiees;



        int nombreSeances =
            (int)Math.Ceiling(
                heuresRestantes / 1.5
            );



        int placees = 0;




        var enseignant =
            c.Enseignants
            .FirstOrDefault()
            ?.Enseignant;



        if(enseignant == null)
        {

            result.CoursNonPlanifies
            .Add(
                $"{c.Intitule} (aucun enseignant)"
            );


            continue;

        }





        var sallesCompatibles =
            salles
            .Where(s =>

                (c.Type == CoursType.TP
                &&
                s.Type == TypeSalle.TP)


                ||

                (c.Type == CoursType.CM
                &&
                (
                    s.Type == TypeSalle.Cours
                    ||
                    s.Type == TypeSalle.Amphi
                ))


                ||

                (c.Type == CoursType.TD
                &&
                s.Type == TypeSalle.Cours)

            )
            .ToList();



        if(!sallesCompatibles.Any())
            sallesCompatibles = salles;




        foreach(var jour in Jours)
        {


            foreach(var creneau in Creneaux)
            {


                if(placees >= nombreSeances)
                    break;




                var debut =
                    creneau.debut;


                var fin =
                    creneau.fin;





                // enseignant déjà occupé

                bool enseignantOccupe =
                    enseignantsOccupes.Any(x =>

                        x.enseignant ==
                        enseignant.Id

                        &&

                        x.jour == jour

                        &&

                        debut < x.fin

                        &&

                        x.debut < fin

                    );



                if(enseignantOccupe)
                    continue;





                // groupe déjà occupé

                bool groupeOccupe =
                    groupesOccupes.Any(x =>

                        x.niveau ==
                        c.NiveauId

                        &&

                        x.filiere ==
                        c.FiliereId

                        &&

                        x.jour == jour

                        &&

                        debut < x.fin

                        &&

                        x.debut < fin

                    );



                if(groupeOccupe)
                    continue;





                // indisponibilité enseignant

                if(EstIndisponible(
                    indisponibilites,
                    enseignant.Id,
                    jour,
                    debut,
                    fin))
                {
                    continue;
                }






                var salle =
                    sallesCompatibles
                    .FirstOrDefault(s =>

                        !sallesOccupees.Any(x =>

                            x.salle == s.Id

                            &&

                            x.jour == jour

                            &&

                            debut < x.fin

                            &&

                            x.debut < fin

                        )

                    );



                if(salle == null)
                    continue;







                var slot =
                    new SlotEDT
                    {

                        SemestreId =
                            semestreId,


                        CoursId =
                            c.Id,


                        EnseignantId =
                            enseignant.Id,


                        SalleId =
                            salle.Id,


                        NiveauId =
                            c.NiveauId,


                        FiliereId =
                            c.FiliereId,


                        Jour =
                            jour,


                        HeureDebut =
                            debut,


                        HeureFin =
                            fin

                    };




                _db.Slots.Add(slot);




                enseignantsOccupes.Add(
                    (
                        enseignant.Id,
                        jour,
                        debut,
                        fin
                    )
                );



                sallesOccupees.Add(
                    (
                        salle.Id,
                        jour,
                        debut,
                        fin
                    )
                );



                groupesOccupes.Add(
                    (
                        c.NiveauId,
                        c.FiliereId,
                        jour,
                        debut,
                        fin
                    )
                );



                placees++;

                result.SlotsCrees++;

            }




            if(placees >= nombreSeances)
                break;

        }






        c.HeuresPlanifiees =
            c.VolumeHoraire -
            (int)(
                (nombreSeances - placees)
                * 1.5
            );




        if(placees < nombreSeances)
        {

            result.CoursNonPlanifies
            .Add(
                $"{c.Intitule} ({placees}/{nombreSeances} séances)"
            );

        }

    }







    _db.Journal.Add(
        new LogEntry
        {
            Action =
                LogAction.Generation,


            Entite =
                $"Semestre {semestre.Libelle} {semestre.Annee}",


            Nouveau =
                $"{result.SlotsCrees} slots créés"
        }
    );




    await _db.SaveChangesAsync();




    result.Conflits =
        await DetectConflitsAsync(
            semestreId
        );



    return result;

}
public async Task<List<ConflitDto>> DetectConflitsAsync(Guid semestreId)
{

    var slots =
        await _db.Slots

        .Where(s =>
            s.SemestreId == semestreId
        )

        .Include(s => s.Enseignant)

        .Include(s => s.Salle)

        .Include(s => s.Niveau)

        .Include(s => s.Filiere)

        .ToListAsync();



    var conflits =
        new List<ConflitDto>();




    // =====================================================
    // CONFLIT ENSEIGNANT
    // Deux cours au même moment pour le même enseignant
    // =====================================================


    for(int i = 0; i < slots.Count; i++)
    {

        for(int j = i + 1; j < slots.Count; j++)
        {

            var a = slots[i];

            var b = slots[j];



            if(
                a.EnseignantId == b.EnseignantId

                &&

                a.Jour == b.Jour

                &&

                a.HeureDebut < b.HeureFin

                &&

                b.HeureDebut < a.HeureFin
            )
            {

                conflits.Add(
                    new ConflitDto
                    {

                        Id =
                        $"E-{a.Id}-{b.Id}",


                        Type =
                        "Enseignant",


                        Description =
                        $"{a.Enseignant.Prenom} {a.Enseignant.Nom} possède deux cours le {a.Jour} entre {a.HeureDebut:HH:mm} et {a.HeureFin:HH:mm}",


                        Date =
                        DateTime.UtcNow

                    }
                );

            }

        }

    }






    // =====================================================
    // CONFLIT SALLE
    // Deux cours dans la même salle
    // =====================================================


    for(int i = 0; i < slots.Count; i++)
    {

        for(int j = i + 1; j < slots.Count; j++)
        {

            var a = slots[i];

            var b = slots[j];



            if(
                a.SalleId == b.SalleId

                &&

                a.Jour == b.Jour

                &&

                a.HeureDebut < b.HeureFin

                &&

                b.HeureDebut < a.HeureFin
            )
            {

                conflits.Add(
                    new ConflitDto
                    {

                        Id =
                        $"S-{a.Id}-{b.Id}",


                        Type =
                        "Salle",


                        Description =
                        $"La salle {a.Salle.Numero} est utilisée deux fois le {a.Jour} entre {a.HeureDebut:HH:mm} et {a.HeureFin:HH:mm}",


                        Date =
                        DateTime.UtcNow

                    }
                );

            }

        }

    }






    // =====================================================
    // CONFLIT GROUPE
    // Même niveau + filière au même moment
    // =====================================================


    for(int i = 0; i < slots.Count; i++)
    {

        for(int j = i + 1; j < slots.Count; j++)
        {

            var a = slots[i];

            var b = slots[j];



            if(

                a.NiveauId == b.NiveauId

                &&

                a.FiliereId == b.FiliereId


                &&

                a.Jour == b.Jour


                &&

                a.HeureDebut < b.HeureFin


                &&

                b.HeureDebut < a.HeureFin

            )
            {

                conflits.Add(
                    new ConflitDto
                    {

                        Id =
                        $"G-{a.Id}-{b.Id}",


                        Type =
                        "Groupe",


                        Description =
                        $"Le groupe {a.Niveau?.Nom} possède deux cours simultanés le {a.Jour} ({a.HeureDebut:HH:mm}-{a.HeureFin:HH:mm})",


                        Date =
                        DateTime.UtcNow

                    }
                );

            }

        }

    }






    // =====================================================
    // CONFLIT DISPONIBILITE ENSEIGNANT
    // =====================================================


    var indisponibilites =
        await ChargerIndisponibilitesAsync(
            semestreId
        );




    foreach(var slot in slots)
    {

        if(
            EstIndisponible(

                indisponibilites,

                slot.EnseignantId,

                slot.Jour,

                slot.HeureDebut,

                slot.HeureFin

            )
        )
        {

            conflits.Add(
                new ConflitDto
                {

                    Id =
                    $"I-{slot.Id}",


                    Type =
                    "Indisponibilite",


                    Description =
                    $"{slot.Enseignant.Prenom} {slot.Enseignant.Nom} est planifié alors qu'il est indisponible le {slot.Jour} à {slot.HeureDebut:HH:mm}",


                    Date =
                    DateTime.UtcNow

                }
            );

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