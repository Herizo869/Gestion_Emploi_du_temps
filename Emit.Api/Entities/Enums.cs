namespace Emit.Api.Entities;

public enum Role { Admin, Enseignant }
public enum CoursType { CM, TD, TP }
public enum StatutEnseignant { Permanent, Vacataire, Invite }
public enum TypeSalle { Cours, TP, Amphi, Examen, Reunion }
public enum NiveauLibelle { L1, L2, L3, M1, M2 }
public enum StatutSemestre { Brouillon, Publie, Archive }
public enum Jour { Lundi, Mardi, Mercredi, Jeudi, Vendredi }
public enum NotifType { Planning, Cours, Systeme }
public enum LogAction { Ajout, Modification, Suppression, Generation, Publication, Annulation }
