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
            .Include(s => s.Semestre)
            .AsQueryable();
        if (semestreId.HasValue) q = q.Where(s => s.SemestreId == semestreId);
        if (niveauId.HasValue) q = q.Where(s => s.NiveauId == niveauId);
        if (filiereId.HasValue) q = q.Where(s => s.FiliereId == filiereId);
        if (salleId.HasValue) q = q.Where(s => s.SalleId == salleId);
        return await q.OrderBy(s => s.Jour).ThenBy(s => s.HeureDebut).ToListAsync();
    }

    private static string JourFr(Jour j) => j switch
    {
        Jour.Lundi => "Lundi",
        Jour.Mardi => "Mardi",
        Jour.Mercredi => "Mercredi",
        Jour.Jeudi => "Jeudi",
        Jour.Vendredi => "Vendredi",
        _ => j.ToString()
    };

    private static string TypeSalleFr(TypeSalle t) => t switch
    {
        TypeSalle.Cours => "Cours",
        TypeSalle.TP => "TP",
        TypeSalle.Amphi => "Amphitheatre",
        TypeSalle.Examen => "Examen",
        TypeSalle.Reunion => "Reunion",
        _ => t.ToString()
    };

    private static string StatutEnsFr(StatutEnseignant s) => s switch
    {
        StatutEnseignant.Permanent => "Permanent",
        StatutEnseignant.Vacataire => "Vacataire",
        StatutEnseignant.Invite => "Invite",
        _ => s.ToString()
    };

    private static readonly Color Navy = Color.FromHex("#0D1B4B");
    private static readonly Color Sky = Color.FromHex("#7EC8E3");
    private static readonly Color SkyLight = Color.FromHex("#E5F4FB");
    private static readonly Color NavyLight = Color.FromHex("#E8EDF5");
    private static readonly Color EmeraldLight = Color.FromHex("#D1FAE5");
    private static readonly Color EmeraldFg = Color.FromHex("#047857");

    private static Color TypeBg(CoursType t) => t switch
    {
        CoursType.CM => NavyLight,
        CoursType.TD => SkyLight,
        CoursType.TP => EmeraldLight,
        _ => Colors.Grey.Lighten3
    };

    private static Color TypeFg(CoursType t) => t switch
    {
        CoursType.CM => Navy,
        CoursType.TD => Color.FromHex("#0369A1"),
        CoursType.TP => EmeraldFg,
        _ => Colors.Grey.Darken1
    };

    private async Task<(string nom, string sousTitre)> LoadEtablissement()
    {
        var settings = await _db.SystemSettings.AsNoTracking().FirstOrDefaultAsync();
        return (settings?.EtablissementNom ?? "EMIT", settings?.EtablissementSousTitre ?? "");
    }

    [HttpGet("csv")]
    public async Task<IActionResult> Csv(Guid? semestreId, Guid? niveauId, Guid? filiereId, Guid? salleId)
    {
        var slots = await LoadSlots(semestreId, niveauId, filiereId, salleId);
        var sb = new StringBuilder();
        sb.AppendLine("Jour;Horaires;Cours;Type (CM/TD/TP);Enseignant;Specialite;Statut;Salle;Batiment;Type Salle;Capacite;Niveau;Filiere;Semestre;Annee");
        foreach (var s in slots)
        {
            sb.AppendLine(string.Join(";", new string[]
            {
                JourFr(s.Jour),
                $"{s.HeureDebut:HH:mm} - {s.HeureFin:HH:mm}",
                s.Cours.Intitule,
                s.Cours.Type.ToString(),
                $"{s.Enseignant.Prenom} {s.Enseignant.Nom}",
                s.Enseignant.Specialite,
                StatutEnsFr(s.Enseignant.Statut),
                s.Salle.Numero,
                s.Salle.Batiment,
                TypeSalleFr(s.Salle.Type),
                s.Salle.Capacite.ToString(),
                s.Niveau.Libelle.ToString(),
                s.Filiere.Libelle,
                s.Semestre.Libelle,
                s.Semestre.Annee,
            }));
        }
        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return File(bytes, "text/csv; charset=utf-8", "edt.csv");
    }

    [HttpGet("pdf")]
    public async Task<IActionResult> Pdf(Guid? semestreId, Guid? niveauId, Guid? filiereId, Guid? salleId, string orientation = "portrait")
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var slots = await LoadSlots(semestreId, niveauId, filiereId, salleId);
        var isLandscape = orientation == "paysage";
        var (ecoleNom, ecoleSousTitre) = await LoadEtablissement();

        var semestreTxt = slots.Count > 0
            ? string.Format("{0} - {1}", slots[0].Semestre.Libelle, slots[0].Semestre.Annee)
            : "";
        var sousTitre = slots.Count > 0
            ? string.Format("{0} - {1}", slots[0].Niveau.Libelle, slots[0].Filiere.Libelle)
            : "Emploi du temps";
        var descriptionFiliere = slots.Count > 0 ? slots[0].Filiere.Description : "";
        var totalCreneaux = slots.Count;

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(isLandscape ? PageSizes.A4.Landscape() : PageSizes.A4);
                page.Margin(20);
                page.DefaultTextStyle(x => x.FontSize(8.5f).FontFamily("Calibri"));

                page.Header().Column(col =>
                {
                    col.Item().Background(Navy).Padding(10).Column(h =>
                    {
                        h.Item().AlignCenter().Text(ecoleNom)
                            .FontSize(18).Bold().FontColor(Colors.White).LetterSpacing(1);
                        if (!string.IsNullOrWhiteSpace(ecoleSousTitre))
                            h.Item().AlignCenter().Text(ecoleSousTitre)
                                .FontSize(9).FontColor(Sky).Italic();
                        h.Item().Height(2).Background(Sky).Width(120).AlignCenter();
                        h.Item().Height(3);
                        h.Item().AlignCenter().Text(string.Format("Emploi du temps - {0}", semestreTxt))
                            .FontSize(11).FontColor(Colors.White).Bold();
                        h.Item().AlignCenter().Text(sousTitre)
                            .FontSize(14).FontColor(Sky).Bold();
                    });
                    col.Item().Background(SkyLight).PaddingVertical(3).PaddingHorizontal(8)
                        .Row(r =>
                        {
                            r.RelativeItem().AlignLeft().Text(t =>
                            {
                                t.DefaultTextStyle(x => x.FontSize(8).FontColor(Navy));
                                t.Span("Creneaux : ").SemiBold();
                                t.Span($"{totalCreneaux} seance{(totalCreneaux > 1 ? "s" : "")}");
                            });
                            r.RelativeItem().AlignCenter().Text(t =>
                            {
                                t.DefaultTextStyle(x => x.FontSize(8).FontColor(Navy));
                                t.Span("Genere le ");
                                t.Span(DateTime.Now.ToString("dd/MM/yyyy a HH:mm"));
                            });
                            r.RelativeItem().AlignRight().Text(t =>
                            {
                                t.DefaultTextStyle(x => x.FontSize(8).FontColor(Navy));
                                t.Span($"Orientation : {(isLandscape ? "Paysage" : "Portrait")}");
                            });
                        });
                });

                page.Content().PaddingTop(5).Column(col =>
                {
                    // Grouper les creneaux par jour
                    var groupes = slots.GroupBy(s => s.Jour).OrderBy(g => g.Key);

                    foreach (var groupe in groupes)
                    {
                        // ── EN-TETE DU JOUR (barre colorée) ──
                        col.Item().Background(Navy).Padding(6).Row(r =>
                        {
                            r.AutoItem().Text(JourFr(groupe.Key))
                                .FontSize(11).Bold().FontColor(Colors.White);
                            r.RelativeItem().AlignRight().Text($"{groupe.Count()} creneau{(groupe.Count() > 1 ? "x" : "")}")
                                .FontSize(8).FontColor(Sky);
                        });

                        // ── GRILLE DE CARTES (2 colonnes si paysage, 1 sinon) ──
                        var slotsJour = groupe.OrderBy(s => s.HeureDebut).ToList();
                        var colsParLigne = isLandscape ? 3 : 2;

                        for (int i = 0; i < slotsJour.Count; i += colsParLigne)
                        {
                            var ligne = slotsJour.Skip(i).Take(colsParLigne).ToList();
                            col.Item().Row(ligneRow =>
                            {
                                foreach (var slot in ligne)
                                {
                                    var typeBg = TypeBg(slot.Cours.Type);
                                    var typeFg = TypeFg(slot.Cours.Type);

                                    ligneRow.RelativeItem().Padding(3).
                                        Border(1).BorderColor(Color.FromHex("#CBD5E1")).
                                        Background(Colors.White).Column(card =>
                                    {
                                        // ── HAUT DE LA CARTE : heure + type badge ──
                                        card.Item().Background(typeBg).Padding(4).Row(top =>
                                        {
                                            top.RelativeItem().Text(string.Format("{0:HH:mm} - {1:HH:mm}", slot.HeureDebut, slot.HeureFin))
                                                .FontSize(9).Bold().FontColor(typeFg);
                                            top.AutoItem().Background(Colors.White).PaddingHorizontal(5).PaddingVertical(1)
                                                .Text(slot.Cours.Type.ToString()).FontSize(7).Bold().FontColor(typeFg).AlignCenter();
                                        });

                                        // ── INTITULE DU COURS ──
                                        card.Item().PaddingHorizontal(4).PaddingTop(3).Text(slot.Cours.Intitule)
                                            .FontSize(9).Bold().FontColor(Navy);

                                        // ── ENSEIGNANT ──
                                        card.Item().PaddingHorizontal(4).PaddingTop(1).Text(t =>
                                        {
                                            t.Span("Par ").FontSize(7).FontColor(Colors.Grey.Darken1);
                                            t.Span($"{slot.Enseignant.Prenom} {slot.Enseignant.Nom}")
                                                .FontSize(8).FontColor(Colors.Grey.Darken3).SemiBold();
                                        });

                                        // ── SALLE ──
                                        card.Item().PaddingHorizontal(4).PaddingBottom(4).PaddingTop(1).Text(t =>
                                        {
                                            t.Span("Salle ").FontSize(7).FontColor(Colors.Grey.Darken1);
                                            t.Span(slot.Salle.Numero).FontSize(8).FontColor(Colors.Grey.Darken3).SemiBold();
                                            if (!string.IsNullOrWhiteSpace(slot.Salle.Batiment))
                                            {
                                                t.Span(" - ").FontSize(7).FontColor(Colors.Grey.Darken1);
                                                t.Span(slot.Salle.Batiment).FontSize(7).FontColor(Colors.Grey.Darken1);
                                            }
                                        });
                                    });

                                    // Espacement entre cartes (via Padding sur RelativeItem)
                                }

                                // Completer les colonnes vides
                                for (int j = ligne.Count; j < colsParLigne; j++)
                                    ligneRow.RelativeItem();
                            });
                        }

                        // Espace entre les jours
                        col.Item().Height(6);
                    }
                });

                page.Footer().Column(f =>
                {
                    f.Item().Height(2).Background(Navy).ExtendHorizontal();
                    f.Item().Height(3);
                    f.Item().Row(r =>
                    {
                        r.RelativeItem().AlignLeft().Text(t =>
                        {
                            t.Span($"{ecoleNom} - ").FontSize(7).FontColor(Colors.Grey.Darken1);
                            t.Span("EDT - ").FontSize(7).FontColor(Colors.Grey.Darken1);
                            t.Span(sousTitre).FontSize(7).FontColor(Colors.Grey.Darken1);
                            if (!string.IsNullOrWhiteSpace(descriptionFiliere))
                                t.Span($" - {descriptionFiliere}").FontSize(7).FontColor(Colors.Grey.Darken1);
                        });
                        r.RelativeItem().AlignRight().Text(t =>
                        {
                            t.Span("Page ").FontSize(7).FontColor(Colors.Grey.Darken1);
                            t.CurrentPageNumber().FontSize(7).FontColor(Colors.Grey.Darken1);
                            t.Span(" / ").FontSize(7).FontColor(Colors.Grey.Darken1);
                            t.TotalPages().FontSize(7).FontColor(Colors.Grey.Darken1);
                        });
                    });
                });
            });
        });

        var bytes = doc.GeneratePdf();
        return File(bytes, "application/pdf", "edt.pdf");
    }
}
