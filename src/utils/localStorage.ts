// Utilitaires pour gérer le localStorage du jeu

export function saveGameData(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
  }
}

export function loadGameData<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    return defaultValue;
  }
}
