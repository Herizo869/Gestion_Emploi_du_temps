using AutoMapper;
using Emit.Api.Dtos;
using Emit.Api.Entities;

namespace Emit.Api.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Enseignant, EnseignantDto>()
            .ForMember(d => d.NbCours, o => o.MapFrom(s => s.Cours.Count));
        CreateMap<EnseignantDto, Enseignant>()
            .ForMember(e => e.Cours, o => o.Ignore())
            .ForMember(e => e.Slots, o => o.Ignore());

        CreateMap<Salle, SalleDto>();
        CreateMap<SalleDto, Salle>().ForMember(e => e.Slots, o => o.Ignore());

        CreateMap<Cours, CoursDto>()
            .ForMember(d => d.NiveauLibelle, o => o.MapFrom(s => s.Niveau.Libelle.ToString()))
            .ForMember(d => d.FiliereLibelle, o => o.MapFrom(s => s.Filiere.Libelle))
            .ForMember(d => d.EnseignantIds, o => o.MapFrom(s => s.Enseignants.Select(x => x.EnseignantId)));

        CreateMap<Filiere, FiliereDto>()
            .ForMember(d => d.NbCours, o => o.MapFrom(s => s.Cours.Count));

        CreateMap<Niveau, NiveauDto>();

        CreateMap<Semestre, SemestreDto>();
        CreateMap<SemestreDto, Semestre>().ForMember(e => e.Slots, o => o.Ignore());

        CreateMap<Notification, NotificationDto>()
            .ForMember(d => d.Date, o => o.MapFrom(s => s.DateCreation));

        CreateMap<LogEntry, LogEntryDto>();
    }
}
