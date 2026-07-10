using System.ComponentModel.DataAnnotations;
using Emit.Api.Entities;

namespace Emit.Api.Dtos;

public class EnseignantDto
{
    public Guid Id { get; set; }
    [Required] public string Prenom { get; set; } = null!;
    [Required] public string Nom { get; set; } = null!;
    [Required, EmailAddress] public string Email { get; set; } = null!;
    public string Specialite { get; set; } = "";
    public StatutEnseignant Statut { get; set; }
    public int NbCours { get; set; }
    /// <summary>Total des heures disponibles cette semaine (depuis les disponibilités)</summary>
    public double HeuresDisponibles { get; set; }
    /// <summary>Total des heures planifiées dans l'EDT</summary>
    public double HeuresPlanifiees { get; set; }
}

public class SalleDto
{
    public Guid Id { get; set; }
    [Required] public string Numero { get; set; } = null!;
    public string Batiment { get; set; } = "";
    public int Capacite { get; set; }
    public TypeSalle Type { get; set; }
    public bool Disponible { get; set; }
    public int Occupation { get; set; }
}

public class CoursDto
{
    public Guid Id { get; set; }
    [Required] public string Intitule { get; set; } = null!;
    public CoursType Type { get; set; }
    public int VolumeHoraire { get; set; }
    public int HeuresPlanifiees { get; set; }
    public Guid NiveauId { get; set; }
    public string NiveauLibelle { get; set; } = "";
    public Guid FiliereId { get; set; }
    public string FiliereLibelle { get; set; } = "";
    public List<Guid> EnseignantIds { get; set; } = new();
}

public class FiliereDto
{
    public Guid Id { get; set; }
    public string Libelle { get; set; } = "";
    public string Description { get; set; } = "";
    public string Domaine { get; set; } = "";
    public int NbCours { get; set; }
}

public class NiveauDto
{
    public Guid Id { get; set; }
    public NiveauLibelle Libelle { get; set; }
    public int EffectifMax { get; set; }
    public List<FiliereDto> Filieres { get; set; } = new();
}

public class SemestreDto
{
    public Guid Id { get; set; }
    [Required] public string Libelle { get; set; } = null!;
    [Required] public string Annee { get; set; } = null!;
    public StatutSemestre Statut { get; set; }
    public DateTime? DatePublication { get; set; }
}

public class SlotEDTDto
{
    public Guid Id { get; set; }
    public Jour Jour { get; set; }
    public string Debut { get; set; } = "";  // "07h30"
    public string Fin { get; set; } = "";    // "09h00"
    public Guid CoursId { get; set; }
    public string Intitule { get; set; } = "";
    public CoursType Type { get; set; }
    public Guid EnseignantId { get; set; }
    public string Enseignant { get; set; } = ""; // "H. RAKOTO"
    public Guid SalleId { get; set; }
    public string Salle { get; set; } = "";
    public string Niveau { get; set; } = "";
    public string Filiere { get; set; } = "";
}

public class NotificationDto
{
    public Guid Id { get; set; }
    public NotifType Type { get; set; }
    public string Titre { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime Date { get; set; }
    public bool Lu { get; set; }
}

public class LogEntryDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Utilisateur { get; set; } = "";
    public LogAction Action { get; set; }
    public string Entite { get; set; } = "";
    public string? Ancien { get; set; }
    public string? Nouveau { get; set; }
}

public class ConflitDto
{
    public string Id { get; set; } = "";
    public string Type { get; set; } = ""; // "Enseignant" | "Salle"
    public string Description { get; set; } = "";
    public DateTime Date { get; set; }
}

public class SlotUpdateDto
{
    public Guid SalleId { get; set; }
    public Guid EnseignantId { get; set; }
    public Jour Jour { get; set; }
    public string HeureDebut { get; set; } = ""; // format "HH:mm", ex "07:30"
    public string HeureFin { get; set; } = "";   // format "HH:mm", ex "09:00"
}

public class SlotConflitResponse
{
    public string Message { get; set; } = "";
    public List<ConflitDto> Conflits { get; set; } = new();
    public List<string> SallesLibres { get; set; } = new();
}