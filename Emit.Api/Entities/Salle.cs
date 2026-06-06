namespace Emit.Api.Entities;

public class Salle
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Numero { get; set; } = null!;
    public string Batiment { get; set; } = null!;
    public int Capacite { get; set; }
    public TypeSalle Type { get; set; }
    public bool Disponible { get; set; } = true;
    public int Occupation { get; set; }
    public ICollection<SlotEDT> Slots { get; set; } = new List<SlotEDT>();
}
