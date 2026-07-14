/**
 * Préférences utilisateur — stockées dans localStorage
 * Permet à l'utilisateur de configurer ses notifications et son affichage
 */

const PREFS_KEY = "emit-preferences";

export type NotifType = "planning" | "cours" | "salle" | "conflit" | "edt" | "systeme";

export interface NotificationPrefs {
  planning: boolean;
  cours: boolean;
  salle: boolean;
  conflit: boolean;
  edt: boolean;
  systeme: boolean;
}

export interface DisplayPrefs {
  /** Nombre de jours affichés dans la vue semaine (5 = lundi-vendredi) */
  weekDays: 5 | 7;
  /** Mode compact : afficher plus de créneaux sans défilement */
  compactMode: boolean;
  /** Créneaux par défaut du planning */
  defaultStartHour: number;  // 8
  defaultEndHour: number;    // 18
}

export interface UserPreferences {
  notifications: NotificationPrefs;
  affichage: DisplayPrefs;
}

const DEFAULTS: UserPreferences = {
  notifications: {
    planning: true,
    cours: true,
    salle: true,
    conflit: true,
    edt: true,
    systeme: true,
  },
  affichage: {
    weekDays: 5,
    compactMode: false,
    defaultStartHour: 8,
    defaultEndHour: 18,
  },
};

function load(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Fusionner avec les défauts pour combler les champs manquants
      return {
        notifications: { ...DEFAULTS.notifications, ...parsed.notifications },
        affichage: { ...DEFAULTS.affichage, ...parsed.affichage },
      };
    }
  } catch { /* ignore */ }
  return { ...DEFAULTS, notifications: { ...DEFAULTS.notifications }, affichage: { ...DEFAULTS.affichage } };
}

function save(prefs: UserPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/** Récupère toutes les préférences */
export function getPreferences(): UserPreferences {
  return load();
}

/** Met à jour les préférences de notification */
export function updateNotificationPrefs(updates: Partial<NotificationPrefs>): UserPreferences {
  const prefs = load();
  prefs.notifications = { ...prefs.notifications, ...updates };
  save(prefs);
  return prefs;
}

/** Met à jour les préférences d'affichage */
export function updateDisplayPrefs(updates: Partial<DisplayPrefs>): UserPreferences {
  const prefs = load();
  prefs.affichage = { ...prefs.affichage, ...updates };
  save(prefs);
  return prefs;
}

/** Réinitialise toutes les préférences */
export function resetPreferences(): UserPreferences {
  save(DEFAULTS);
  return { ...DEFAULTS, notifications: { ...DEFAULTS.notifications }, affichage: { ...DEFAULTS.affichage } };
}


