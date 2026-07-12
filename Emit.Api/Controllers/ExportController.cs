using Emit.Api.Data;
using Emit.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Text;

namespace Emit.Api.Controllers;

[ApiController, Route("api/export"), AllowAnonymous]
public class ExportController : ControllerBase
{
    private readonly AppDbContext _db;
    public ExportController(AppDbContext db) { _db = db; }

    private async Task<List<SlotEDT>> LoadSlots(Guid? semestreId, Guid? niveauId, Guid? filiereId, Guid? salleId)
    {
        var q = _db.Slots
            .Include(s => s.Cours).Include(s => s.Enseignant)
            .Include(s => s.Salle).Include(s => s.Niveau).Include(s => s.Filiere)
            .AsQueryable();
        if (semestreId.HasValue) q = q.Where(s => s.SemestreId == semestreId);
        if (niveauId.HasValue) q = q.Where(s => s.NiveauId == niveauId);
        if (filiereId.HasValue) q = q.Where(s => s.FiliereId == filiereId);
        if (salleId.HasValue) q = q.Where(s => s.SalleId == salleId);
        return await q.OrderBy(s => s.Jour).ThenBy(s => s.HeureDebut).ToListAsync();
    }

    // Fusionne les créneaux consécutifs (même jour, même cours, même enseignant, même salle,
    // et réellement contigus dans le temps : fin de l'un == début du suivant) en une seule ligne.
    private static List<(Jour Jour, TimeOnly Debut, TimeOnly Fin, SlotEDT Slot)> MergeSlots(List<SlotEDT> slots)
    {
        var result = new List<(Jour, TimeOnly, TimeOnly, SlotEDT)>();

        var groupes = slots
            .OrderBy(s => s.Jour).ThenBy(s => s.HeureDebut)
            .GroupBy(s => s.Jour);

        foreach (var groupe in groupes)
        {
            SlotEDT? courant = null;
            TimeOnly debut = default, fin = default;

            foreach (var s in groupe.OrderBy(s => s.HeureDebut))
            {
                if (courant != null
                    && s.CoursId == courant.CoursId
                    && s.EnseignantId == courant.EnseignantId
                    && s.SalleId == courant.SalleId
                    && s.HeureDebut == fin) // contigu : le nouveau créneau commence pile où le précédent finit
                {
                    fin = s.HeureFin; // on étend le bloc en cours
                    continue;
                }

                if (courant != null)
                    result.Add((courant.Jour, debut, fin, courant));

                courant = s;
                debut = s.HeureDebut;
                fin = s.HeureFin;
            }

            if (courant != null)
                result.Add((courant.Jour, debut, fin, courant));
        }

        return result.OrderBy(r => r.Item1).ThenBy(r => r.Item2).ToList();
    }

    // GET /api/export/csv?semestreId=&niveauId=&filiereId=&salleId=
    [HttpGet("csv")]
    public async Task<IActionResult> Csv(Guid? semestreId, Guid? niveauId, Guid? filiereId, Guid? salleId)
    {
        var slots = await LoadSlots(semestreId, niveauId, filiereId, salleId);
        var lignes = MergeSlots(slots);

        var sb = new StringBuilder();
        sb.AppendLine("Jour;Debut;Fin;Cours;Type;Enseignant;Salle;Niveau;Filiere");
        foreach (var (jour, debut, fin, s) in lignes)
        {
            sb.AppendLine(string.Join(";", new string[]
            {
                jour.ToString(),
                debut.ToString("HH:mm"),
                fin.ToString("HH:mm"),
                s.Cours.Intitule,
                s.Cours.Type.ToString(),
                $"{s.Enseignant.Prenom} {s.Enseignant.Nom}",
                s.Salle.Numero,
                s.Niveau.Libelle.ToString(),
                s.Filiere.Libelle,
            }));
        }

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return File(bytes, "text/csv", "edt.csv");
    }

    // GET /api/export/pdf?semestreId=&niveauId=&filiereId=&salleId=&orientation=portrait|paysage
    [HttpGet("pdf")]
    public async Task<IActionResult> Pdf(Guid? semestreId, Guid? niveauId, Guid? filiereId, Guid? salleId, string orientation = "portrait")
    {
        var slots = await LoadSlots(semestreId, niveauId, filiereId, salleId);
        var lignes = MergeSlots(slots);
        var isLandscape = orientation == "paysage";

        var titre = slots.Count > 0
            ? $"{slots[0].Niveau.Libelle} — {slots[0].Filiere.Libelle}"
            : "Emploi du temps";

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(isLandscape ? PageSizes.A4.Landscape() : PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Text(titre).FontSize(16).Bold();

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(c =>
                    {
                        c.RelativeColumn(1.2f); // Jour
                        c.RelativeColumn(1.2f); // Horaire
                        c.RelativeColumn(2.5f); // Cours
                        c.RelativeColumn(1f);   // Type
                        c.RelativeColumn(2f);   // Enseignant
                        c.RelativeColumn(1f);   // Salle
                    });

                    table.Header(header =>
                    {
                        foreach (var h in new string[] { "Jour", "Horaire", "Cours", "Type", "Enseignant", "Salle" })
                            header.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text(h).Bold();
                    });

                    foreach (var (jour, debut, fin, s) in lignes)
                    {
                        table.Cell().Padding(4).Text(jour.ToString());
                        table.Cell().Padding(4).Text($"{debut:HH\\:mm} - {fin:HH\\:mm}");
                        table.Cell().Padding(4).Text(s.Cours.Intitule);
                        table.Cell().Padding(4).Text(s.Cours.Type.ToString());
                        table.Cell().Padding(4).Text($"{s.Enseignant.Prenom} {s.Enseignant.Nom}");
                        table.Cell().Padding(4).Text(s.Salle.Numero);
                    }
                });

                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("Généré le ");
                    t.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm"));
                });
            });
        });

        var bytes = doc.GeneratePdf();
        return File(bytes, "application/pdf", "edt.pdf");
    }
}