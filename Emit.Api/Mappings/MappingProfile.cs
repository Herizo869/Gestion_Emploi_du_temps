using AutoMapper;
using Emit.Api.Dtos;
using Emit.Api.Entities;

namespace Emit.Api.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Enseignant, EnseignantDto>()
            .ForMember(d => d.NbCours, o => o.MapFrom(s => s.Cours.Count))
            .ForMember(d => d.HeuresDisponibles,
                o => o.MapFrom(s =>
                    s.Disponibilites == null
                        ? 0
                        : s.Disponibilites.Where(d => d.EstDisponible).Count() * 1.5))
            .ForMember(d => d.HeuresPlanifiees,
                o => o.MapFrom(s =>
                    s.Slots == null || s.Slots.Count == 0
                        ? 0
                        : s.Slots.Sum(slot =>
                            (slot.HeureFin.ToTimeSpan() - slot.HeureDebut.ToTimeSpan()).TotalHours)));
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

        CreateMap<Semestre, SemestreDto>()
            .ForMember(d => d.Statut, o => o.MapFrom(s => s.Statut.ToString().ToLowerInvariant()));
        CreateMap<SemestreDto, Semestre>()
            .ForMember(e => e.Statut, o => o.Ignore())
            .ForMember(e => e.Slots, o => o.Ignore());

        CreateMap<Notification, NotificationDto>()
            .ForMember(d => d.Date, o => o.MapFrom(s => s.DateCreation));

        CreateMap<LogEntry, LogEntryDto>();
        CreateMap<SystemSettings, SystemSettingsDto>()
            .ForMember(d => d.SmtpPass, o => o.Ignore()); // le mot de passe SMTP ne part jamais vers le front
    }
}
