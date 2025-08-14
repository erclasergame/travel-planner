// Utility per gestire sessionStorage per dati temporanei dell'itinerario
// File: utils/storageManager.js

// Chiavi per sessionStorage
const STORAGE_KEYS = {
  TEMP_ITINERARY: 'travelPlanner_tempItinerary',
  CONVERTED_ITINERARY: 'travelViewer_convertedItinerary',
  USER_PREFERENCES: 'travelPlanner_userPrefs',
  LAST_ACTIVITY: 'travelPlanner_lastActivity'
};

// TTL per i dati (in millisecondi)
const TTL = {
  TEMP_DATA: 2 * 60 * 60 * 1000, // 2 ore
  CONVERTED_DATA: 4 * 60 * 60 * 1000, // 4 ore  
  USER_PREFS: 7 * 24 * 60 * 60 * 1000 // 7 giorni
};

/**
 * Controlla se sessionStorage è disponibile nel browser
 * @returns {boolean} True se sessionStorage è supportato
 */
const isStorageAvailable = () => {
  try {
    if (typeof window === 'undefined') return false;
    const test = '__storage_test__';
    window.sessionStorage.setItem(test, test);
    window.sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('SessionStorage non disponibile:', e);
    return false;
  }
};

/**
 * Crea un oggetto con timestamp per TTL
 * @param {any} data - Dati da salvare
 * @param {number} ttl - Time to live in millisecondi
 * @returns {Object} Oggetto con data e metadati
 */
const createStorageObject = (data, ttl) => ({
  data,
  timestamp: Date.now(),
  expiresAt: Date.now() + ttl,
  version: '1.0'
});

/**
 * Controlla se un oggetto storage è scaduto
 * @param {Object} storageObj - Oggetto dal storage
 * @returns {boolean} True se scaduto
 */
const isExpired = (storageObj) => {
  if (!storageObj || !storageObj.expiresAt) return true;
  return Date.now() > storageObj.expiresAt;
};

/**
 * Salva dati in sessionStorage con TTL
 * @param {string} key - Chiave di storage
 * @param {any} data - Dati da salvare
 * @param {number} ttl - Time to live (opzionale)
 * @returns {boolean} True se salvato con successo
 */
const setItem = (key, data, ttl = TTL.TEMP_DATA) => {
  if (!isStorageAvailable()) {
    console.warn('Storage non disponibile, dati non salvati');
    return false;
  }

  try {
    const storageObj = createStorageObject(data, ttl);
    window.sessionStorage.setItem(key, JSON.stringify(storageObj));
    
    console.log(`📦 Salvato in storage: ${key}`, {
      size: JSON.stringify(data).length,
      expiresIn: Math.round(ttl / 1000 / 60) + ' minuti'
    });
    
    return true;
  } catch (error) {
    console.error('Errore salvataggio storage:', error);
    
    // Se quota exceeded, prova a pulire dati scaduti
    if (error.name === 'QuotaExceededError') {
      cleanExpiredData();
      try {
        const storageObj = createStorageObject(data, ttl);
        window.sessionStorage.setItem(key, JSON.stringify(storageObj));
        return true;
      } catch (retryError) {
        console.error('Errore anche dopo pulizia:', retryError);
      }
    }
    
    return false;
  }
};

/**
 * Recupera dati da sessionStorage con controllo TTL
 * @param {string} key - Chiave di storage
 * @returns {any|null} Dati recuperati o null se non trovati/scaduti
 */
const getItem = (key) => {
  if (!isStorageAvailable()) return null;

  try {
    const stored = window.sessionStorage.getItem(key);
    if (!stored) return null;

    const storageObj = JSON.parse(stored);
    
    // Controlla se scaduto
    if (isExpired(storageObj)) {
      console.log(`⏰ Dati scaduti rimossi: ${key}`);
      window.sessionStorage.removeItem(key);
      return null;
    }

    console.log(`📥 Recuperato da storage: ${key}`, {
      age: Math.round((Date.now() - storageObj.timestamp) / 1000 / 60) + ' minuti fa'
    });

    return storageObj.data;
  } catch (error) {
    console.error('Errore lettura storage:', error);
    // Rimuovi dato corrotto
    window.sessionStorage.removeItem(key);
    return null;
  }
};

/**
 * Rimuove un elemento da sessionStorage
 * @param {string} key - Chiave da rimuovere
 * @returns {boolean} True se rimosso con successo
 */
const removeItem = (key) => {
  if (!isStorageAvailable()) return false;

  try {
    window.sessionStorage.removeItem(key);
    console.log(`🗑️ Rimosso da storage: ${key}`);
    return true;
  } catch (error) {
    console.error('Errore rimozione storage:', error);
    return false;
  }
};

/**
 * Pulisce tutti i dati scaduti da sessionStorage
 * @returns {number} Numero di elementi rimossi
 */
const cleanExpiredData = () => {
  if (!isStorageAvailable()) return 0;

  let removedCount = 0;
  const keysToRemove = [];

  try {
    // Controlla tutti gli elementi nel sessionStorage
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (!key) continue;

      try {
        const stored = window.sessionStorage.getItem(key);
        if (!stored) continue;

        const storageObj = JSON.parse(stored);
        
        // Se ha una struttura con timestamp ed è scaduto
        if (storageObj.timestamp && isExpired(storageObj)) {
          keysToRemove.push(key);
        }
      } catch (e) {
        // Se non riesce a parsare, potrebbe essere corrotto
        if (key.startsWith('travelPlanner_') || key.startsWith('travelViewer_')) {
          keysToRemove.push(key);
        }
      }
    }

    // Rimuovi tutti i dati scaduti
    keysToRemove.forEach(key => {
      window.sessionStorage.removeItem(key);
      removedCount++;
    });

    if (removedCount > 0) {
      console.log(`🧹 Pulizia storage: rimossi ${removedCount} elementi scaduti`);
    }

  } catch (error) {
    console.error('Errore pulizia storage:', error);
  }

  return removedCount;
};

/**
 * Salva itinerario temporaneo (dal Travel Planner)
 * @param {Object} itinerary - Itinerario in formato Travel Planner
 * @param {Object} tripInfo - Info aggiuntive del viaggio
 * @returns {boolean} True se salvato
 */
export const saveTempItinerary = (itinerary, tripInfo = null) => {
  const data = {
    itinerary,
    tripInfo,
    source: 'travel_planner',
    savedAt: new Date().toISOString()
  };

  return setItem(STORAGE_KEYS.TEMP_ITINERARY, data, TTL.TEMP_DATA);
};

/**
 * Recupera itinerario temporaneo
 * @returns {Object|null} Itinerario salvato o null
 */
export const getTempItinerary = () => {
  return getItem(STORAGE_KEYS.TEMP_ITINERARY);
};

/**
 * Salva itinerario convertito per il viewer
 * @param {Object} convertedItinerary - Itinerario in formato Travel Viewer
 * @param {Object} originalItinerary - Itinerario originale (opzionale)
 * @returns {boolean} True se salvato
 */
export const saveConvertedItinerary = (convertedItinerary, originalItinerary = null) => {
  const data = {
    converted: convertedItinerary,
    original: originalItinerary,
    source: 'internal_conversion',
    convertedAt: new Date().toISOString()
  };

  return setItem(STORAGE_KEYS.CONVERTED_ITINERARY, data, TTL.CONVERTED_DATA);
};

/**
 * Recupera itinerario convertito
 * @returns {Object|null} Itinerario convertito o null
 */
export const getConvertedItinerary = () => {
  return getItem(STORAGE_KEYS.CONVERTED_ITINERARY);
};

/**
 * Salva preferenze utente
 * @param {Object} preferences - Preferenze utente
 * @returns {boolean} True se salvato
 */
export const saveUserPreferences = (preferences) => {
  return setItem(STORAGE_KEYS.USER_PREFERENCES, preferences, TTL.USER_PREFS);
};

/**
 * Recupera preferenze utente
 * @returns {Object|null} Preferenze o null
 */
export const getUserPreferences = () => {
  return getItem(STORAGE_KEYS.USER_PREFERENCES);
};

/**
 * Aggiorna timestamp ultima attività utente
 */
export const updateLastActivity = () => {
  const data = {
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.pathname : '/'
  };
  
  setItem(STORAGE_KEYS.LAST_ACTIVITY, data, TTL.TEMP_DATA);
};

/**
 * Controlla se l'utente è stato attivo di recente
 * @param {number} maxAgeMinutes - Età massima in minuti (default: 30)
 * @returns {boolean} True se attivo di recente
 */
export const isRecentlyActive = (maxAgeMinutes = 30) => {
  const lastActivity = getItem(STORAGE_KEYS.LAST_ACTIVITY);
  if (!lastActivity || !lastActivity.timestamp) return false;

  const ageMinutes = (Date.now() - lastActivity.timestamp) / 1000 / 60;
  return ageMinutes <= maxAgeMinutes;
};

/**
 * Pulisce tutti i dati relativi ai viaggi
 * @param {boolean} keepPreferences - Se true, mantiene le preferenze utente
 * @returns {boolean} True se pulito con successo
 */
export const clearTravelData = (keepPreferences = false) => {
  if (!isStorageAvailable()) return false;

  try {
    removeItem(STORAGE_KEYS.TEMP_ITINERARY);
    removeItem(STORAGE_KEYS.CONVERTED_ITINERARY);
    removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    
    if (!keepPreferences) {
      removeItem(STORAGE_KEYS.USER_PREFERENCES);
    }

    console.log('🧹 Dati viaggio puliti', { keepPreferences });
    return true;
  } catch (error) {
    console.error('Errore pulizia dati viaggio:', error);
    return false;
  }
};

/**
 * Ottieni statistiche dello storage
 * @returns {Object} Statistiche uso storage
 */
export const getStorageStats = () => {
  if (!isStorageAvailable()) {
    return { available: false };
  }

  try {
    let totalSize = 0;
    let itemCount = 0;
    let travelDataSize = 0;
    const items = {};

    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (!key) continue;

      const value = window.sessionStorage.getItem(key);
      const size = new Blob([value]).size;
      
      totalSize += size;
      itemCount++;
      
      if (key.startsWith('travel')) {
        travelDataSize += size;
      }

      items[key] = {
        size,
        sizeFormatted: formatBytes(size)
      };
    }

    return {
      available: true,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      travelDataSize,
      travelDataSizeFormatted: formatBytes(travelDataSize),
      itemCount,
      items,
      quotaUsed: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2) + '%' // Stima 5MB limite
    };
  } catch (error) {
    console.error('Errore calcolo statistiche storage:', error);
    return { available: true, error: error.message };
  }
};

/**
 * Formatta byte in formato leggibile
 * @param {number} bytes - Numero di byte
 * @returns {string} Formato leggibile (es: "1.2 KB")
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Esegue manutenzione automatica dello storage
 * - Pulisce dati scaduti
 * - Aggiorna timestamp attività
 * - Log statistiche se in development
 */
export const performMaintenance = () => {
  if (!isStorageAvailable()) return;

  try {
    // Pulisci dati scaduti
    cleanExpiredData();
    
    // Aggiorna ultima attività
    updateLastActivity();
    
    // Log statistiche in development
    if (process.env.NODE_ENV === 'development') {
      const stats = getStorageStats();
      console.log('📊 Storage stats:', stats);
    }
  } catch (error) {
    console.error('Errore manutenzione storage:', error);
  }
};

// Auto-manutenzione all'inizializzazione (solo browser)
if (typeof window !== 'undefined') {
  // Esegui manutenzione al caricamento
  setTimeout(performMaintenance, 1000);
  
  // Esegui manutenzione ogni 15 minuti
  setInterval(performMaintenance, 15 * 60 * 1000);
}

// Export utilities principali
export default {
  saveTempItinerary,
  getTempItinerary,
  saveConvertedItinerary,
  getConvertedItinerary,
  saveUserPreferences,
  getUserPreferences,
  updateLastActivity,
  isRecentlyActive,
  clearTravelData,
  getStorageStats,
  performMaintenance,
  
  // Utility di basso livello
  setItem,
  getItem,
  removeItem,
  cleanExpiredData
};