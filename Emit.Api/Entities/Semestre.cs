namespace Emit.Api.Entities;

public class Semestre
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Libelle { get; set; } = null!;
    public string Annee { get; set; } = null!;
    public StatutSemestre Statut { get; set; } = StatutSemestre.Brouillon;
    public DateTime? DatePublication { get; set; }
    public ICollection<SlotEDT> Slots { get; set; } = new List<SlotEDT>();
}
