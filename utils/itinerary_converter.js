// Utility per convertire itinerari dal formato Travel Planner al formato Travel Viewer
// File: utils/itineraryConverter.js

// Mappa coordinate delle città principali italiane
const CITY_COORDINATES = {
  'milano': [45.4642, 9.1900],
  'roma': [41.9028, 12.4964],
  'napoli': [40.8518, 14.2681],
  'bari': [41.1171, 16.8719],
  'firenze': [43.7696, 11.2558],
  'venezia': [45.4408, 12.3155],
  'torino': [45.0703, 7.6869],
  'palermo': [38.1157, 13.3615],
  'bologna': [44.4949, 11.3426],
  'genova': [44.4056, 8.9463],
  'verona': [45.4384, 10.9916],
  'catania': [37.5079, 15.0830],
  'cagliari': [39.2238, 9.1217],
  'trieste': [45.6495, 13.7768],
  'brescia': [45.5416, 10.2118],
  'parma': [44.8015, 10.3279],
  'modena': [44.6471, 10.9252],
  'reggio_emilia': [44.6960, 10.6297],
  'perugia': [43.1122, 12.3888],
  'ancona': [43.6158, 13.5189],
  'lecce': [40.3515, 18.1750],
  'matera': [40.6663, 16.6043],
  'alberobello': [40.7812, 17.2336],
  'siena': [43.3188, 11.3306],
  'pisa': [43.7160, 10.4037],
  'padova': [45.4064, 11.8768],
  'vicenza': [45.5455, 11.5353],
  'treviso': [45.6669, 12.2428],
  'udine': [46.0747, 13.2345]
};

/**
 * Genera coordinate GPS per una location specifica
 * @param {string} locationName - Nome della location/attività
 * @param {string} cityName - Nome della città base
 * @returns {number[]} Array [lat, lng]
 */
export const getCoordinatesForLocation = (locationName, cityName) => {
  const cityLower = cityName.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/à|á/g, 'a')
    .replace(/è|é/g, 'e')
    .replace(/ì|í/g, 'i')
    .replace(/ò|ó/g, 'o')
    .replace(/ù|ú/g, 'u');
    
  const baseCoords = CITY_COORDINATES[cityLower];
  
  if (!baseCoords) {
    // Fallback: coordinate centrali Italia
    console.warn(`Città non trovata: ${cityName}, usando coordinate centrali Italia`);
    return [41.8719, 12.5674];
  }
  
  // Aggiungi piccola variazione per location specifiche (±500m)
  const variation = 0.005;
  const randomLat = baseCoords[0] + (Math.random() - 0.5) * variation;
  const randomLng = baseCoords[1] + (Math.random() - 0.5) * variation;
  
  return [
    parseFloat(randomLat.toFixed(6)), 
    parseFloat(randomLng.toFixed(6))
  ];
};

/**
 * Rileva il tipo di attività dalla descrizione
 * @param {string} description - Descrizione dell'attività
 * @param {string[]} alternatives - Alternative disponibili
 * @returns {string} Tipo di attività
 */
export const detectActivityType = (description, alternatives = []) => {
  const desc = description.toLowerCase();
  const allText = [desc, ...alternatives.map(a => a.toLowerCase())].join(' ');
  
  // Pattern per riconoscere i tipi di attività
  const patterns = {
    accommodation: [
      'check-in', 'hotel', 'b&b', 'bed and breakfast', 'albergo', 'ostello',
      'affittacamere', 'appartamento', 'casa vacanze', 'resort', 'pension',
      'alloggio', 'dormire', 'pernottamento'
    ],
    meal: [
      'colazione', 'pranzo', 'cena', 'aperitivo', 'bar', 'ristorante', 
      'trattoria', 'osteria', 'pizzeria', 'caffè', 'pasticceria', 'gelato',
      'enoteca', 'taverna', 'degustazione', 'spritz', 'drink'
    ],
    attraction: [
      'visita', 'museo', 'castello', 'basilica', 'chiesa', 'duomo', 
      'palazzo', 'monumenti', 'centro storico', 'passeggiata', 'tour',
      'galleria', 'pinacoteca', 'teatro', 'opera', 'mostra', 'monumento'
    ],
    shopping: [
      'mercato', 'shopping', 'acquisti', 'negozi', 'boutique', 'outlet',
      'centro commerciale', 'prodotti tipici', 'souvenir'
    ],
    travel: [
      'trasferimento', 'viaggio', 'spostamento', 'autobus', 'treno', 
      'taxi', 'metro', 'aereo', 'navetta', 'aeroporto', 'stazione', 'volo'
    ]
  };
  
  // Trova il tipo con più corrispondenze
  let bestType = 'attraction'; // default
  let maxMatches = 0;
  
  for (const [type, keywords] of Object.entries(patterns)) {
    const matches = keywords.filter(keyword => allText.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestType = type;
    }
  }
  
  return bestType;
};

/**
 * Rileva il sottotipo dei pasti
 * @param {string} description - Descrizione del pasto
 * @param {string} time - Orario del pasto
 * @returns {string} Sottotipo del pasto
 */
export const detectMealSubtype = (description, time) => {
  const desc = description.toLowerCase();
  
  // Riconoscimento esplicito dalle parole chiave
  if (desc.includes('colazione') || desc.includes('breakfast')) return 'breakfast';
  if (desc.includes('pranzo') || desc.includes('lunch')) return 'lunch';
  if (desc.includes('cena') || desc.includes('dinner')) return 'dinner';
  if (desc.includes('aperitivo') || desc.includes('aperitif') || desc.includes('spritz')) return 'aperitif';
  if (desc.includes('gelato') || desc.includes('dessert') || desc.includes('dolce')) return 'dessert';
  
  // Fallback basato sull'orario
  if (time) {
    const timeStr = time.split('-')[0]; // Prendi l'orario di inizio
    const hour = parseInt(timeStr.split(':')[0]);
    
    if (hour >= 7 && hour <= 10) return 'breakfast';
    if (hour >= 12 && hour <= 15) return 'lunch';
    if (hour >= 17 && hour <= 19) return 'aperitif';
    if (hour >= 19 || hour <= 2) return 'dinner';
  }
  
  return 'lunch'; // default
};

/**
 * Estrae le specialità dalla descrizione e note
 * @param {string} description - Descrizione dell'attività
 * @param {string} notes - Note aggiuntive
 * @param {string[]} alternatives - Alternative disponibili
 * @returns {string[]} Array di specialità
 */
export const extractSpecialties = (description, notes = '', alternatives = []) => {
  const allText = [description, notes, ...alternatives].join(' ').toLowerCase();
  
  // Pattern per specialità culinarie
  const specialtyPatterns = [
    /(?:provare|assaggiare|specialità|piatto|gustare)\s+([^,\.;]+)/g,
    /([a-z\s]+)\s+(?:tipic[io]|local[ei]|tradizional[ei])/g,
    /(?:con|di)\s+([a-z\s]{3,30})(?:\s+e\s+|\s*,|\s*$)/g
  ];
  
  const specialties = [];
  
  specialtyPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(allText)) !== null) {
      const specialty = match[1].trim();
      if (specialty.length > 2 && specialty.length < 50) {
        specialties.push(specialty);
      }
    }
  });
  
  // Rimuovi duplicati e limita a 3
  return [...new Set(specialties)].slice(0, 3);
};

/**
 * Calcola le statistiche del giorno
 * @param {Object[]} activities - Array delle attività del giorno
 * @returns {Object} Statistiche del giorno
 */
export const calculateDayStats = (activities) => {
  // Calcola costi
  const costs = activities
    .map(a => a.cost)
    .filter(cost => cost && cost !== 'Gratuito' && cost !== '0€')
    .map(cost => {
      const match = cost.match(/(\d+)(?:-(\d+))?/);
      return match ? parseInt(match[1]) : 0;
    });
  
  const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
  const stops = activities.filter(a => a.type !== 'travel').length;
  
  // Calcola durata totale stimata
  const durations = activities
    .map(a => a.duration)
    .filter(d => d && d !== 'check-in')
    .map(d => {
      const match = d.match(/(\d+)(?:h|:(\d+))?/);
      if (match) {
        const hours = parseInt(match[1]) || 0;
        const minutes = match[2] ? parseInt(match[2]) : 0;
        return hours * 60 + minutes;
      }
      return 60; // default 1h
    });
  
  const totalMinutes = durations.reduce((sum, d) => sum + d, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return {
    km: Math.floor(Math.random() * 20) + 5, // Stima km locali 5-25km
    time: hours > 0 ? `${hours}h${minutes > 0 ? minutes + 'm' : ''}` : `${minutes}m`,
    cost: totalCost > 0 ? `${totalCost}-${Math.floor(totalCost * 1.3)}€` : '0€',
    drivingTime: stops > 5 ? '45min' : '30min', // Stima tempo guida
    stops
  };
};

/**
 * Funzione principale: converte itinerario da formato Travel Planner a Travel Viewer
 * @param {Object} originalItinerary - Itinerario in formato Travel Planner
 * @returns {Object} Itinerario convertito per Travel Viewer
 */
export const convertTravelPlannerToViewer = (originalItinerary) => {
  console.log('🔄 Inizio conversione itinerario...', originalItinerary);
  
  const { tripInfo, itinerary } = originalItinerary;
  
  if (!tripInfo || !itinerary) {
    throw new Error('Formato itinerario non valido: mancano tripInfo o itinerary');
  }
  
  // Estrai città di destinazione (per coordinate)
  const destinationCity = tripInfo.to || 'roma';
  
  // Converti metadati
  const metadata = {
    id: `${tripInfo.from}-${tripInfo.to}-${new Date().getFullYear()}`.toLowerCase(),
    title: `${tripInfo.from.charAt(0).toUpperCase() + tripInfo.from.slice(1)} → ${tripInfo.to.charAt(0).toUpperCase() + tripInfo.to.slice(1)}`,
    description: tripInfo.description || `Viaggio da ${tripInfo.from} a ${tripInfo.to}`,
    duration: parseInt(tripInfo.duration) || itinerary.length,
    totalKm: 0, // Calcolato dopo
    totalTime: '0h',
    totalCost: '0€',
    created: originalItinerary.exportedAt || new Date().toISOString(),
    modified: new Date().toISOString(),
    isPublic: false,
    tags: [
      tripInfo.to.toLowerCase(), 
      'viaggio', 
      'cultura', 
      'gastronomia'
    ].filter(Boolean)
  };
  
  // Converti giorni
  const convertedDays = [];
  let totalKm = 0;
  let totalCostMin = 0;
  let totalCostMax = 0;
  
  for (const day of itinerary) {
    const convertedActivities = [];
    
    // Itera su tutti i movimenti del giorno
    for (const movement of day.movements || []) {
      // Itera su tutte le attività del movimento
      for (const activity of movement.activities || []) {
        const activityType = detectActivityType(activity.description, activity.alternatives);
        
        // Genera coordinate per questa attività
        const coords = getCoordinatesForLocation(activity.description, destinationCity);
        
        // Calcola durata dall'orario
        let duration = '1h'; // default
        if (activity.time && activity.time.includes('-')) {
          const timeParts = activity.time.split('-');
          if (timeParts.length === 2) {
            const start = timeParts[0].split(':');
            const end = timeParts[1].split(':');
            const startMin = parseInt(start[0]) * 60 + parseInt(start[1] || 0);
            const endMin = parseInt(end[0]) * 60 + parseInt(end[1] || 0);
            const diff = endMin - startMin;
            if (diff > 0) {
              duration = diff >= 60 ? 
                `${Math.floor(diff / 60)}h${diff % 60 > 0 ? (diff % 60) + 'm' : ''}` : 
                `${diff}m`;
            }
          }
        }
        
        const convertedActivity = {
          id: `day${day.day}-${convertedActivities.length + 1}`,
          type: activityType,
          name: activity.alternatives && activity.alternatives.length > 0 
            ? activity.alternatives[0] 
            : activity.description.split('.')[0].split(',')[0].trim(),
          time: activity.time ? activity.time.split('-')[0] : undefined,
          coords,
          description: activity.description,
          duration,
          cost: activity.cost || '0€',
          required: activityType === 'meal' || activityType === 'accommodation',
          alternatives: activity.alternatives || [],
          notes: activity.notes || ''
        };
        
        // Aggiungi proprietà specifiche per tipo
        if (activityType === 'meal') {
          convertedActivity.subtype = detectMealSubtype(activity.description, activity.time);
          convertedActivity.cuisine = 'italiana'; // default
          convertedActivity.specialties = extractSpecialties(
            activity.description, 
            activity.notes, 
            activity.alternatives
          );
        }
        
        if (activityType === 'accommodation') {
          convertedActivity.accommodationType = 'hotel'; // default
          convertedActivity.checkIn = '15:00';
          convertedActivity.checkOut = '11:00';
        }
        
        convertedActivities.push(convertedActivity);
        
        // Calcola costi per statistiche totali
        if (activity.cost && activity.cost !== 'Gratuito' && activity.cost !== '0€') {
          const costMatch = activity.cost.match(/(\d+)(?:-(\d+))?/);
          if (costMatch) {
            totalCostMin += parseInt(costMatch[1]);
            totalCostMax += parseInt(costMatch[2]) || parseInt(costMatch[1]);
          }
        }
      }
    }
    
    // Calcola statistiche del giorno
    const dayStats = calculateDayStats(convertedActivities);
    totalKm += parseInt(dayStats.km);
    
    const convertedDay = {
      dayNumber: day.day,
      date: new Date(Date.now() + (day.day - 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      stats: dayStats,
      activities: convertedActivities
    };
    
    convertedDays.push(convertedDay);
  }
  
  // Aggiorna metadati con statistiche finali
  metadata.totalKm = totalKm;
  metadata.totalCost = totalCostMin > 0 ? 
    `${totalCostMin}-${totalCostMax || Math.floor(totalCostMin * 1.3)}€` : 
    '0€';
  
  // Calcola tempo totale (somma dei tempi dei giorni)
  const totalDayTimes = convertedDays.map(day => {
    const timeStr = day.stats.time;
    const match = timeStr.match(/(\d+)h(?:(\d+)m)?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      return hours * 60 + minutes;
    }
    return 0;
  });
  
  const totalMinutes = totalDayTimes.reduce((sum, minutes) => sum + minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  metadata.totalTime = totalHours > 0 ? 
    `${totalHours}h${remainingMinutes > 0 ? remainingMinutes + 'm' : ''}` : 
    `${remainingMinutes}m`;
  
  const result = {
    metadata,
    days: convertedDays,
    settings: {
      mapStyle: 'openstreetmap',
      defaultZoom: 12,
      showRoute: true,
      currency: 'EUR',
      language: 'it'
    }
  };
  
  console.log('✅ Conversione completata:', result);
  return result;
};

/**
 * Valida se un itinerario ha il formato Travel Planner corretto
 * @param {Object} itinerary - Itinerario da validare
 * @returns {Object} Risultato validazione {valid: boolean, errors: string[]}
 */
export const validateTravelPlannerFormat = (itinerary) => {
  const errors = [];
  
  if (!itinerary) {
    errors.push('Itinerario non fornito');
    return { valid: false, errors };
  }
  
  if (!itinerary.tripInfo) {
    errors.push('Manca sezione tripInfo');
  } else {
    if (!itinerary.tripInfo.from) errors.push('Manca campo tripInfo.from');
    if (!itinerary.tripInfo.to) errors.push('Manca campo tripInfo.to');
    if (!itinerary.tripInfo.duration) errors.push('Manca campo tripInfo.duration');
  }
  
  if (!itinerary.itinerary) {
    errors.push('Manca sezione itinerary');
  } else if (!Array.isArray(itinerary.itinerary)) {
    errors.push('itinerary deve essere un array');
  } else {
    itinerary.itinerary.forEach((day, index) => {
      if (!day.day) errors.push(`Giorno ${index}: manca campo 'day'`);
      if (!day.movements) errors.push(`Giorno ${index}: manca campo 'movements'`);
      if (day.movements && !Array.isArray(day.movements)) {
        errors.push(`Giorno ${index}: 'movements' deve essere un array`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: errors.length === 0 ? ['Formato itinerario valido'] : []
  };
};

// Export delle utility come default
export default {
  convertTravelPlannerToViewer,
  validateTravelPlannerFormat,
  getCoordinatesForLocation,
  detectActivityType,
  detectMealSubtype,
  extractSpecialties,
  calculateDayStats,
  CITY_COORDINATES
};