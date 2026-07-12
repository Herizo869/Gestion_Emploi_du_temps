namespace Emit.Api.Entities;

public class Enseignant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Prenom { get; set; } = null!;
    public string Nom { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Specialite { get; set; } = null!;
    public StatutEnseignant Statut { get; set; }
    /// <summary>ID de l'utilisateur Supabase Auth associé (créé par l'admin lors de l'ajout)</summary>
    public string? SupabaseAuthUserId { get; set; }
    public ICollection<CoursEnseignant> Cours { get; set; } = new List<CoursEnseignant>();
    public ICollection<SlotEDT> Slots { get; set; } = new List<SlotEDT>();
    public ICollection<Disponibilite> Disponibilites { get; set; } = new List<Disponibilite>();
}
