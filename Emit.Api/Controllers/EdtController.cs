using Emit.Api.Data;
using Emit.Api.Dtos;
using Emit.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Emit.Api.Controllers;


[ApiController]
[Authorize]
[Route("api/edt")]
public class EdtController : ControllerBase
{

    private readonly AppDbContext _db;
    private readonly IEdtGeneratorService _gen;


    public EdtController(
        AppDbContext db,
        IEdtGeneratorService gen)
    {
        _db = db;
        _gen = gen;
    }



    private IQueryable<Entities.SlotEDT> Base()
    {
        return _db.Slots

            .Include(s => s.Cours)

            .Include(s => s.Enseignant)

            .Include(s => s.Salle)

            .Include(s => s.Niveau)

            .Include(s => s.Filiere);
    }




    // ===============================
    // GET EDT
    // ===============================

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<SlotEDTDto>>> Get(

        [FromQuery] Guid? semestreId,

        [FromQuery] Guid? niveauId,

        [FromQuery] Guid? filiereId,

        [FromQuery] Guid? salleId,

        [FromQuery] Guid? enseignantId

    )
    {

        var q = Base();



        if(semestreId.HasValue)
            q = q.Where(
                s => s.SemestreId == semestreId);



        if(niveauId.HasValue)
            q = q.Where(
                s => s.NiveauId == niveauId);



        if(filiereId.HasValue)
            q = q.Where(
                s => s.FiliereId == filiereId);



        if(salleId.HasValue)
            q = q.Where(
                s => s.SalleId == salleId);



        if(enseignantId.HasValue)
            q = q.Where(
                s => s.EnseignantId == enseignantId);



        var list = await q.ToListAsync();



        return Ok(
            list.Select(SlotMapper.ToDto)
        );
    }





    // ===============================
    // EDT ENSEIGNANT CONNECTE
    // ===============================


    [HttpGet("me")]
    public async Task<ActionResult<IEnumerable<SlotEDTDto>>> GetMine(

        [FromQuery] Guid? semestreId

    )
    {

        var ens =
            User.FindFirst("enseignantId")?.Value;



        if(!Guid.TryParse(
            ens,
            out var enseignantId))
            return Forbid();




        var q =
            Base()
            .Where(
                s => s.EnseignantId == enseignantId
            );



        if(semestreId.HasValue)
        {
            q = q.Where(
                s => s.SemestreId == semestreId
            );
        }



        var list =
            await q.ToListAsync();



        return Ok(
            list.Select(SlotMapper.ToDto)
        );
    }





    // ===============================
    // GENERATION AUTOMATIQUE
    // ===============================


    [HttpPost("generate/{semestreId:guid}")]
    [Authorize(Roles="Admin")]
    public async Task<IActionResult> Generate(
        Guid semestreId)
    {

        var result =
            await _gen.GenerateAsync(
                semestreId
            );


        return Ok(result);
    }





    // ===============================
    // LISTE DES CONFLITS
    // ===============================


    [HttpGet("{semestreId:guid}/conflits")]
    [Authorize(Roles="Admin")]
    public async Task<ActionResult<List<ConflitDto>>> Conflits(
        Guid semestreId)
    {

        return Ok(
            await _gen.DetectConflitsAsync(
                semestreId
            )
        );
    }
    private static bool TryParseCreneau(
        string creneau,
        out TimeOnly debut,
        out TimeOnly fin)
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
                    ':'),
                out debut)

            &&

            TimeOnly.TryParse(
                parts[1].Replace(
                    'h',
                    ':'),
                out fin);
    }
    
    // =====================================================
    // DETECTION DES CONFLITS COMMUNE
    // Enseignant + Salle + Groupe + chevauchement horaire
    // =====================================================

    private async Task<List<Entities.SlotEDT>> DetecterConflitsAsync(

        Guid semestreId,

        Guid? slotId,

        Guid enseignantId,

        Guid salleId,

        Guid niveauId,

        Guid filiereId,

        Jour jour,

        TimeOnly heureDebut,

        TimeOnly heureFin

    )
    {

        return await _db.Slots

            .Include(s => s.Enseignant)

            .Include(s => s.Salle)

            .Include(s => s.Niveau)

            .Include(s => s.Filiere)

            .Where(s =>

                s.SemestreId == semestreId &&

                s.Id != slotId &&

                s.Jour == jour &&


                // chevauchement horaire
                heureDebut < s.HeureFin &&

                s.HeureDebut < heureFin &&


                (

                    // même enseignant
                    s.EnseignantId == enseignantId ||


                    // même salle
                    s.SalleId == salleId ||


                    // même classe
                    (
                        s.NiveauId == niveauId &&
                        s.FiliereId == filiereId
                    )

                )

            )

            .ToListAsync();

    }






    // =====================================================
    // VERIFICATION INDISPONIBILITE ENSEIGNANT
    // =====================================================

    private async Task<bool> EnseignantIndisponibleAsync(

        Guid semestreId,

        Guid enseignantId,

        Jour jour,

        TimeOnly debut,

        TimeOnly fin

    )
    {

        var indispos =
            await _db.Disponibilites

            .Where(d =>

                d.SemestreId == semestreId &&

                d.EnseignantId == enseignantId &&

                d.EstIndisponible &&

                d.Jour == jour.ToString()

            )

            .ToListAsync();



        return indispos.Any(d =>

            TryParseCreneau(
                d.Creneau,
                out var d1,
                out var d2
            )

            &&

            debut < d2

            &&

            d1 < fin

        );

    }







    // =====================================================
    // CREATION MANUELLE D'UN SLOT PAR ADMIN
    // POST /api/edt
    // =====================================================


    [HttpPost]
    [Authorize(Roles="Admin")]
    public async Task<IActionResult> Create(

        [FromBody] SlotCreateDto dto

    )
    {


        if(!TimeOnly.TryParse(
                dto.HeureDebut,
                out var heureDebut)

            ||

           !TimeOnly.TryParse(
                dto.HeureFin,
                out var heureFin)
        )
        {

            return BadRequest(new
            {
                message =
                "Format heure invalide. Utilisez HH:mm"
            });

        }





        var conflits =
            await DetecterConflitsAsync(

                dto.SemestreId,

                null,

                dto.EnseignantId,

                dto.SalleId,

                dto.NiveauId,

                dto.FiliereId,

                dto.Jour,

                heureDebut,

                heureFin
            );





        var indisponible =
            await EnseignantIndisponibleAsync(

                dto.SemestreId,

                dto.EnseignantId,

                dto.Jour,

                heureDebut,

                heureFin
            );





        if(conflits.Any() || indisponible)
        {

            return Conflict(new
            {

                message =
                "Impossible de créer ce créneau.",


                conflits =
                conflits.Select(x => new
                {

                    type =
                    x.EnseignantId == dto.EnseignantId
                    ?
                    "Enseignant"

                    :

                    x.SalleId == dto.SalleId
                    ?
                    "Salle"

                    :

                    "Groupe",


                    description =
                    $"{x.Jour} {x.HeureDebut:HH:mm}-{x.HeureFin:HH:mm}"

                }),


                indisponibilite =
                indisponible

            });

        }





        var slot = new Entities.SlotEDT
        {

            SemestreId = dto.SemestreId,

            CoursId = dto.CoursId,

            EnseignantId = dto.EnseignantId,

            SalleId = dto.SalleId,

            NiveauId = dto.NiveauId,

            FiliereId = dto.FiliereId,

            Jour = dto.Jour,

            HeureDebut = heureDebut,

            HeureFin = heureFin

        };




        _db.Slots.Add(slot);



        _db.Journal.Add(
            new Entities.LogEntry
            {
                Action =
                Entities.LogAction.Creation,

                Entite =
                "Créneau EDT ajouté manuellement"
            }
        );



        await _db.SaveChangesAsync();



        var created =
            await Base()
            .FirstAsync(
                s => s.Id == slot.Id
            );



        return Ok(
            SlotMapper.ToDto(created)
        );

    }








    // =====================================================
    // MODIFICATION MANUELLE
    // PUT /api/edt/{id}
    // =====================================================


    [HttpPut("{id:guid}")]
    [Authorize(Roles="Admin")]
    public async Task<IActionResult> Update(

        Guid id,

        [FromBody] SlotUpdateDto dto

    )
    {


        var slot =
            await Base()
            .FirstOrDefaultAsync(
                s => s.Id == id
            );



        if(slot == null)
            return NotFound();




        if(!TimeOnly.TryParse(
                dto.HeureDebut,
                out var heureDebut)

            ||

           !TimeOnly.TryParse(
                dto.HeureFin,
                out var heureFin)
        )
        {

            return BadRequest(new
            {
                message =
                "Format heure invalide"
            });

        }





        var conflits =
            await DetecterConflitsAsync(

                slot.SemestreId,

                id,

                dto.EnseignantId,

                dto.SalleId,

                slot.NiveauId,

                slot.FiliereId,

                dto.Jour,

                heureDebut,

                heureFin

            );





        var indisponible =
            await EnseignantIndisponibleAsync(

                slot.SemestreId,

                dto.EnseignantId,

                dto.Jour,

                heureDebut,

                heureFin
            );





        if(conflits.Any() || indisponible)
        {

            return Conflict(new
            {

                message =
                "Conflit détecté.",


                conflits,


                indisponibilite =
                indisponible

            });

        }





        slot.SalleId =
            dto.SalleId;


        slot.EnseignantId =
            dto.EnseignantId;


        slot.Jour =
            dto.Jour;


        slot.HeureDebut =
            heureDebut;


        slot.HeureFin =
            heureFin;




        _db.Journal.Add(
            new Entities.LogEntry
            {

                Action =
                Entities.LogAction.Modification,


                Entite =
                $"Créneau {slot.Cours?.Intitule} modifié"

            }
        );



        await _db.SaveChangesAsync();



        var updated =
            await Base()
            .FirstAsync(
                s => s.Id == id
            );



        return Ok(
            SlotMapper.ToDto(updated)
        );

    }








    // =====================================================
    // SUPPRESSION
    // =====================================================


    [HttpDelete("{id:guid}")]
    [Authorize(Roles="Admin")]
    public async Task<IActionResult> Delete(
        Guid id)
    {


        var slot =
            await _db.Slots.FindAsync(id);



        if(slot == null)
            return NotFound();



        _db.Slots.Remove(slot);



        await _db.SaveChangesAsync();



        return NoContent();

    }


}