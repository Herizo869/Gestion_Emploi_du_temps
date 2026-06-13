export type Role = "admin" | "enseignant";

export interface User {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: Role;
  specialite?: string;
  statut?: "permanent" | "vacataire" | "invite";
}

export type CoursType = "CM" | "TD" | "TP";

export interface Enseignant {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  specialite: string;
  statut: "permanent" | "vacataire" | "invite";
  nbCours: number;
}

export interface Salle {
  id: string;
  numero: string;
  batiment: string;
  capacite: number;
  type: "Cours" | "TP" | "Amphi" | "Examen" | "Reunion";
  disponible: boolean;
  occupation: number;
}

export interface Cours {
  id: string;
  intitule: string;
  type: CoursType;
  volumeHoraire: number;
  heuresPlanifiees: number;
  niveau: string;
  filiere: string;
  enseignantIds: string[];
}

export interface Filiere {
  id: string;
  libelle: string;
  description: string;
  domaine?: string;
  nbCours: number;
}
export interface Niveau {
  id: string;
  libelle: "L1" | "L2" | "L3" | "M1" | "M2";
  effectifMax: number;
  filieres: Filiere[];
}

export interface Semestre {
  id: string;
  libelle: string;
  annee: string;
  statut: "brouillon" | "publie" | "archive";
  datePublication?: string;
}

export interface Creneau {
  jour: "Lundi" | "Mardi" | "Mercredi" | "Jeudi" | "Vendredi";
  debut: string;
  fin: string;
}

export interface SlotEDT {
  id: string;
  jour: Creneau["jour"];
  debut: string;
  fin: string;
  coursId: string;
  intitule: string;
  type: CoursType;
  enseignant: string;
  salle: string;
  niveau: string;
  filiere: string;
}

export interface Notif {
  id: string;
  type: "planning" | "cours" | "systeme";
  titre: string;
  description: string;
  date: string;
  lu: boolean;
}

export interface LogEntry {
  id: string;
  date: string;
  utilisateur: string;
  action: "Ajout" | "Modification" | "Suppression" | "Generation" | "Publication" | "Annulation";
  entite: string;
  ancien?: string;
  nouveau?: string;
}
