using Emit.Api.Entities;

namespace Emit.Api.Dtos;

public class SlotCreateDto
{
    public Guid SemestreId { get; set; }

    public Guid CoursId { get; set; }

    public Guid EnseignantId { get; set; }

    public Guid SalleId { get; set; }

    public Guid NiveauId { get; set; }

    public Guid FiliereId { get; set; }

    public Jour Jour { get; set; }

    public string HeureDebut { get; set; } = "";

    public string HeureFin { get; set; } = "";
}