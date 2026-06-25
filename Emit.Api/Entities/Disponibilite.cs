namespace Emit.Api.Entities;

public class Disponibilite
{
    public Guid Id { get; set; }
    public Guid EnseignantId { get; set; }
    public Enseignant Enseignant { get; set; } = null!;
    public string Jour { get; set; } = "";
    public string Creneau { get; set; } = "";
    public bool EstDisponible { get; set; }
    public bool EstIndisponible { get; set; }
}