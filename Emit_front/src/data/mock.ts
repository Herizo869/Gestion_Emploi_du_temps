import type {
  Enseignant,
  Salle,
  Cours,
  Niveau,
  Semestre,
  SlotEDT,
  Notif,
  LogEntry,
} from "@/types";

export const CRENEAUX = [
  "07h30 - 09h00",
  "09h15 - 10h45",
  "11h00 - 12h30",
  "13h30 - 15h00",
  "15h15 - 16h45",
  "17h00 - 18h30",
];

export const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;

export const enseignants: Enseignant[] = [
  { id: "e1", prenom: "Herizo", nom: "RAKOTO", email: "herizo@emit.mg", specialite: "Génie logiciel", statut: "permanent", nbCours: 4 },
  { id: "e2", prenom: "Miaro", nom: "RABE", email: "miaro@emit.mg", specialite: "Bases de données", statut: "permanent", nbCours: 3 },
  { id: "e3", prenom: "Andry", nom: "RANAIVO", email: "andry@emit.mg", specialite: "Réseaux", statut: "vacataire", nbCours: 2 },
  { id: "e4", prenom: "Kanto", nom: "RASOLO", email: "kanto@emit.mg", specialite: "Algorithmique", statut: "permanent", nbCours: 5 },
  { id: "e5", prenom: "Fita", nom: "RANDRIA", email: "fita@emit.mg", specialite: "Web & Mobile", statut: "invite", nbCours: 2 },
];

export const salles: Salle[] = [
  { id: "s1", numero: "A101", batiment: "A", capacite: 40, type: "Cours", disponible: true, occupation: 72 },
  { id: "s2", numero: "A102", batiment: "A", capacite: 40, type: "Cours", disponible: true, occupation: 65 },
  { id: "s3", numero: "B201", batiment: "B", capacite: 25, type: "TP", disponible: true, occupation: 91 },
  { id: "s4", numero: "B202", batiment: "B", capacite: 25, type: "TP", disponible: false, occupation: 0 },
  { id: "s5", numero: "AMPHI-1", batiment: "C", capacite: 200, type: "Amphi", disponible: true, occupation: 55 },
  { id: "s6", numero: "AMPHI-2", batiment: "C", capacite: 150, type: "Amphi", disponible: true, occupation: 48 },
];

export const niveaux: Niveau[] = [
  {
    id: "n1", libelle: "L1", effectifMax: 120,
    filieres: [
      { id: "f1", libelle: "INFO", description: "Informatique", nbCours: 8 },
      { id: "f2", libelle: "RESEAUX", description: "Réseaux & Télécoms", nbCours: 6 },
    ],
  },
  {
    id: "n2", libelle: "L2", effectifMax: 100,
    filieres: [{ id: "f3", libelle: "INFO", description: "Informatique", nbCours: 9 }],
  },
  {
    id: "n3", libelle: "L3", effectifMax: 80,
    filieres: [
      { id: "f4", libelle: "INFO", description: "Informatique", nbCours: 10 },
      { id: "f5", libelle: "RESEAUX", description: "Réseaux", nbCours: 7 },
    ],
  },
  {
    id: "n4", libelle: "M1", effectifMax: 50,
    filieres: [{ id: "f6", libelle: "GL", description: "Génie logiciel", nbCours: 8 }],
  },
  {
    id: "n5", libelle: "M2", effectifMax: 40,
    filieres: [{ id: "f7", libelle: "GL", description: "Génie logiciel", nbCours: 6 }],
  },
];

export const cours: Cours[] = [
  { id: "c1", intitule: "Algorithmique", type: "CM", volumeHoraire: 24, heuresPlanifiees: 18, niveau: "L1", filiere: "INFO", enseignantIds: ["e4"] },
  { id: "c2", intitule: "Algorithmique - TD", type: "TD", volumeHoraire: 12, heuresPlanifiees: 12, niveau: "L1", filiere: "INFO", enseignantIds: ["e4"] },
  { id: "c3", intitule: "Bases de données", type: "CM", volumeHoraire: 20, heuresPlanifiees: 20, niveau: "L2", filiere: "INFO", enseignantIds: ["e2"] },
  { id: "c4", intitule: "BDD - TP", type: "TP", volumeHoraire: 18, heuresPlanifiees: 9, niveau: "L2", filiere: "INFO", enseignantIds: ["e2"] },
  { id: "c5", intitule: "Génie logiciel", type: "CM", volumeHoraire: 30, heuresPlanifiees: 27, niveau: "L3", filiere: "INFO", enseignantIds: ["e1"] },
  { id: "c6", intitule: "Web & Mobile", type: "TP", volumeHoraire: 24, heuresPlanifiees: 12, niveau: "L3", filiere: "INFO", enseignantIds: ["e5"] },
  { id: "c7", intitule: "Architectures réseaux", type: "CM", volumeHoraire: 20, heuresPlanifiees: 0, niveau: "L3", filiere: "RESEAUX", enseignantIds: ["e3"] },
  { id: "c8", intitule: "DevOps", type: "TP", volumeHoraire: 16, heuresPlanifiees: 8, niveau: "M1", filiere: "GL", enseignantIds: ["e1"] },
];

export const semestres: Semestre[] = [
  { id: "sm1", libelle: "Semestre 1", annee: "2024-2025", statut: "publie", datePublication: "2024-09-15" },
  { id: "sm2", libelle: "Semestre 2", annee: "2024-2025", statut: "brouillon" },
  { id: "sm3", libelle: "Semestre 1", annee: "2023-2024", statut: "archive", datePublication: "2023-09-10" },
];

// EDT mock: planning L3 INFO
export const edtL3Info: SlotEDT[] = [
  { id: "sl1", jour: "Lundi", debut: "07h30", fin: "09h00", coursId: "c5", intitule: "Génie logiciel", type: "CM", enseignant: "H. RAKOTO", salle: "AMPHI-1", niveau: "L3", filiere: "INFO" },
  { id: "sl2", jour: "Lundi", debut: "09h15", fin: "10h45", coursId: "c6", intitule: "Web & Mobile", type: "TP", enseignant: "F. RANDRIA", salle: "B201", niveau: "L3", filiere: "INFO" },
  { id: "sl3", jour: "Mardi", debut: "11h00", fin: "12h30", coursId: "c3", intitule: "Bases de données", type: "CM", enseignant: "M. RABE", salle: "A101", niveau: "L3", filiere: "INFO" },
  { id: "sl4", jour: "Mercredi", debut: "13h30", fin: "15h00", coursId: "c5", intitule: "Génie logiciel", type: "TD", enseignant: "H. RAKOTO", salle: "A102", niveau: "L3", filiere: "INFO" },
  { id: "sl5", jour: "Jeudi", debut: "07h30", fin: "09h00", coursId: "c6", intitule: "Web & Mobile", type: "CM", enseignant: "F. RANDRIA", salle: "AMPHI-2", niveau: "L3", filiere: "INFO" },
  { id: "sl6", jour: "Vendredi", debut: "15h15", fin: "16h45", coursId: "c5", intitule: "Génie logiciel", type: "TP", enseignant: "H. RAKOTO", salle: "B201", niveau: "L3", filiere: "INFO" },
];

export const notifications: Notif[] = [
  { id: "n1", type: "planning", titre: "Planning modifié", description: "Le créneau de Lundi 09h15 a été déplacé en salle B201.", date: "Il y a 2h", lu: false },
  { id: "n2", type: "cours", titre: "Nouveau cours assigné", description: "Vous êtes désormais responsable de 'DevOps' (M1 - GL).", date: "Hier", lu: false },
  { id: "n3", type: "systeme", titre: "Confirmation", description: "Vos disponibilités ont bien été enregistrées.", date: "Il y a 2 jours", lu: true },
  { id: "n4", type: "planning", titre: "EDT publié", description: "L'emploi du temps du semestre 1 a été publié.", date: "Il y a 5 jours", lu: true },
];

export const journal: LogEntry[] = [
  { id: "l1", date: "2025-05-15 14:32", utilisateur: "Admin", action: "Modification", entite: "Slot EDT #sl2", ancien: "A101", nouveau: "B201" },
  { id: "l2", date: "2025-05-15 11:08", utilisateur: "Admin", action: "Generation", entite: "Semestre 2 2024-2025" },
  { id: "l3", date: "2025-05-14 16:50", utilisateur: "Admin", action: "Ajout", entite: "Enseignant Fita RANDRIA" },
  { id: "l4", date: "2025-05-13 09:12", utilisateur: "Admin", action: "Publication", entite: "EDT L3 INFO" },
  { id: "l5", date: "2025-05-12 18:00", utilisateur: "Admin", action: "Suppression", entite: "Salle B203" },
];

export const conflits = [
  { id: "k1", type: "Enseignant", description: "H. RAKOTO planifié deux fois Mardi 09h15", date: "Aujourd'hui 10:24" },
  { id: "k2", type: "Salle", description: "AMPHI-1 occupée par deux groupes Lundi 07h30", date: "Hier 17:02" },
];

export const statutNiveaux = [
  { niveau: "L1", statut: "Publié" },
  { niveau: "L2", statut: "Publié" },
  { niveau: "L3", statut: "Brouillon" },
  { niveau: "M1", statut: "Brouillon" },
  { niveau: "M2", statut: "Non démarré" },
] as const;
