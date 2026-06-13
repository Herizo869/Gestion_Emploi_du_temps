namespace Emit.Api.Entities;

public class Filiere
{
    public Guid Id { get; set; } = Guid.NewGuid();
    /// <summary>Sigle court ex: DA2I, AES, SIGD…</summary>
    public string Libelle { get; set; } = null!;
    /// <summary>Intitulé complet de la filière</summary>
    public string Description { get; set; } = "";
    /// <summary>Mention / domaine : ex "Informatique", "Management"…</summary>
    public string Domaine { get; set; } = "";
    public Guid NiveauId { get; set; }
    public Niveau Niveau { get; set; } = null!;
    public ICollection<Cours> Cours { get; set; } = new List<Cours>();
}
