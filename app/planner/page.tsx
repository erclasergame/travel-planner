/*
 * Travel Planner - Main Page with Timeline Layout
 * Version: 2.1.0 - Timeline Integration  
 * Last Modified: 2025-08-15
 * Changes: Integrated timeline layout from HTML prototype, keeping all existing logic
 */

'use client'

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Clock, Users, Download, Sparkles, ArrowLeft, ChevronRight, Lightbulb, Edit3, Trash2, Utensils, Camera, Bed, Coffee, ShoppingBag, Music, MapIcon, Plane, Globe, ExternalLink, Calendar, Star, AlertCircle, Car, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { convertTravelPlannerToViewer } from '@/utils/itineraryConverter';
import { saveConvertedItinerary } from '@/utils/storageManager';

const TravelPlanner = () => {
  const router = useRouter();
  
  // ✅ All existing state management
  const [currentScreen, setCurrentScreen] = useState('form');
  const [tripData, setTripData] = useState({
    from: '',
    to: '',
    duration: '',
    people: '',
    description: '',
    startDate: ''
  });
  const [travelPlan, setTravelPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [convertingToViewer, setConvertingToViewer] = useState(false);
  
  // Modello globale dal server
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  // Tracking modifiche utente
  const [userHasModified, setUserHasModified] = useState(false);
  const [lastAIVersion, setLastAIVersion] = useState(null);
  const [itineraryMetadata, setItineraryMetadata] = useState(null);

  // ✅ Carica modello globale dal server
  useEffect(() => {
    const loadGlobalModel = async () => {
      try {
        console.log('📖 Loading global AI model from Redis...');
        const response = await fetch('/api/admin-settings');
        const data = await response.json();
        
        if (data.success && data.settings?.aiModel) {
          console.log('✅ Global model loaded:', data.settings.aiModel);
          setSelectedModel(data.settings.aiModel);
        } else {
          console.log('⚠️ No global model configured, using fallback');
          setSelectedModel('google/gemma-2-9b-it:free');
        }
      } catch (error) {
        console.error('❌ Error loading global model:', error);
        setSelectedModel('google/gemma-2-9b-it:free'); 
      }
      setIsModelLoaded(true);
    };

    loadGlobalModel();
  }, []);

  // ✅ Utility functions for timeline layout  
  const getActivityTypeInfo = (type) => {
    const typeMap = {
      travel: { color: '#10b981', icon: '✈️', label: 'TRAVEL' },
      accommodation: { color: '#8b5cf6', icon: '🏨', label: 'HOTEL' },
      attraction: { color: '#3b82f6', icon: '📷', label: 'ATTRAZIONE' },
      meal: { color: '#ef4444', icon: '🍽️', label: 'PASTO' },
      shopping: { color: '#f59e0b', icon: '🛍️', label: 'SHOPPING' },
      activity: { color: '#14b8a6', icon: '🎯', label: 'ATTIVITÀ' },
      freetime: { color: '#9ca3af', icon: '🕐', label: 'LIBERO' }
    };
    return typeMap[type] || typeMap.activity;
  };

  const formatDuration = (time) => {
    if (!time || !time.includes('-')) return '';
    const [start, end] = time.split('-');
    if (!start || !end) return '';
    
    try {
      const startParts = start.split(':').map(Number);
      const endParts = end.split(':').map(Number);
      const startMinutes = startParts[0] * 60 + (startParts[1] || 0);
      const endMinutes = endParts[0] * 60 + (endParts[1] || 0);
      const diffMinutes = endMinutes - startMinutes;
      
      if (diffMinutes > 0) {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return hours > 0 ? (minutes > 0 ? `(${hours}h${minutes}m)` : `(${hours}h)`) : `(${minutes}m)`;
      }
    } catch (error) {
      return '';
    }
    return '';
  };

  // Enhanced activity type detection
  const getActivityTypeInfoDetailed = (description, existingType) => {
    const desc = description?.toLowerCase() || '';
    
    if (existingType) {
      return {
        type: existingType,
        icon: getActivityIcon(existingType),
        color: getActivityColor(existingType)
      };
    }
    
    let type = 'activity';
    
    if (desc.includes('pranzo') || desc.includes('cena') || desc.includes('colazione') || 
        desc.includes('ristorante') || desc.includes('trattoria') || desc.includes('osteria') || 
        desc.includes('pizzeria') || desc.includes('aperitivo') || desc.includes('bar') || 
        desc.includes('caffè') || desc.includes('spritz') || desc.includes('drink')) {
      type = 'meal';
    } else if (desc.includes('hotel') || desc.includes('check-in') || desc.includes('alloggio') || 
               desc.includes('dormire') || desc.includes('pernottamento')) {
      type = 'accommodation';
    } else if (desc.includes('museo') || desc.includes('galleria') || desc.includes('mostra') || 
               desc.includes('visita') || desc.includes('monumento') || desc.includes('basilica') || 
               desc.includes('chiesa') || desc.includes('palazzo') || desc.includes('castello')) {
      type = 'attraction';
    } else if (desc.includes('shopping') || desc.includes('mercato') || desc.includes('negozi') || 
               desc.includes('acquisti') || desc.includes('souvenir')) {
      type = 'shopping';
    } else if (desc.includes('trasferimento') || desc.includes('aeroporto') || desc.includes('stazione') || 
               desc.includes('volo') || desc.includes('treno')) {
      type = 'travel';
    }
    
    return {
      type,
      icon: getActivityIcon(type),
      color: getActivityColor(type)
    };
  };

  // Enhanced icon system
  const getActivityIcon = (type, subtype) => {
    switch (type) {
      case 'meal':
        if (subtype === 'breakfast') return <Coffee className="h-4 w-4 text-amber-600" />;
        if (subtype === 'lunch') return <Utensils className="h-4 w-4 text-orange-600" />;
        if (subtype === 'dinner') return <Utensils className="h-4 w-4 text-red-600" />;
        if (subtype === 'aperitif') return <Coffee className="h-4 w-4 text-purple-600" />;
        return <Utensils className="h-4 w-4 text-orange-600" />;
      case 'accommodation':
        return <Bed className="h-4 w-4 text-purple-600" />;
      case 'attraction':
        return <Camera className="h-4 w-4 text-blue-600" />;
      case 'shopping':
        return <ShoppingBag className="h-4 w-4 text-green-600" />;
      case 'travel':
        return <Plane className="h-4 w-4 text-gray-600" />;
      case 'activity':
        return <MapIcon className="h-4 w-4 text-teal-600" />;
      default:
        return <Camera className="h-4 w-4 text-blue-600" />;
    }
  };

  // Activity colors
  const getActivityColor = (type) => {
    switch (type) {
      case 'meal': return '#f97316';
      case 'accommodation': return '#8b5cf6';
      case 'attraction': return '#3b82f6';
      case 'shopping': return '#10b981';
      case 'travel': return '#6b7280';
      case 'activity': return '#14b8a6';
      default: return '#3b82f6';
    }
  };

  // Generate activity ID
  const generateActivityId = (dayNumber, activityIndex) => {
    return `day${dayNumber}-${activityIndex + 1}`;
  };

  // Format date for display
  const formatDateForDay = (dayNumber, startDate) => {
    if (!startDate) {
      return `Day ${dayNumber}`;
    }
    
    try {
      const start = new Date(startDate);
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + (dayNumber - 1));
      
      const options = { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      };
      return `Day ${dayNumber} - ${dayDate.toLocaleDateString('it-IT', options)}`;
    } catch (error) {
      return `Day ${dayNumber}`;
    }
  };

  const suggestedPrompt = `Vogliamo visitare i luoghi più iconici e caratteristici della città, con un mix equilibrato di cultura, gastronomia locale e vita quotidiana. Ci interessano:

🏛️ CULTURA: Monumenti famosi, musei principali, quartieri storici
🍝 GASTRONOMIA: Ristoranti tipici locali, specialità da provare, mercati alimentari  
🚶 ESPERIENZE: Passeggiate panoramiche, vita di quartiere, tradizioni locali
⏰ RITMO: Viaggio rilassato con tempo per godersi ogni luogo, pause caffè/aperitivi
💰 BUDGET: Fascia media (né troppo economico né lusso estremo)
❌ EVITARE: Trappole per turisti, luoghi troppo affollati se possibile

Preferiamo un itinerario che ci faccia sentire come abitanti temporanei piuttosto che semplici turisti di passaggio.`;

  const fillSuggestedPrompt = () => {
    setTripData({...tripData, description: suggestedPrompt});
  };

  // Salva snapshot per tracciare modifiche
  const saveAISnapshot = (plan) => {
    setLastAIVersion(JSON.stringify(plan));
    setUserHasModified(false);
  };

  // Verifica se utente ha modificato
  const checkForModifications = () => {
    if (!lastAIVersion) return false;
    const currentVersion = JSON.stringify(travelPlan);
    return currentVersion !== lastAIVersion;
  };

  useEffect(() => {
    if (lastAIVersion) {
      setUserHasModified(checkForModifications());
    }
  }, [travelPlan, lastAIVersion]);

  // Enhanced createWebPage with metadata
  const createWebPage = async () => {
    if (!travelPlan || travelPlan.length === 0) {
      alert('⚠️ Nessun itinerario da convertire. Genera prima un itinerario.');
      return;
    }

    setConvertingToViewer(true);
    try {
      console.log('📄 Iniziando conversione locale per viewer...');

      const originalItinerary = {
        tripInfo: tripData,
        itinerary: travelPlan,
        metadata: itineraryMetadata,
        exportedAt: new Date().toISOString(),
        aiModel: selectedModel,
        convertedFrom: 'travel_planner',
        version: '2.0'
      };

      console.log('📋 Dati originali preparati (v2.0):', {
        days: travelPlan.length,
        from: tripData.from,
        to: tripData.to,
        hasStartDate: !!tripData.startDate,
        hasMetadata: !!itineraryMetadata
      });

      const convertedItinerary = convertTravelPlannerToViewer(originalItinerary);

      console.log('✅ Conversione completata:', {
        title: convertedItinerary.metadata.title,
        days: convertedItinerary.days.length,
        totalActivities: convertedItinerary.days.reduce((sum, day) => sum + day.activities.length, 0)
      });

      const saved = saveConvertedItinerary(convertedItinerary, originalItinerary);
      
      if (!saved) {
        console.warn('⚠️ Impossibile salvare in sessionStorage, procedo comunque');
      }

      console.log('🚀 Reindirizzando a viewer/result...');
      router.push('/viewer/result');

    } catch (error) {
      console.error('❌ Errore conversione locale:', error);
      alert(`Errore durante la conversione: ${error.message}`);
    } finally {
      setConvertingToViewer(false);
    }
  };

  // Enhanced AI generation with new format
  const generateAIPlan = async () => {
    if (!selectedModel) {
      alert('⚠️ Nessun modello AI configurato. Contatta l\'amministratore.');
      return;
    }

    console.log('🚀 Generando con modello globale:', selectedModel);
    console.log('📝 TripData v2.0:', tripData);
    
    setLoading(true);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripData,
          action: 'generate',
          selectedModel: selectedModel,
          formatVersion: '2.0'
        })
      });

      const responseText = await response.text();
      console.log('📄 Raw API response v2.0:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Errore parsing JSON: ${parseError.message}. Response: ${responseText}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      let aiResponse;
      try {
        aiResponse = JSON.parse(data.content);
      } catch (contentParseError) {
        throw new Error(`Errore parsing contenuto AI: ${contentParseError.message}. Content: ${data.content}`);
      }
      
      // Handle new format with metadata
      let formattedPlan;
      let metadata = null;
      
      if (aiResponse.metadata && aiResponse.itinerary) {
        console.log('✅ Detected new format v2.0 with metadata');
        metadata = aiResponse.metadata;
        formattedPlan = aiResponse.itinerary.map((day, index) => ({
          id: Date.now() + index,
          day: day.day || (index + 1),
          date: formatDateForDay(day.day || (index + 1), tripData.startDate),
          movements: (day.movements || []).map((movement, mIndex) => ({
            id: Date.now() + index * 1000 + mIndex,
            from: movement.from || '',
            to: movement.to || '',
            transport: movement.transport || '',
            activities: (movement.activities || []).map((activity, aIndex) => ({
              id: activity.id || generateActivityId(day.day || (index + 1), aIndex),
              name: activity.name || activity.description?.split('.')[0] || '',
              description: activity.description || '',
              time: activity.time || '',
              duration: activity.duration || '',
              type: activity.type || 'activity',
              subtype: activity.subtype || null,
              required: activity.required || false,
              cost: activity.cost || '',
              alternatives: activity.alternatives || [],
              notes: activity.notes || ''
            }))
          }))
        }));
      } else {
        console.log('⚠️ Using legacy format, converting...');
        formattedPlan = (Array.isArray(aiResponse) ? aiResponse : []).map((day, index) => ({
          id: Date.now() + index,
          day: day.day || (index + 1),
          date: formatDateForDay(day.day || (index + 1), tripData.startDate),
          movements: (day.movements || []).map((movement, mIndex) => ({
            id: Date.now() + index * 1000 + mIndex,
            from: movement.from || '',
            to: movement.to || '',
            transport: movement.transport || '',
            activities: (movement.activities || []).map((activity, aIndex) => {
              const typeInfo = getActivityTypeInfoDetailed(activity.description || '');
              return {
                id: generateActivityId(day.day || (index + 1), aIndex),
                name: activity.description?.split('.')[0]?.split(',')[0]?.trim() || '',
                description: activity.description || '',
                time: activity.time || '',
                duration: activity.duration || '1h',
                type: typeInfo.type,
                subtype: null,
                required: typeInfo.type === 'accommodation' || typeInfo.type === 'meal',
                cost: activity.cost || '',
                alternatives: activity.alternatives || [],
                notes: activity.notes || ''
              };
            })
          }))
        }));
      }
      
      setTravelPlan(formattedPlan);
      setItineraryMetadata(metadata);
      saveAISnapshot(formattedPlan);
      setCurrentScreen('editor');
      
    } catch (error) {
      console.error('❌ Errore nella generazione:', error);
      alert(`Errore nella generazione del piano: ${error.message}`);
    }
    setLoading(false);
  };

  // Gestione piano di viaggio
  const addDay = () => {
    const newDay = {
      id: Date.now(),
      day: travelPlan.length + 1,
      date: formatDateForDay(travelPlan.length + 1, tripData.startDate),
      movements: []
    };
    setTravelPlan([...travelPlan, newDay]);
    setUserHasModified(true);
  };

  const addMovement = (dayId) => {
    setTravelPlan(travelPlan.map(day => 
      day.id === dayId 
        ? {
            ...day, 
            movements: [...day.movements, {
              id: Date.now(),
              from: '',
              to: '',
              activities: []
            }]
          }
        : day
    ));
    setUserHasModified(true);
  };

  const addActivity = (dayId, movementId) => {
    setTravelPlan(travelPlan.map(day => 
      day.id === dayId 
        ? {
            ...day,
            movements: day.movements.map((movement) =>
              movement.id === movementId
                ? {
                    ...movement,
                    activities: [...movement.activities, {
                      id: Date.now(),
                      name: '',
                      description: '',
                      time: '',
                      duration: '1h',
                      type: 'activity',
                      subtype: null,
                      required: false,
                      cost: '',
                      alternatives: [],
                      notes: ''
                    }]
                  }
                : movement
            )
          }
        : day
    ));
    setUserHasModified(true);
  };

  const removeActivity = (dayId, movementId, activityId) => {
    setTravelPlan(travelPlan.map(day => 
      day.id === dayId 
        ? {
            ...day,
            movements: day.movements.map((movement) =>
              movement.id === movementId
                ? {
                    ...movement,
                    activities: movement.activities.filter((activity) => activity.id !== activityId)
                  }
                : movement
            )
          }
        : day
    ));
    setUserHasModified(true);
  };

  const updateMovement = (dayId, movementId, field, value) => {
    setTravelPlan(travelPlan.map(day => 
      day.id === dayId 
        ? {
            ...day,
            movements: day.movements.map((movement) =>
              movement.id === movementId
                ? { ...movement, [field]: value }
                : movement
            )
          }
        : day
    ));
    setUserHasModified(true);
  };

  // Enhanced activity update with type detection
  const updateActivity = (dayId, movementId, activityId, field, value) => {
    setTravelPlan(travelPlan.map(day => 
      day.id === dayId 
        ? {
            ...day,
            movements: day.movements.map((movement) =>
              movement.id === movementId
                ? {
                    ...movement,
                    activities: movement.activities.map((activity) => {
                      if (activity.id === activityId) {
                        const updatedActivity = { ...activity, [field]: value };
                        
                        // Auto-update type when description changes
                        if (field === 'description' && value) {
                          const typeInfo = getActivityTypeInfoDetailed(value, activity.type);
                          updatedActivity.type = typeInfo.type;
                          
                          // Auto-generate name from description if name is empty
                          if (!activity.name) {
                            updatedActivity.name = value.split('.')[0].split(',')[0].trim();
                          }
                        }
                        
                        return updatedActivity;
                      }
                      return activity;
                    })
                  }
                : movement
            )
          }
        : day
    ));
    setUserHasModified(true);
  };

  // Process plan
  const processPlan = async () => {
    if (!selectedModel) {
      alert('⚠️ Nessun modello AI configurato. Contatta l\'amministratore.');
      return;
    }

    console.log('🚀 Processando con modello globale:', selectedModel);
    setLoading(true);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripData,
          travelPlan,
          action: 'process',
          selectedModel: selectedModel,
          formatVersion: '2.0'
        })
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let data = JSON.parse(responseText);
      if (data.error) throw new Error(data.error);

      let processedResponse = JSON.parse(data.content);
      
      let processedPlan;
      if (processedResponse.itinerary) {
        processedPlan = processedResponse.itinerary;
        if (processedResponse.metadata) {
          setItineraryMetadata(processedResponse.metadata);
        }
      } else {
        processedPlan = processedResponse;
      }
      
      const formattedPlan = processedPlan.map((day, index) => ({
        id: day.id || Date.now() + index,
        day: day.day,
        date: day.date || formatDateForDay(day.day, tripData.startDate),
        movements: (day.movements || []).map((movement, mIndex) => ({
          id: movement.id || Date.now() + index * 1000 + mIndex,
          from: movement.from,
          to: movement.to,
          transport: movement.transport || '',
          activities: (movement.activities || []).map((activity, aIndex) => ({
            id: activity.id || generateActivityId(day.day, aIndex),
            name: activity.name || activity.description?.split('.')[0] || '',
            description: activity.description,
            time: activity.time,
            duration: activity.duration || '1h',
            type: activity.type || 'activity',
            subtype: activity.subtype || null,
            required: activity.required || false,
            cost: activity.cost || '',
            alternatives: activity.alternatives || [],
            notes: activity.notes || ''
          }))
        }))
      }));
      
      setTravelPlan(formattedPlan);
      saveAISnapshot(formattedPlan);
    } catch (error) {
      console.error('❌ Errore nell\'elaborazione:', error);
      alert(`Errore nell'elaborazione del piano: ${error.message}`);
    }
    setLoading(false);
  };

  // Export JSON
  const downloadJSON = () => {
    const dataStr = JSON.stringify({
      tripInfo: tripData,
      itinerary: travelPlan,
      metadata: itineraryMetadata,
      aiModel: selectedModel,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    }, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `viaggio-${tripData.from}-${tripData.to}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // SCREEN 1: Form iniziale
  if (currentScreen === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-lg mx-auto pt-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Travel Planner</h1>
            <p className="text-gray-600">Pianifica il tuo viaggio perfetto</p>
            <div className="text-xs text-gray-500 mt-2">
              v2.1 Timeline • {isModelLoaded ? (
                selectedModel ? (
                  <>AI: {selectedModel.split('/')[1]?.split('-')[0] || selectedModel.split('/')[0]}</>
                ) : (
                  <span className="text-red-500">⚠️ Nessun modello configurato</span>
                )
              ) : (
                <>Caricando modello globale...</>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 animate-fade-in">
            {!selectedModel && isModelLoaded && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Nessun modello AI configurato!</strong><br/>
                  Contatta l'amministratore per configurare il modello AI.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Da dove parti?"
                  value={tripData.from}
                  onChange={(e) => setTripData({...tripData, from: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Dove vuoi andare?"
                  value={tripData.to}
                  onChange={(e) => setTripData({...tripData, to: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                />
              </div>
              
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quanto tempo? (es. 5 giorni)"
                  value={tripData.duration}
                  onChange={(e) => setTripData({...tripData, duration: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                />
              </div>
              
              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quante persone?"
                  value={tripData.people}
                  onChange={(e) => setTripData({...tripData, people: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  placeholder="Data inizio viaggio (opzionale)"
                  value={tripData.startDate}
                  onChange={(e) => setTripData({...tripData, startDate: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Se non inserita, useremo "Giorno 1", "Giorno 2"...
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Descrivi il tipo di viaggio che vorresti...
                  </label>
                  <button
                    type="button"
                    onClick={fillSuggestedPrompt}
                    className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full hover:bg-yellow-200 transition-colors"
                  >
                    <Lightbulb className="h-3 w-3" />
                    Usa esempio
                  </button>
                </div>
                <textarea
                  placeholder="Vogliamo visitare i luoghi più iconici della città, provare la cucina locale, e vivere esperienze autentiche..."
                  value={tripData.description}
                  onChange={(e) => setTripData({...tripData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none text-sm bg-white"
                  style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                />
                <p className="text-xs text-gray-500">
                  💡 Più dettagli fornisci, migliore sarà l'itinerario personalizzato
                </p>
              </div>
            </div>
            
            <button
              onClick={generateAIPlan}
              disabled={!tripData.from || !tripData.to || !tripData.duration || !tripData.people || loading || !selectedModel}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Generando il tuo itinerario...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Crea il mio itinerario
                </>
              )}
            </button>
            
            <div className="text-xs text-gray-400 text-center border-t pt-4">
              <p>Modello globale: <strong>{selectedModel || 'Non configurato'}</strong></p>
              {selectedModel && <p className="text-green-600">✅ Sistema v2.1 Timeline configurato dall'amministratore</p>}
              {tripData.startDate && (
                <p className="text-blue-600 mt-1">📅 Data inizio: {new Date(tripData.startDate).toLocaleDateString('it-IT')}</p>
              )}
            </div>
          </div>
        </div>
        
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Generando il tuo itinerario personalizzato v2.1...</p>
              <p className="text-xs text-gray-500 mt-2">Modello: {selectedModel}</p>
              {tripData.startDate && (
                <p className="text-xs text-blue-600 mt-1">📅 Con date reali dal {new Date(tripData.startDate).toLocaleDateString('it-IT')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // SCREEN 2: Editor itinerario con Timeline Layout 
  if (currentScreen === 'editor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <style jsx>{`
          /* Timeline Layout Styles */
          .activity-travel { background: rgba(16, 185, 129, 0.03); border: 2px solid #10b981; }
          .activity-accommodation { background: rgba(139, 92, 246, 0.03); border: 2px solid #8b5cf6; }
          .activity-attraction { background: rgba(59, 130, 246, 0.03); border: 2px solid #3b82f6; }
          .activity-meal { background: rgba(239, 68, 68, 0.03); border: 2px solid #ef4444; }
          .activity-shopping { background: rgba(245, 158, 11, 0.03); border: 2px solid #f59e0b; }
          .activity-activity { background: rgba(20, 184, 166, 0.03); border: 2px solid #14b8a6; }
          .activity-freetime { background: rgba(156, 163, 175, 0.03); border: 2px dashed #9ca3af; }
          
          .travel-section {
            border-left: 3px solid #10b981;
            background: rgba(16, 185, 129, 0.06);
          }
          
          .required-badge {
            background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          }
          
          .info-balloon {
            position: relative;
            background: white;
            border: 2px solid #3b82f6;
            border-radius: 16px;
            padding: 12px 16px;
            font-size: 0.875rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 10;
            min-width: 200px;
            cursor: pointer;
          }
          
          .info-balloon.travel { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
          .info-balloon.accommodation { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.05); }
          .info-balloon.attraction { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
          .info-balloon.meal { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
          .info-balloon.freetime { border-color: #9ca3af; background: rgba(156, 163, 175, 0.05); }
          
          .info-balloon::after {
            content: '';
            position: absolute;
            right: -12px;
            top: 50%;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-left: 12px solid;
            border-left-color: inherit;
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
          }
          
          .info-balloon.travel::after { border-left-color: #10b981; }
          .info-balloon.accommodation::after { border-left-color: #8b5cf6; }
          .info-balloon.attraction::after { border-left-color: #3b82f6; }
          .info-balloon.meal::after { border-left-color: #ef4444; }
          .info-balloon.freetime::after { border-left-color: #9ca3af; }
          
          .timeline-line {
            position: absolute;
            left: 15.5rem;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(to bottom, #e5e7eb, #9ca3af, #e5e7eb);
          }
          
          .timeline-dot {
            position: absolute;
            left: 15rem;
            width: 12px;
            height: 12px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 2px #3b82f6;
            z-index: 10;
            top: 50%;
            transform: translateY(-50%);
          }
          
          .timeline-dot.travel { background: #10b981; box-shadow: 0 0 0 2px #10b981; }
          .timeline-dot.accommodation { background: #8b5cf6; box-shadow: 0 0 0 2px #8b5cf6; }
          .timeline-dot.attraction { background: #3b82f6; box-shadow: 0 0 0 2px #3b82f6; }
          .timeline-dot.meal { background: #ef4444; box-shadow: 0 0 0 2px #ef4444; }
          .timeline-dot.freetime { background: #9ca3af; box-shadow: 0 0 0 2px #9ca3af; }
          
          .connector-line {
            position: absolute;
            left: 16rem;
            height: 2px;
            background: #d1d5db;
            top: 50%;
            transform: translateY(-50%);
            width: 2rem;
          }
          
          .editable {
            background: transparent;
            border: 1px dashed transparent;
            padding: 2px 4px;
            border-radius: 4px;
            min-width: 60px;
            display: inline-block;
          }
          
          .editable:hover {
            background: rgba(59, 130, 246, 0.1);
            border-color: #3b82f6;
          }
          
          .missing-data {
            color: #9ca3af;
            font-style: italic;
            font-size: 0.75rem;
          }
        `}</style>

        <div className="max-w-7xl mx-auto pt-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setCurrentScreen('form')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Nuovo viaggio
            </button>
            <h2 className="text-3xl font-bold text-gray-800">
              {tripData.from} → {tripData.to}
            </h2>
            <div className="flex space-x-2">
              {travelPlan.length > 0 && (
                <>
                  <button
                    onClick={createWebPage}
                    disabled={convertingToViewer}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition-colors flex items-center"
                  >
                    {convertingToViewer ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Convertendo...
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Crea pagina web
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={downloadJSON}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Scarica JSON
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Trip Info */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Dettagli Viaggio</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Da:</span>
                  <p className="font-semibold">{tripData.from}</p>
                </div>
                <div>
                  <span className="text-gray-600">A:</span>
                  <p className="font-semibold">{tripData.to}</p>
                </div>
                <div>
                  <span className="text-gray-600">Durata:</span>
                  <p className="font-semibold">{tripData.duration}</p>
                </div>
                <div>
                  <span className="text-gray-600">Persone:</span>
                  <p className="font-semibold">{tripData.people}</p>
                </div>
              </div>
              {tripData.startDate && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-600">Data inizio:</span>
                  <span className="font-semibold ml-2 text-blue-600">
                    📅 {new Date(tripData.startDate).toLocaleDateString('it-IT', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-3 flex items-center justify-between">
                <span>Generato con: {selectedModel} (modello globale v2.1 Timeline)</span>
                {itineraryMetadata && (
                  <span className="text-green-600">✅ Enhanced format</span>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Layout per ogni giorno */}
          {travelPlan.map((day) => (
            <div key={day.id} className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                  {day.date || formatDateForDay(day.day, tripData.startDate)}
                </h1>
                <button
                  onClick={() => addMovement(day.id)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-5 w-5 mr-1" />
                  Aggiungi Spostamento
                </button>
              </div>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="timeline-line"></div>
                
                {/* Render attività per questo giorno */}
                {day.movements.map((movement) => 
                  movement.activities.map((activity, activityIndex) => {
                    const typeInfo = getActivityTypeInfo(activity.type);
                    
                    return (
                      <div key={activity.id} className="flex items-center mb-8 relative">
                        {/* Info Balloon */}
                        <div className={`info-balloon ${activity.type}`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xl">{typeInfo.icon}</span>
                            <span className="font-semibold" style={{color: typeInfo.color}}>
                              {typeInfo.label}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span>🕐</span>
                              <input
                                type="text"
                                value={activity.time?.split('-')[0] || ''}
                                onChange={(e) => {
                                  const endTime = activity.time?.split('-')[1] || '';
                                  const newTime = endTime ? `${e.target.value}-${endTime}` : e.target.value;
                                  updateActivity(day.id, movement.id, activity.id, 'time', newTime);
                                }}
                                className="editable font-medium bg-transparent border-none p-0 text-sm w-16"
                                placeholder="09:00"
                              />
                              <span>-</span>
                              <input
                                type="text"
                                value={activity.time?.split('-')[1] || ''}
                                onChange={(e) => {
                                  const startTime = activity.time?.split('-')[0] || '';
                                  const newTime = startTime ? `${startTime}-${e.target.value}` : e.target.value;
                                  updateActivity(day.id, movement.id, activity.id, 'time', newTime);
                                }}
                                className="editable font-medium bg-transparent border-none p-0 text-sm w-16"
                                placeholder="11:00"
                              />
                              <span className="text-gray-600 text-xs">{formatDuration(activity.time)}</span>
                            </div>
                            <div className="text-xs space-y-1">
                              {movement.transport && (
                                <div className="flex items-center space-x-1">
                                  <span>🚗</span>
                                  <span className="text-green-700">{movement.transport}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <span>💰</span>
                                <input
                                  type="text"
                                  value={activity.cost || ''}
                                  onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'cost', e.target.value)}
                                  className="editable bg-transparent border-none p-0 text-xs w-20"
                                  placeholder="€20-30"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Timeline dot */}
                        <div className={`timeline-dot ${activity.type}`}></div>
                        
                        {/* Connector line */}
                        <div className="connector-line"></div>
                        
                        {/* Activity Card */}
                        <div className={`activity-${activity.type} rounded-2xl p-6 flex-1 shadow-lg ml-8`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              {activity.required && (
                                <span className="required-badge text-white text-xs px-2 py-1 rounded-full">
                                  ⭐ Richiesto
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={() => removeActivity(day.id, movement.id, activity.id)}
                              className="text-red-500 hover:text-red-700 p-2"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Travel Section se necessario */}
                          {(movement.from || movement.to) && (
                            <div className="travel-section rounded-lg p-4 mb-4">
                              <div className="flex items-center space-x-2 mb-3">
                                <Zap className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Come raggiungerlo</span>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs text-green-600 font-medium">Partenza da</label>
                                  <input 
                                    type="text" 
                                    value={movement.from} 
                                    onChange={(e) => updateMovement(day.id, movement.id, 'from', e.target.value)}
                                    className="w-full bg-white border border-green-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-green-600 font-medium">Arrivo a</label>
                                  <input 
                                    type="text" 
                                    value={movement.to} 
                                    onChange={(e) => updateMovement(day.id, movement.id, 'to', e.target.value)}
                                    className="w-full bg-white border border-green-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-green-600 font-medium">Trasporto</label>
                                  <input 
                                    type="text" 
                                    value={movement.transport || ''} 
                                    onChange={(e) => updateMovement(day.id, movement.id, 'transport', e.target.value)}
                                    className="w-full bg-white border border-green-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-4">
                            <input 
                              type="text" 
                              value={activity.name || ''} 
                              onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'name', e.target.value)}
                              className={`w-full font-semibold text-lg bg-white border rounded-lg px-4 py-2 focus:ring-2`}
                              style={{ borderColor: typeInfo.color, focusRingColor: typeInfo.color }}
                              placeholder="Nome attività"
                            />
                            <textarea 
                              value={activity.description || ''} 
                              onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'description', e.target.value)}
                              className={`w-full bg-white border rounded-lg px-4 py-2 text-sm focus:ring-2 h-16 resize-none`}
                              style={{ borderColor: typeInfo.color, focusRingColor: typeInfo.color }}
                              placeholder="Descrizione"
                            />
                            
                            {activity.alternatives && activity.alternatives.length > 0 && (
                              <div>
                                <label className={`text-xs font-medium`} style={{ color: typeInfo.color }}>Alternative</label>
                                <input 
                                  type="text" 
                                  value={activity.alternatives.join(', ')} 
                                  readOnly
                                  className={`w-full bg-white border rounded-lg px-3 py-2 text-sm`}
                                  style={{ borderColor: typeInfo.color }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Add Activity Button */}
                <div className="flex items-center">
                  <div className="w-64"></div>
                  <button 
                    onClick={() => {
                      if (day.movements.length === 0) {
                        addMovement(day.id);
                      } else {
                        addActivity(day.id, day.movements[day.movements.length - 1].id);
                      }
                    }}
                    className="flex-1 border-2 border-dashed border-gray-400 rounded-xl p-6 text-gray-700 hover:border-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center bg-white hover:bg-gray-50 ml-8"
                  >
                    <Plus className="h-6 w-6 mr-2" />
                    Aggiungi Attività
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Day Button */}
          <button
            onClick={addDay}
            className="w-full border-2 border-dashed border-gray-400 rounded-xl p-6 text-gray-700 hover:border-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center bg-white hover:bg-gray-100 mb-8"
          >
            <Plus className="h-6 w-6 mr-2" />
            Aggiungi {formatDateForDay(travelPlan.length + 1, tripData.startDate)}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default TravelPlanner;