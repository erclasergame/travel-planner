'use client'

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Clock, Users, Download, Sparkles, ArrowLeft, ChevronRight, Lightbulb, Edit3, Trash2, Utensils, Camera, Bed, Coffee, ShoppingBag, Music, MapIcon, Plane, Globe, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { convertTravelPlannerToViewer } from '@/utils/itineraryConverter';
import { saveConvertedItinerary } from '@/utils/storageManager';

const TravelPlanner = () => {
  const router = useRouter();
  
  // ✅ NUOVO: Solo 2 schermate - Form e Editor
  const [currentScreen, setCurrentScreen] = useState('form'); // 'form' o 'editor'
  const [tripData, setTripData] = useState({
    from: '',
    to: '',
    duration: '',
    people: '',
    description: ''
  });
  const [travelPlan, setTravelPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // ✅ NUOVO: Loading per conversione viewer
  const [convertingToViewer, setConvertingToViewer] = useState(false);
  
  // 🔧 REDIS: Modello globale dal server (no localStorage) - FIXED TYPING
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  // Tracking modifiche utente
  const [userHasModified, setUserHasModified] = useState(false);
  const [lastAIVersion, setLastAIVersion] = useState<string | null>(null);

  // 🔥 CARICA MODELLO GLOBALE DAL SERVER (REDIS)
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
        // Fallback al default se API non funziona
        setSelectedModel('google/gemma-2-9b-it:free'); 
      }
      setIsModelLoaded(true);
    };

    loadGlobalModel();
  }, []);

  // Determina icona per attività 
  const getActivityIcon = (description: string) => {
    const desc = description.toLowerCase();
    
    if (desc.includes('pranzo') || desc.includes('cena') || desc.includes('colazione') || desc.includes('ristorante') || desc.includes('trattoria') || desc.includes('osteria') || desc.includes('pizzeria')) {
      return <Utensils className="h-4 w-4 text-orange-600" />;
    }
    if (desc.includes('aperitivo') || desc.includes('bar') || desc.includes('caffè') || desc.includes('spritz') || desc.includes('drink')) {
      return <Coffee className="h-4 w-4 text-amber-600" />;
    }
    if (desc.includes('hotel') || desc.includes('check-in') || desc.includes('alloggio') || desc.includes('dormire') || desc.includes('pernottamento')) {
      return <Bed className="h-4 w-4 text-purple-600" />;
    }
    if (desc.includes('museo') || desc.includes('galleria') || desc.includes('mostra') || desc.includes('visita') || desc.includes('monumento') || desc.includes('basilica') || desc.includes('chiesa') || desc.includes('palazzo') || desc.includes('castello')) {
      return <Camera className="h-4 w-4 text-blue-600" />;
    }
    if (desc.includes('shopping') || desc.includes('mercato') || desc.includes('negozi') || desc.includes('acquisti') || desc.includes('souvenir')) {
      return <ShoppingBag className="h-4 w-4 text-green-600" />;
    }
    if (desc.includes('concerto') || desc.includes('spettacolo') || desc.includes('teatro') || desc.includes('opera') || desc.includes('musica')) {
      return <Music className="h-4 w-4 text-pink-600" />;
    }
    if (desc.includes('passeggiata') || desc.includes('camminata') || desc.includes('esplorazione') || desc.includes('quartiere') || desc.includes('centro') || desc.includes('zona')) {
      return <MapIcon className="h-4 w-4 text-teal-600" />;
    }
    if (desc.includes('trasferimento') || desc.includes('aeroporto') || desc.includes('stazione') || desc.includes('volo') || desc.includes('treno')) {
      return <Plane className="h-4 w-4 text-gray-600" />;
    }
    
    return <Camera className="h-4 w-4 text-blue-600" />;
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
  const saveAISnapshot = (plan: any[]) => {
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

  // ✅ NUOVO: Conversione locale e redirect al viewer
  const createWebPage = async () => {
    if (!travelPlan || travelPlan.length === 0) {
      alert('⚠️ Nessun itinerario da convertire. Genera prima un itinerario.');
      return;
    }

    setConvertingToViewer(true);
    try {
      console.log('🔄 Iniziando conversione locale per viewer...');

      // Prepara dati nel formato Travel Planner
      const originalItinerary = {
        tripInfo: tripData,
        itinerary: travelPlan,
        exportedAt: new Date().toISOString(),
        aiModel: selectedModel,
        convertedFrom: 'travel_planner'
      };

      console.log('🔍 Dati originali preparati:', {
        days: travelPlan.length,
        from: tripData.from,
        to: tripData.to
      });

      // Conversione con utility locale
      const convertedItinerary = convertTravelPlannerToViewer(originalItinerary) as any;

      console.log('✅ Conversione completata:', {
        title: convertedItinerary.metadata.title,
        days: convertedItinerary.days.length,
        totalActivities: convertedItinerary.days.reduce((sum: number, day: any) => sum + day.activities.length, 0)
      });

      // Salva in sessionStorage per il viewer
      const saved = saveConvertedItinerary(convertedItinerary, originalItinerary);
      
      if (!saved) {
        console.warn('⚠️ Impossibile salvare in sessionStorage, procedo comunque');
      }

      console.log('🚀 Reindirizzando a viewer/result...');

      // Redirect alla pagina viewer
      router.push('/viewer/result');

    } catch (error: unknown) {
      console.error('❌ Errore conversione locale:', error);
      const err = error as Error;
      alert(`Errore durante la conversione: ${err.message}`);
    } finally {
      setConvertingToViewer(false);
    }
  };

  // ✅ GENERAZIONE AI con modello globale
  const generateAIPlan = async () => {
    if (!selectedModel) {
      alert('⚠️ Nessun modello AI configurato. Contatta l\'amministratore.');
      return;
    }

    console.log('🚀 Usando modello globale:', selectedModel);
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
          selectedModel: selectedModel
        })
      });

      const responseText = await response.text();
      console.log('📄 Raw API response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError: unknown) {
        const err = parseError as Error;
        throw new Error(`Errore parsing JSON: ${err.message}. Response: ${responseText}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      let aiPlan;
      try {
        aiPlan = JSON.parse(data.content);
      } catch (contentParseError: unknown) {
        const err = contentParseError as Error;
        throw new Error(`Errore parsing contenuto AI: ${err.message}. Content: ${data.content}`);
      }
      
      const formattedPlan = aiPlan.map((day: any, index: number) => ({
        id: Date.now() + index,
        day: day.day || (index + 1),
        movements: (day.movements || []).map((movement: any, mIndex: number) => ({
          id: Date.now() + index * 1000 + mIndex,
          from: movement.from || '',
          to: movement.to || '',
          transport: movement.transport || '',
          activities: (movement.activities || []).map((activity: any, aIndex: number) => ({
            id: Date.now() + index * 1000 + mIndex * 100 + aIndex,
            description: activity.description || '',
            time: activity.time || '',
            cost: activity.cost || '',
            alternatives: activity.alternatives || [],
            notes: activity.notes || ''
          }))
        }))
      }));
      
      setTravelPlan(formattedPlan);
      saveAISnapshot(formattedPlan);
      setCurrentScreen('editor');
    } catch (error: unknown) {
      console.error('❌ Errore nella generazione:', error);
      const err = error as Error;
      alert(`Errore nella generazione del piano: ${err.message}`);
    }
    setLoading(false);
  };

  // Gestione piano di viaggio con tracking modifiche
  const addDay = () => {
    setTravelPlan([...travelPlan, {
      id: Date.now(),
      day: travelPlan.length + 1,
      movements: []
    }]);
    setUserHasModified(true);
  };

  const addMovement = (dayId: number) => {
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

  const addActivity = (dayId: number, movementId: number) => {
    setTravelPlan(travelPlan.map(day => 
      day.id === dayId 
        ? {
            ...day,
            movements: day.movements.map((movement: any) =>
              movement.id === movementId
                ? {
                    ...movement,
                    activities: [...movement.activities, {
                      id: Date.now(),
                      description: '',
                      time: ''
                    }]
                  }
                : movement
            )
          }
        : day
    ));
    setUserHasModified(true);
  };

  const removeActivity = (dayId: number, movementId: number, activityId: number) => {
    setTravelPlan(travelPlan.map(day => 
      day.id === dayId 
        ? {
            ...day,
            movements: day.movements.map((movement: any) =>
              movement.id === movementId
                ? {
                    ...movement,
                    activities: movement.activities.filter((activity: any) => activity.id !== activityId)
                  }
                : movement
            )
          }
        : day
    ));
    setUserHasModified(true);
  };

  const updateMovement = (dayId: number, movementId: number, field: string, value: string) => {
    setTravelPlan(travelPlan.map(day => 
      day.id === dayId 
        ? {
            ...day,
            movements: day.movements.map((movement: any) =>
              movement.id === movementId
                ? { ...movement, [field]: value }
                : movement
            )
          }
        : day
    ));
    setUserHasModified(true);
  };

  const updateActivity = (dayId: number, movementId: number, activityId: number, field: string, value: string) => {
    setTravelPlan(travelPlan.map(day => 
      day.id === dayId 
        ? {
            ...day,
            movements: day.movements.map((movement: any) =>
              movement.id === movementId
                ? {
                    ...movement,
                    activities: movement.activities.map((activity: any) =>
                      activity.id === activityId
                        ? { ...activity, [field]: value }
                        : activity
                    )
                  }
                : movement
            )
          }
        : day
    ));
    setUserHasModified(true);
  };

  // Chiamate API per miglioramenti
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
          selectedModel: selectedModel
        })
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let data = JSON.parse(responseText);
      if (data.error) throw new Error(data.error);

      let processedPlan = JSON.parse(data.content);
      
      const formattedPlan = processedPlan.map((day: any, index: number) => ({
        id: day.id || Date.now() + index,
        day: day.day,
        movements: (day.movements || []).map((movement: any, mIndex: number) => ({
          id: movement.id || Date.now() + index * 1000 + mIndex,
          from: movement.from,
          to: movement.to,
          transport: movement.transport || '',
          activities: (movement.activities || []).map((activity: any, aIndex: number) => ({
            id: activity.id || Date.now() + index * 1000 + mIndex * 100 + aIndex,
            description: activity.description,
            time: activity.time,
            cost: activity.cost || '',
            alternatives: activity.alternatives || [],
            notes: activity.notes || ''
          }))
        }))
      }));
      
      setTravelPlan(formattedPlan);
      saveAISnapshot(formattedPlan);
    } catch (error: unknown) {
      console.error('❌ Errore nell\'elaborazione:', error);
      const err = error as Error;
      alert(`Errore nell'elaborazione del piano: ${err.message}`);
    }
    setLoading(false);
  };

  // Export JSON
  const downloadJSON = () => {
    const dataStr = JSON.stringify({
      tripInfo: tripData,
      itinerary: travelPlan,
      aiModel: selectedModel,
      exportedAt: new Date().toISOString()
    }, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `viaggio-${tripData.from}-${tripData.to}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ✅ SCREEN 1: Form iniziale
  if (currentScreen === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-lg mx-auto pt-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Travel Planner</h1>
            <p className="text-gray-600">Pianifica il tuo viaggio perfetto</p>
            <div className="text-xs text-gray-500 mt-2">
              {isModelLoaded ? (
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
            
            {/* ✅ BOTTONE GENERAZIONE CON MODELLO GLOBALE */}
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
            
            {/* Debug modello */}
            <div className="text-xs text-gray-400 text-center border-t pt-4">
              <p>Modello globale: <strong>{selectedModel || 'Non configurato'}</strong></p>
              {selectedModel && <p className="text-green-600">✅ Sistema configurato dall'amministratore</p>}
            </div>
          </div>
        </div>
        
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Generando il tuo itinerario personalizzato...</p>
              <p className="text-xs text-gray-500 mt-2">Modello: {selectedModel}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ✅ SCREEN 2: Editor itinerario
  if (currentScreen === 'editor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto pt-8">
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
                  {/* ✅ NUOVO: Pulsante Crea Pagina Web */}
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
          
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Info viaggio */}
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
              <div className="text-xs text-gray-500 mt-3">
                Generato con: {selectedModel} (modello globale)
              </div>
            </div>

            <div className="space-y-6">
              {travelPlan.map((day: any) => (
                <div key={day.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        {day.day}
                      </span>
                      Giorno {day.day}
                    </h3>
                    <button
                      onClick={() => addMovement(day.id)}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="h-5 w-5 mr-1" />
                      Spostamento
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {day.movements.map((movement: any, mIndex: number) => (
                      <div key={movement.id} className="border-l-4 border-blue-300 pl-4 bg-white rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <input
                            type="text"
                            placeholder="Da dove"
                            value={movement.from}
                            onChange={(e) => updateMovement(day.id, movement.id, 'from', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                          />
                          <input
                            type="text"
                            placeholder="A dove"
                            value={movement.to}
                            onChange={(e) => updateMovement(day.id, movement.id, 'to', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                          />
                        </div>
                        
                        {movement.transport && (
                          <div className="mb-3">
                            <input
                              type="text"
                              placeholder="Trasporto"
                              value={movement.transport}
                              onChange={(e) => updateMovement(day.id, movement.id, 'transport', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                              style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                            />
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          {movement.activities.map((activity: any) => (
                            <div key={activity.id} className="bg-gray-200 border-2 border-gray-400 rounded-lg p-4 space-y-3 shadow-sm activity-container">
                              <div className="flex gap-3">
                                <input
                                  type="text"
                                  placeholder="Orario (es. 09:00-11:00)"
                                  value={activity.time}
                                  onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'time', e.target.value)}
                                  className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                  style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                                />
                                <div className="flex-1 relative">
                                  <div className="absolute left-3 top-2.5 z-10">
                                    {activity.description && getActivityIcon(activity.description)}
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Descrizione attività"
                                    value={activity.description}
                                    onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'description', e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                    style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                                  />
                                </div>
                                <button
                                  onClick={() => removeActivity(day.id, movement.id, activity.id)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              
                              {activity.cost && (
                                <input
                                  type="text"
                                  placeholder="Costo"
                                  value={activity.cost}
                                  onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'cost', e.target.value)}
                                  className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                  style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                                />
                              )}
                              
                              {activity.notes && (
                                <textarea
                                  placeholder="Note e suggerimenti"
                                  value={activity.notes}
                                  onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'notes', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm h-20 resize-none bg-white"
                                  style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                                />
                              )}
                              
                              {activity.alternatives && activity.alternatives.length > 0 && (
                                <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded border">
                                  <strong>Alternative:</strong> {activity.alternatives.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                          
                          <button
                            onClick={() => addActivity(day.id, movement.id)}
                            className="text-sm text-green-600 hover:text-green-800 flex items-center font-medium"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Aggiungi attività
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <button
                onClick={addDay}
                className="w-full border-2 border-dashed border-gray-400 rounded-xl p-6 text-gray-700 hover:border-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center bg-gray-50 hover:bg-gray-100"
              >
                <Plus className="h-6 w-6 mr-2" />
                Aggiungi Giorno {travelPlan.length + 1}
              </button>
            </div>
            
            {/* ✅ NUOVO: Info pulsante pagina web */}
            {travelPlan.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-purple-800 mb-2">
                        ✨ Trasforma in visualizzazione avanzata
                      </h4>
                      <p className="text-purple-700 text-sm mb-4">
                        Converti il tuo itinerario in una pagina web interattiva con mappa, 
                        statistiche dettagliate, export PDF e possibilità di condivisione.
                      </p>
                      <button
                        onClick={createWebPage}
                        disabled={convertingToViewer}
                        className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition-colors flex items-center"
                      >
                        {convertingToViewer ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Convertendo...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Crea pagina web
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bottone elabora condizionale */}
            <div className="mt-8 pt-8 border-t border-gray-200 text-center space-y-4">
              {travelPlan.length > 0 && userHasModified && (
                <>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4 user-changes-notification">
                    <p className="text-sm text-blue-800 font-medium">
                      📝 Hai apportato delle modifiche al tuo itinerario
                    </p>
                  </div>
                  
                  <button
                    onClick={processPlan}
                    disabled={loading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center mx-auto"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Elaborando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Elabora le modifiche
                      </>
                    )}
                  </button>
                  
                  <p className="text-sm text-gray-600">
                    L'AI completerà e ottimizzerà solo le parti che hai modificato
                  </p>
                  <p className="text-xs text-gray-500">
                    Modello globale: {selectedModel}
                  </p>
                </>
              )}
              
              {travelPlan.length > 0 && !userHasModified && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3">
                    ✅ Itinerario aggiornato. Apporta modifiche per vedere il bottone "Elabora"
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setCurrentScreen('form')}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Nuovo viaggio
                    </button>
                    <button
                      onClick={downloadJSON}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Scarica itinerario
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TravelPlanner;