using Emit.Api.Dtos;
using Emit.Api.Entities;

namespace Emit.Api.Services;

public static class SlotMapper
{
    public static string Fmt(TimeOnly t) => t.ToString("HH\\hmm");

    public static SlotEDTDto ToDto(SlotEDT s) => new()
    {
        Id = s.Id,
        Jour = s.Jour,
        Debut = Fmt(s.HeureDebut),
        Fin = Fmt(s.HeureFin),
        CoursId = s.CoursId,
        Intitule = s.Cours?.Intitule ?? "",
        Type = s.Cours?.Type ?? CoursType.CM,
        EnseignantId = s.EnseignantId,
        Enseignant = s.Enseignant != null ? $"{s.Enseignant.Prenom[0]}. {s.Enseignant.Nom}" : "",
        SalleId = s.SalleId,
        Salle = s.Salle?.Numero ?? "",
        Niveau = s.Niveau?.Libelle.ToString() ?? "",
        Filiere = s.Filiere?.Libelle ?? ""
    };
}
