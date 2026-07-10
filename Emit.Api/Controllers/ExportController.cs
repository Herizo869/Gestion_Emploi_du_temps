using Emit.Api.Data;
using Emit.Api.Services;
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

    private async Task<List<Entities.SlotEDT>> LoadSlots(Guid? semestreId, Guid? niveauId, Guid? filiereId, Guid? salleId)
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

    // GET /api/export/csv?semestreId=&niveauId=&filiereId=&salleId=
    [HttpGet("csv")]
    public async Task<IActionResult> Csv(Guid? semestreId, Guid? niveauId, Guid? filiereId, Guid? salleId)
    {
        var slots = await LoadSlots(semestreId, niveauId, filiereId, salleId);

        var sb = new StringBuilder();
        sb.AppendLine("Jour;Debut;Fin;Cours;Type;Enseignant;Salle;Niveau;Filiere");
        foreach (var s in slots)
        {
            sb.AppendLine(string.Join(";", new string[]
            {
                s.Jour.ToString(),
                s.HeureDebut.ToString("HH:mm"),
                s.HeureFin.ToString("HH:mm"),
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

                    foreach (var s in slots)
                    {
                        table.Cell().Padding(4).Text(s.Jour.ToString());
                        table.Cell().Padding(4).Text($"{s.HeureDebut:HH\\:mm} - {s.HeureFin:HH\\:mm}");
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