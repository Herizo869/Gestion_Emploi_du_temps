namespace Emit.Api.Entities;

public class Filiere
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Libelle { get; set; } = null!;
    public string Description { get; set; } = "";
    public Guid NiveauId { get; set; }
    public Niveau Niveau { get; set; } = null!;
    public ICollection<Cours> Cours { get; set; } = new List<Cours>();
}
