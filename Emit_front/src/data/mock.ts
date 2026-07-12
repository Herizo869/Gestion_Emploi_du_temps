import type {
  Enseignant,
  Salle,
  Cours,
  CoursType,
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
      { id: "f-l1-aes",   libelle: "AES",   description: "Administration Économique et Sociale",                           domaine: "Licence Management",                    nbCours: 4 },
      { id: "f-l1-da2i",  libelle: "DA2I",  description: "Développement d'Application Internet-Intranet",                  domaine: "Licence Informatique",                  nbCours: 5 },
      { id: "f-l1-cigsi", libelle: "CIGSI", description: "Conception, Intégration et Gestion des Systèmes d'Information",  domaine: "Licence Informatique",                  nbCours: 4 },
      { id: "f-l1-icm",   libelle: "ICM",   description: "Information et Communication Multimédia",                        domaine: "Licence Information et Communication",   nbCours: 3 },
    ],
  },
  {
    id: "n2", libelle: "L2", effectifMax: 100,
    filieres: [
      { id: "f-l2-aes",   libelle: "AES",   description: "Administration Économique et Sociale",                           domaine: "Licence Management",                    nbCours: 5 },
      { id: "f-l2-da2i",  libelle: "DA2I",  description: "Développement d'Application Internet-Intranet",                  domaine: "Licence Informatique",                  nbCours: 6 },
      { id: "f-l2-cigsi", libelle: "CIGSI", description: "Conception, Intégration et Gestion des Systèmes d'Information",  domaine: "Licence Informatique",                  nbCours: 5 },
      { id: "f-l2-icm",   libelle: "ICM",   description: "Information et Communication Multimédia",                        domaine: "Licence Information et Communication",   nbCours: 4 },
    ],
  },
  {
    id: "n3", libelle: "L3", effectifMax: 80,
    filieres: [
      { id: "f-l3-aes",   libelle: "AES",   description: "Administration Économique et Sociale",                           domaine: "Licence Management",                    nbCours: 6 },
      { id: "f-l3-da2i",  libelle: "DA2I",  description: "Développement d'Application Internet-Intranet",                  domaine: "Licence Informatique",                  nbCours: 7 },
      { id: "f-l3-cigsi", libelle: "CIGSI", description: "Conception, Intégration et Gestion des Systèmes d'Information",  domaine: "Licence Informatique",                  nbCours: 6 },
      { id: "f-l3-icm",   libelle: "ICM",   description: "Information et Communication Multimédia",                        domaine: "Licence Information et Communication",   nbCours: 5 },
    ],
  },
  {
    id: "n4", libelle: "M1", effectifMax: 50,
    filieres: [
      { id: "f-m1-md",     libelle: "MD",       description: "Management Décisionnel",                                     domaine: "Master Management",                              nbCours: 5 },
      { id: "f-m1-meda",   libelle: "MEDA",     description: "Management d'Entreprises et Développement des Affaires",     domaine: "Master Management",                              nbCours: 5 },
      { id: "f-m1-mbagen", libelle: "MBA-GEN",  description: "MBA Général",                                                domaine: "Master Management",                              nbCours: 6 },
      { id: "f-m1-mbaba",  libelle: "MBA-BA",   description: "MBA Business Analytics",                                     domaine: "Master Management",                              nbCours: 5 },
      { id: "f-m1-mbafi",  libelle: "MBA-FI",   description: "MBA Finance and Investment",                                 domaine: "Master Management",                              nbCours: 5 },
      { id: "f-m1-sigd",   libelle: "SIGD",     description: "Système d'Information, Géomatique et Décision",              domaine: "Master Informatique",                            nbCours: 5 },
      { id: "f-m1-m2i",    libelle: "M2I",      description: "Modélisation et Ingénierie Informatique",                   domaine: "Master Informatique",                            nbCours: 5 },
      { id: "f-m1-sdia",   libelle: "SDIA",     description: "Sciences de Données et Intelligence Artificielle",           domaine: "Master Informatique",                            nbCours: 5 },
      { id: "f-m1-igti",   libelle: "IGTI",     description: "Ingénierie Géospatiale et Technologies de l'Information",   domaine: "Master Informatique",                            nbCours: 4 },
      { id: "f-m1-micm",   libelle: "MICM",     description: "Information et Communication Multimédia",                   domaine: "Master Information, Communication et Multimédia", nbCours: 4 },
      { id: "f-m1-cnmp",   libelle: "CNMP",     description: "Communication Numérique et Management de Projet",            domaine: "Master Information, Communication et Multimédia", nbCours: 4 },
      { id: "f-m1-cm",     libelle: "CM",       description: "Communication Multimédia",                                  domaine: "Master Information, Communication et Multimédia", nbCours: 4 },
      { id: "f-m1-cine",   libelle: "CINE",     description: "Cinématographie",                                           domaine: "Master Information, Communication et Multimédia", nbCours: 4 },
    ],
  },
  {
    id: "n5", libelle: "M2", effectifMax: 40,
    filieres: [
      { id: "f-m2-md",     libelle: "MD",       description: "Management Décisionnel",                                     domaine: "Master Management",                              nbCours: 4 },
      { id: "f-m2-meda",   libelle: "MEDA",     description: "Management d'Entreprises et Développement des Affaires",     domaine: "Master Management",                              nbCours: 4 },
      { id: "f-m2-mbagen", libelle: "MBA-GEN",  description: "MBA Général",                                                domaine: "Master Management",                              nbCours: 5 },
      { id: "f-m2-mbaba",  libelle: "MBA-BA",   description: "MBA Business Analytics",                                     domaine: "Master Management",                              nbCours: 4 },
      { id: "f-m2-mbafi",  libelle: "MBA-FI",   description: "MBA Finance and Investment",                                 domaine: "Master Management",                              nbCours: 4 },
      { id: "f-m2-sigd",   libelle: "SIGD",     description: "Système d'Information, Géomatique et Décision",              domaine: "Master Informatique",                            nbCours: 4 },
      { id: "f-m2-m2i",    libelle: "M2I",      description: "Modélisation et Ingénierie Informatique",                   domaine: "Master Informatique",                            nbCours: 4 },
      { id: "f-m2-sdia",   libelle: "SDIA",     description: "Sciences de Données et Intelligence Artificielle",           domaine: "Master Informatique",                            nbCours: 4 },
      { id: "f-m2-igti",   libelle: "IGTI",     description: "Ingénierie Géospatiale et Technologies de l'Information",   domaine: "Master Informatique",                            nbCours: 3 },
      { id: "f-m2-micm",   libelle: "MICM",     description: "Information et Communication Multimédia",                   domaine: "Master Information, Communication et Multimédia", nbCours: 3 },
      { id: "f-m2-cnmp",   libelle: "CNMP",     description: "Communication Numérique et Management de Projet",            domaine: "Master Information, Communication et Multimédia", nbCours: 3 },
      { id: "f-m2-cm",     libelle: "CM",       description: "Communication Multimédia",                                  domaine: "Master Information, Communication et Multimédia", nbCours: 3 },
      { id: "f-m2-cine",   libelle: "CINE",     description: "Cinématographie",                                           domaine: "Master Information, Communication et Multimédia", nbCours: 3 },
    ],
  },
];

export const cours: Cours[] = [
  { id: "c1", intitule: "Algorithmique",         type: "CM", volumeHoraire: 24, heuresPlanifiees: 18, niveauId: "n1", niveauLibelle: "L1", filiereId: "f-l1-da2i",  filiereLibelle: "DA2I",   enseignantIds: ["e4"] },
  { id: "c2", intitule: "Algorithmique - TD",     type: "TD", volumeHoraire: 12, heuresPlanifiees: 12, niveauId: "n1", niveauLibelle: "L1", filiereId: "f-l1-da2i",  filiereLibelle: "DA2I",   enseignantIds: ["e4"] },
  { id: "c3", intitule: "Bases de données",       type: "CM", volumeHoraire: 20, heuresPlanifiees: 20, niveauId: "n2", niveauLibelle: "L2", filiereId: "f-l2-cigsi", filiereLibelle: "CIGSI",  enseignantIds: ["e2"] },
  { id: "c4", intitule: "BDD - TP",               type: "TP", volumeHoraire: 18, heuresPlanifiees:  9, niveauId: "n2", niveauLibelle: "L2", filiereId: "f-l2-cigsi", filiereLibelle: "CIGSI",  enseignantIds: ["e2"] },
  { id: "c5", intitule: "Génie logiciel",          type: "CM", volumeHoraire: 30, heuresPlanifiees: 27, niveauId: "n3", niveauLibelle: "L3", filiereId: "f-l3-da2i",  filiereLibelle: "DA2I",   enseignantIds: ["e1"] },
  { id: "c6", intitule: "Web & Mobile",            type: "TP", volumeHoraire: 24, heuresPlanifiees: 12, niveauId: "n3", niveauLibelle: "L3", filiereId: "f-l3-da2i",  filiereLibelle: "DA2I",   enseignantIds: ["e5"] },
  { id: "c7", intitule: "Architectures réseaux",   type: "CM", volumeHoraire: 20, heuresPlanifiees:  0, niveauId: "n3", niveauLibelle: "L3", filiereId: "f-l3-cigsi", filiereLibelle: "CIGSI",  enseignantIds: ["e3"] },
  { id: "c8", intitule: "DevOps",                  type: "TP", volumeHoraire: 16, heuresPlanifiees:  8, niveauId: "n4", niveauLibelle: "M1", filiereId: "f-m1-m2i",   filiereLibelle: "M2I",    enseignantIds: ["e1"] },
];

export const semestres: Semestre[] = [
  { id: "sm1", libelle: "Semestre 1", annee: "2024-2025", statut: "publie", datePublication: "2024-09-15" },
  { id: "sm2", libelle: "Semestre 2", annee: "2024-2025", statut: "brouillon" },
  { id: "sm3", libelle: "Semestre 1", annee: "2023-2024", statut: "archive", datePublication: "2023-09-10" },
];

// EDT mock: planning L3 INFO
export const edtL3Info: SlotEDT[] = [
  { id: "sl1", jour: "Lundi",    debut: "07h30", fin: "09h00", coursId: "c5", intitule: "Génie logiciel",   type: "CM", enseignantId: "e1", enseignant: "H. RAKOTO",  salleId: "s5", salle: "AMPHI-1", niveau: "L3", filiere: "INFO" },
  { id: "sl2", jour: "Lundi",    debut: "09h15", fin: "10h45", coursId: "c6", intitule: "Web & Mobile",     type: "TP", enseignantId: "e5", enseignant: "F. RANDRIA", salleId: "s3", salle: "B201",    niveau: "L3", filiere: "INFO" },
  { id: "sl3", jour: "Mardi",    debut: "11h00", fin: "12h30", coursId: "c3", intitule: "Bases de données", type: "CM", enseignantId: "e2", enseignant: "M. RABE",    salleId: "s1", salle: "A101",    niveau: "L3", filiere: "INFO" },
  { id: "sl4", jour: "Mercredi", debut: "13h30", fin: "15h00", coursId: "c5", intitule: "Génie logiciel",   type: "TD", enseignantId: "e1", enseignant: "H. RAKOTO",  salleId: "s2", salle: "A102",    niveau: "L3", filiere: "INFO" },
  { id: "sl5", jour: "Jeudi",    debut: "07h30", fin: "09h00", coursId: "c6", intitule: "Web & Mobile",     type: "CM", enseignantId: "e5", enseignant: "F. RANDRIA", salleId: "s6", salle: "AMPHI-2", niveau: "L3", filiere: "INFO" },
  { id: "sl6", jour: "Vendredi", debut: "15h15", fin: "16h45", coursId: "c5", intitule: "Génie logiciel",   type: "TP", enseignantId: "e1", enseignant: "H. RAKOTO",  salleId: "s3", salle: "B201",    niveau: "L3", filiere: "INFO" },
  { id: "sl7", jour: "Lundi",    debut: "11h00", fin: "12h30", coursId: "c3", intitule: "Sécurité info.",   type: "CM", enseignantId: "e2", enseignant: "M. RABE",    salleId: "s1", salle: "A101",    niveau: "L3", filiere: "INFO" },
  { id: "sl8", jour: "Jeudi",    debut: "13h30", fin: "15h00", coursId: "c4", intitule: "BDD avancée",      type: "TP", enseignantId: "e2", enseignant: "M. RABE",    salleId: "s4", salle: "B202",    niveau: "L3", filiere: "INFO" },
];

// EDT mock: planning L3 RESEAUX
export const edtL3Reseaux: SlotEDT[] = [
  { id: "sr1", jour: "Lundi",    debut: "07h30", fin: "09h00", coursId: "c7", intitule: "Architectures réseaux",  type: "CM", enseignantId: "e3", enseignant: "A. RANAIVO", salleId: "s6", salle: "AMPHI-2", niveau: "L3", filiere: "RESEAUX" },
  { id: "sr2", jour: "Mardi",    debut: "09h15", fin: "10h45", coursId: "c7", intitule: "Protocoles TCP/IP",      type: "TD", enseignantId: "e3", enseignant: "A. RANAIVO", salleId: "s2", salle: "A102",    niveau: "L3", filiere: "RESEAUX" },
  { id: "sr3", jour: "Mercredi", debut: "11h00", fin: "12h30", coursId: "c7", intitule: "Sécurité réseau",       type: "CM", enseignantId: "e3", enseignant: "A. RANAIVO", salleId: "s1", salle: "A101",    niveau: "L3", filiere: "RESEAUX" },
  { id: "sr4", jour: "Jeudi",    debut: "07h30", fin: "09h00", coursId: "c7", intitule: "Réseaux sans fil",      type: "TP", enseignantId: "e3", enseignant: "A. RANAIVO", salleId: "s3", salle: "B201",    niveau: "L3", filiere: "RESEAUX" },
  { id: "sr5", jour: "Vendredi", debut: "13h30", fin: "15h00", coursId: "c7", intitule: "Administration réseau", type: "TD", enseignantId: "e3", enseignant: "A. RANAIVO", salleId: "s1", salle: "A101",    niveau: "L3", filiere: "RESEAUX" },
];

// EDT mock: planning L1 INFO
export const edtL1Info: SlotEDT[] = [
  { id: "l1i1", jour: "Lundi",    debut: "07h30", fin: "09h00", coursId: "c1", intitule: "Algorithmique",       type: "CM", enseignantId: "e4", enseignant: "K. RASOLO",  salleId: "s5", salle: "AMPHI-1", niveau: "L1", filiere: "DA2I" },
  { id: "l1i2", jour: "Lundi",    debut: "09h15", fin: "10h45", coursId: "c2", intitule: "Algorithmique - TD",  type: "TD", enseignantId: "e4", enseignant: "K. RASOLO",  salleId: "s1", salle: "A101",    niveau: "L1", filiere: "DA2I" },
  { id: "l1i3", jour: "Mardi",    debut: "07h30", fin: "09h00", coursId: "c1", intitule: "Maths discrètes",     type: "CM", enseignantId: "e4", enseignant: "K. RASOLO",  salleId: "s5", salle: "AMPHI-1", niveau: "L1", filiere: "DA2I" },
  { id: "l1i4", jour: "Mercredi", debut: "09h15", fin: "10h45", coursId: "c2", intitule: "Prog. Initiation",    type: "TP", enseignantId: "e2", enseignant: "M. RABE",    salleId: "s3", salle: "B201",    niveau: "L1", filiere: "DA2I" },
  { id: "l1i5", jour: "Jeudi",    debut: "11h00", fin: "12h30", coursId: "c1", intitule: "Architecture machine", type: "CM", enseignantId: "e1", enseignant: "H. RAKOTO",  salleId: "s6", salle: "AMPHI-2", niveau: "L1", filiere: "DA2I" },
  { id: "l1i6", jour: "Vendredi", debut: "07h30", fin: "09h00", coursId: "c2", intitule: "Logique formelle",    type: "CM", enseignantId: "e4", enseignant: "K. RASOLO",  salleId: "s1", salle: "A101",    niveau: "L1", filiere: "DA2I" },
];

// EDT mock: planning L1 CIGSI
export const edtL1Reseaux: SlotEDT[] = [
  { id: "l1r1", jour: "Lundi",    debut: "11h00", fin: "12h30", coursId: "c7", intitule: "Intro. aux réseaux",  type: "CM", enseignantId: "e3", enseignant: "A. RANAIVO", salleId: "s6", salle: "AMPHI-2", niveau: "L1", filiere: "CIGSI" },
  { id: "l1r2", jour: "Mardi",    debut: "13h30", fin: "15h00", coursId: "c7", intitule: "Câblage & infra",     type: "TP", enseignantId: "e3", enseignant: "A. RANAIVO", salleId: "s3", salle: "B201",    niveau: "L1", filiere: "CIGSI" },
  { id: "l1r3", jour: "Mercredi", debut: "07h30", fin: "09h00", coursId: "c7", intitule: "Modèle OSI",          type: "CM", enseignantId: "e3", enseignant: "A. RANAIVO", salleId: "s1", salle: "A101",    niveau: "L1", filiere: "CIGSI" },
  { id: "l1r4", jour: "Vendredi", debut: "09h15", fin: "10h45", coursId: "c7", intitule: "Réseaux locaux",      type: "TD", enseignantId: "e3", enseignant: "A. RANAIVO", salleId: "s2", salle: "A102",    niveau: "L1", filiere: "CIGSI" },
];

// EDT mock: planning L2 INFO
export const edtL2Info: SlotEDT[] = [
  { id: "l2i1", jour: "Lundi",    debut: "07h30", fin: "09h00", coursId: "c3", intitule: "Bases de données",    type: "CM", enseignantId: "e2", enseignant: "M. RABE",   salleId: "s5", salle: "AMPHI-1", niveau: "L2", filiere: "CIGSI" },
  { id: "l2i2", jour: "Lundi",    debut: "13h30", fin: "15h00", coursId: "c4", intitule: "BDD - TP",            type: "TP", enseignantId: "e2", enseignant: "M. RABE",   salleId: "s3", salle: "B201",    niveau: "L2", filiere: "CIGSI" },
  { id: "l2i3", jour: "Mardi",    debut: "09h15", fin: "10h45", coursId: "c3", intitule: "POO Java",             type: "CM", enseignantId: "e1", enseignant: "H. RAKOTO", salleId: "s1", salle: "A101",    niveau: "L2", filiere: "CIGSI" },
  { id: "l2i4", jour: "Mercredi", debut: "07h30", fin: "09h00", coursId: "c4", intitule: "POO - TP",             type: "TP", enseignantId: "e1", enseignant: "H. RAKOTO", salleId: "s4", salle: "B202",    niveau: "L2", filiere: "CIGSI" },
  { id: "l2i5", jour: "Jeudi",    debut: "11h00", fin: "12h30", coursId: "c3", intitule: "Structures données",   type: "CM", enseignantId: "e4", enseignant: "K. RASOLO", salleId: "s1", salle: "A101",    niveau: "L2", filiere: "CIGSI" },
  { id: "l2i6", jour: "Vendredi", debut: "15h15", fin: "16h45", coursId: "c4", intitule: "Algorithmique avancée", type: "TD", enseignantId: "e4", enseignant: "K. RASOLO", salleId: "s2", salle: "A102",    niveau: "L2", filiere: "CIGSI" },
];

// EDT mock: planning M1 M2I
export const edtM1Gl: SlotEDT[] = [
  { id: "m1g1", jour: "Lundi",    debut: "09h15", fin: "10h45", coursId: "c8", intitule: "DevOps",               type: "TP", enseignantId: "e1", enseignant: "H. RAKOTO",  salleId: "s3", salle: "B201",    niveau: "M1", filiere: "M2I" },
  { id: "m1g2", jour: "Mardi",    debut: "07h30", fin: "09h00", coursId: "c8", intitule: "Architecture logicielle", type: "CM", enseignantId: "e1", enseignant: "H. RAKOTO",  salleId: "s1", salle: "A101",    niveau: "M1", filiere: "M2I" },
  { id: "m1g3", jour: "Mercredi", debut: "13h30", fin: "15h00", coursId: "c8", intitule: "Microservices",         type: "CM", enseignantId: "e1", enseignant: "H. RAKOTO",  salleId: "s6", salle: "AMPHI-2", niveau: "M1", filiere: "M2I" },
  { id: "m1g4", jour: "Jeudi",    debut: "09h15", fin: "10h45", coursId: "c8", intitule: "DevOps - TD",           type: "TD", enseignantId: "e5", enseignant: "F. RANDRIA", salleId: "s2", salle: "A102",    niveau: "M1", filiere: "M2I" },
  { id: "m1g5", jour: "Vendredi", debut: "11h00", fin: "12h30", coursId: "c8", intitule: "Cloud Computing",       type: "CM", enseignantId: "e1", enseignant: "H. RAKOTO",  salleId: "s5", salle: "AMPHI-1", niveau: "M1", filiere: "M2I" },
];

// EDT mock: planning M2 SDIA
export const edtM2Gl: SlotEDT[] = [
  { id: "m2g1", jour: "Lundi",    debut: "13h30", fin: "15h00", coursId: "c8", intitule: "Recherche & Mémoire",    type: "TD", enseignantId: "e1", enseignant: "H. RAKOTO",  salleId: "s1", salle: "A101",    niveau: "M2", filiere: "SDIA" },
  { id: "m2g2", jour: "Mardi",    debut: "15h15", fin: "16h45", coursId: "c8", intitule: "IA & Machine Learning",   type: "CM", enseignantId: "e4", enseignant: "K. RASOLO",  salleId: "s5", salle: "AMPHI-1", niveau: "M2", filiere: "SDIA" },
  { id: "m2g3", jour: "Mercredi", debut: "09h15", fin: "10h45", coursId: "c8", intitule: "Big Data",               type: "TP", enseignantId: "e2", enseignant: "M. RABE",    salleId: "s3", salle: "B201",    niveau: "M2", filiere: "SDIA" },
  { id: "m2g4", jour: "Jeudi",    debut: "11h00", fin: "12h30", coursId: "c8", intitule: "Sécurité avancée",       type: "CM", enseignantId: "e3", enseignant: "A. RANAIVO", salleId: "s1", salle: "A101",    niveau: "M2", filiere: "SDIA" },
];

const EDT_TEACHERS = ["H. RAKOTO", "M. RABE", "A. RANAIVO", "K. RASOLO", "F. RANDRIA"] as const;
const EDT_ROOMS = ["AMPHI-1", "AMPHI-2", "A101", "A102", "A103", "B201", "B203"] as const;
const EDT_TYPES: CoursType[] = ["CM", "TD", "TP"];
const EDT_TITLES = [
  "Fondamentaux",
  "Atelier pratique",
  "Methodologie",
  "Projet encadre",
  "Outils numeriques",
  "Analyse appliquee",
  "Systemes avances",
  "Communication professionnelle",
];

export const generatedEdtSlots: SlotEDT[] = niveaux.flatMap((niveau, niveauIdx) =>
  niveau.filieres.map((filiere, filiereIdx) => {
    const index = niveauIdx * 20 + filiereIdx;
    const [debut, fin] = CRENEAUX[index % CRENEAUX.length].split(" - ");
    const slug = `${niveau.libelle}-${filiere.libelle}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    return {
      id: `auto-${slug}`,
      jour: JOURS[Math.floor(index / CRENEAUX.length) % JOURS.length],
      debut,
      fin,
      coursId: `auto-cours-${slug}`,
      intitule: `${EDT_TITLES[index % EDT_TITLES.length]} ${filiere.libelle}`,
      type: EDT_TYPES[index % EDT_TYPES.length],
      enseignantId: `e${(index % 5) + 1}`,
      enseignant: EDT_TEACHERS[index % EDT_TEACHERS.length],
      salleId: `s${(index % 6) + 1}`,
      salle: EDT_ROOMS[index % EDT_ROOMS.length],
      niveau: niveau.libelle,
      filiere: filiere.libelle,
    };
  })
);

// Fusion de tous les slots EDT
export const allEdtSlots: SlotEDT[] = [
  ...generatedEdtSlots,
  ...edtL1Info, ...edtL1Reseaux,
  ...edtL2Info,
  ...edtL3Info, ...edtL3Reseaux,
  ...edtM1Gl, ...edtM2Gl,
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
