'use client'

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Clock, Users, Download, Sparkles, ArrowLeft, ChevronRight, Lightbulb, Edit3, Trash2, Utensils, Camera, Bed, Coffee, ShoppingBag, Music, MapIcon, Plane } from 'lucide-react';

const TravelPlanner = () => {
  const [currentScreen, setCurrentScreen] = useState('initial');
  const [tripData, setTripData] = useState({
    from: '',
    to: '',
    duration: '',
    people: '',
    description: ''
  });
  const [travelPlan, setTravelPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 🔧 FIX: Gestione corretta localStorage
  const [selectedModel, setSelectedModel] = useState('google/gemma-2-9b-it:free');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  // ✅ NUOVO: Tracking modifiche utente
  const [userHasModified, setUserHasModified] = useState(false);
  const [lastAIVersion, setLastAIVersion] = useState(null);

  // 🔧 FIX: Carica modello selezionato PRIMA di tutto
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('travel-planner-ai-model');
      if (saved && saved !== selectedModel) {
        setSelectedModel(saved);
        console.log('🔄 Modello caricato da localStorage:', saved);
      }
      setIsModelLoaded(true);
    }
  }, []);

  // 🔧 FIX: Salva modello quando cambia
  useEffect(() => {
    if (isModelLoaded && typeof window !== 'undefined') {
      localStorage.setItem('travel-planner-ai-model', selectedModel);
      console.log('💾 Modello salvato:', selectedModel);
    }
  }, [selectedModel, isModelLoaded]);

  // ✅ NUOVO: Determina icona per attività
  const getActivityIcon = (description) => {
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
    
    // Default per attività generiche
    return <Camera className="h-4 w-4 text-blue-600" />;
  };

  // ✅ NUOVO: Prompt migliorato per evitare troppi pasti
  const getImprovedPrompt = (action, data) => {
    const basePrompt = action === 'process' ? 
      `Elabora questo piano manuale aggiungendo dettagli specifici, orari realistici e riempiendo spazi vuoti:
${JSON.stringify(data.travelPlan)}

Contesto: ${data.tripData.from} → ${data.tripData.to}, ${data.tripData.duration}, ${data.tripData.people} persone.

IMPORTANTE:
- Mantieni SEMPRE le scelte dell'utente
- Aggiungi solo quello che manca 
- Massimo 1 pasto principale per giorno (pranzo O cena, non entrambi)
- Focalizzati su ESPERIENZE e LUOGHI piuttosto che cibo
- Includi orari realistici e costi approssimativi
- Aggiungi trasporti solo se necessari

Rispondi SOLO con JSON completo nello stesso formato.` :

      `Arricchisci questo itinerario con dettagli specifici, ristoranti reali, costi stimati:
${JSON.stringify(data.travelPlan)}

Contesto viaggio: ${data.tripData.from} → ${data.tripData.to}, ${data.tripData.duration}, ${data.tripData.people} persone.

IMPORTANTE:
- Mantieni la struttura esistente
- Migliora solo descrizioni, orari e dettagli pratici  
- Massimo 1 pausa food per giorno
- Focus su CULTURA e ESPERIENZE
- Aggiungi costi realistici
- Includi alternative utili

Rispondi SOLO con JSON nello stesso formato ma molto più dettagliato.`;

    return basePrompt;
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

  // ✅ NUOVO: Salva snapshot per tracciare modifiche
  const saveAISnapshot = (plan) => {
    setLastAIVersion(JSON.stringify(plan));
    setUserHasModified(false);
  };

  // ✅ NUOVO: Verifica se utente ha modificato
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

  // Gestione piano di viaggio con tracking modifiche
  const addDay = () => {
    setTravelPlan([...travelPlan, {
      id: Date.now(),
      day: travelPlan.length + 1,
      movements: []
    }]);
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
            movements: day.movements.map(movement =>
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

  const removeActivity = (dayId, movementId, activityId) => {
    setTravelPlan(travelPlan.map(day => 
      day.id === dayId 
        ? {
            ...day,
            movements: day.movements.map(movement =>
              movement.id === movementId
                ? {
                    ...movement,
                    activities: movement.activities.filter(activity => activity.id !== activityId)
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
            movements: day.movements.map(movement =>
              movement.id === movementId
                ? { ...movement, [field]: value }
                : movement
            )
          }
        : day
    ));
    setUserHasModified(true);
  };

  const updateActivity = (dayId, movementId, activityId, field, value) => {
    setTravelPlan(travelPlan.map(day => 
      day.id === dayId 
        ? {
            ...day,
            movements: day.movements.map(movement =>
              movement.id === movementId
                ? {
                    ...movement,
                    activities: movement.activities.map(activity =>
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

  // 🔧 FIX: Chiamate API con gestione errori migliorata
  const generateAIPlan = async () => {
    console.log('🚀 Usando modello:', selectedModel);
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
      } catch (parseError) {
        throw new Error(`Errore parsing JSON: ${parseError.message}. Response: ${responseText}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      let aiPlan;
      try {
        aiPlan = JSON.parse(data.content);
      } catch (contentParseError) {
        throw new Error(`Errore parsing contenuto AI: ${contentParseError.message}. Content: ${data.content}`);
      }
      
      const formattedPlan = aiPlan.map((day, index) => ({
        id: Date.now() + index,
        day: day.day || (index + 1),
        movements: (day.movements || []).map((movement, mIndex) => ({
          id: Date.now() + index * 1000 + mIndex,
          from: movement.from || '',
          to: movement.to || '',
          transport: movement.transport || '',
          activities: (movement.activities || []).map((activity, aIndex) => ({
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
      setCurrentScreen('manual');
    } catch (error) {
      console.error('❌ Errore nella generazione:', error);
      alert(`Errore nella generazione del piano: ${error.message}`);
    }
    setLoading(false);
  };

  const processPlan = async () => {
    console.log('🚀 Processando con modello:', selectedModel);
    setLoading(true);
    try {
      const prompt = getImprovedPrompt('process', { tripData, travelPlan });
      
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
          customPrompt: prompt
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
      } catch (parseError) {
        throw new Error(`Errore parsing JSON: ${parseError.message}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      let processedPlan;
      try {
        processedPlan = JSON.parse(data.content);
      } catch (contentParseError) {
        throw new Error(`Errore parsing contenuto AI: ${contentParseError.message}`);
      }
      
      const formattedPlan = processedPlan.map((day, index) => ({
        id: day.id || Date.now() + index,
        day: day.day,
        movements: (day.movements || []).map((movement, mIndex) => ({
          id: movement.id || Date.now() + index * 1000 + mIndex,
          from: movement.from,
          to: movement.to,
          transport: movement.transport || '',
          activities: (movement.activities || []).map((activity, aIndex) => ({
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
      setCurrentScreen('result');
    } catch (error) {
      console.error('❌ Errore nell\'elaborazione:', error);
      alert(`Errore nell'elaborazione del piano: ${error.message}`);
    }
    setLoading(false);
  };

  const enhancePlan = async () => {
    console.log('🚀 Migliorando con modello:', selectedModel);
    setLoading(true);
    try {
      const prompt = getImprovedPrompt('enhance', { tripData, travelPlan });
      
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripData,
          travelPlan,
          action: 'enhance',
          selectedModel: selectedModel,
          customPrompt: prompt
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
      } catch (parseError) {
        throw new Error(`Errore parsing JSON: ${parseError.message}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      let enhancedPlan;
      try {
        enhancedPlan = JSON.parse(data.content);
      } catch (contentParseError) {
        throw new Error(`Errore parsing contenuto AI: ${contentParseError.message}`);
      }
      
      const formattedPlan = enhancedPlan.map((day, index) => ({
        id: day.id || Date.now() + index,
        day: day.day,
        movements: (day.movements || []).map((movement, mIndex) => ({
          id: movement.id || Date.now() + index * 1000 + mIndex,
          from: movement.from,
          to: movement.to,
          transport: movement.transport || '',
          activities: (movement.activities || []).map((activity, aIndex) => ({
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
    } catch (error) {
      console.error('❌ Errore nel miglioramento:', error);
      alert(`Errore nel miglioramento del piano: ${error.message}`);
    }
    setLoading(false);
  };

  // 📥 Export JSON function
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

  // Screen iniziale
  if (currentScreen === 'initial') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-lg mx-auto pt-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Travel Planner</h1>
            <p className="text-gray-600">Pianifica il tuo viaggio perfetto</p>
            <div className="text-xs text-gray-500 mt-2">
              {isModelLoaded ? (
                <>AI: {selectedModel.split('/')[1]?.split('-')[0] || selectedModel.split('/')[0]}</>
              ) : (
                <>Caricando modello...</>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 animate-fade-in">
            <div className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Da dove parti?"
                  value={tripData.from}
                  onChange={(e) => setTripData({...tripData, from: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Dove vuoi andare?"
                  value={tripData.to}
                  onChange={(e) => setTripData({...tripData, to: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quanto tempo? (es. 5 giorni)"
                  value={tripData.duration}
                  onChange={(e) => setTripData({...tripData, duration: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quante persone?"
                  value={tripData.people}
                  onChange={(e) => setTripData({...tripData, people: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none text-sm"
                />
                <p className="text-xs text-gray-500">
                  💡 Più dettagli fornisci, migliore sarà l'itinerario personalizzato
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setCurrentScreen('choice')}
              disabled={!tripData.from || !tripData.to || !tripData.duration || !tripData.people}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continua
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Screen scelta metodo
  if (currentScreen === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-16">
          <button
            onClick={() => setCurrentScreen('initial')}
            className="flex items-center text-gray-600 mb-8 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Torna indietro
          </button>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Come vuoi procedere?</h2>
            <p className="text-gray-600">Scegli il metodo che preferisci</p>
            <div className="text-xs text-gray-500 mt-2">
              Usando: {selectedModel}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div 
              onClick={generateAIPlan}
              className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer hover:shadow-2xl transition-shadow group"
            >
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Fai tu</h3>
                <p className="text-gray-600">Lascia che l'AI crei l'itinerario con luoghi reali e dettagli pratici, poi modificalo come vuoi</p>
              </div>
            </div>
            
            <div 
              onClick={() => setCurrentScreen('manual')}
              className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer hover:shadow-2xl transition-shadow group"
            >
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <Plus className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Manuale</h3>
                <p className="text-gray-600">Costruisci il tuo itinerario da zero, passo dopo passo</p>
              </div>
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

  // Screen manuale/editabile - ✅ MIGLIORATO: Bottone condizionale + Icone + Styling
  if (currentScreen === 'manual') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setCurrentScreen('choice')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Torna indietro
            </button>
            <h2 className="text-3xl font-bold text-gray-800">
              {travelPlan.length > 0 ? 'Modifica il tuo itinerario' : 'Costruisci il tuo itinerario'}
            </h2>
            {travelPlan.length > 0 && (
              <button
                onClick={downloadJSON}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Scarica JSON
              </button>
            )}
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-6">
              {travelPlan.map((day) => (
                <div key={day.id} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Giorno {day.day}</h3>
                    <button
                      onClick={() => addMovement(day.id)}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="h-5 w-5 mr-1" />
                      Spostamento
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {day.movements.map((movement, mIndex) => (
                      <div key={movement.id} className="border-l-4 border-blue-300 pl-4">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <input
                            type="text"
                            placeholder="Da dove"
                            value={movement.from}
                            onChange={(e) => updateMovement(day.id, movement.id, 'from', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="A dove"
                            value={movement.to}
                            onChange={(e) => updateMovement(day.id, movement.id, 'to', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        {movement.transport && (
                          <div className="mb-3">
                            <input
                              type="text"
                              placeholder="Trasporto"
                              value={movement.transport}
                              onChange={(e) => updateMovement(day.id, movement.id, 'transport', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          {movement.activities.map((activity) => (
                            <div key={activity.id} className="bg-gray-100 border border-gray-300 rounded-lg p-4 space-y-3 shadow-sm">
                              <div className="flex gap-3">
                                <input
                                  type="text"
                                  placeholder="Orario (es. 09:00-11:00)"
                                  value={activity.time}
                                  onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'time', e.target.value)}
                                  className="w-48 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                                <div className="flex-1 relative">
                                  <div className="absolute left-3 top-2.5">
                                    {activity.description && getActivityIcon(activity.description)}
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Descrizione attività"
                                    value={activity.description}
                                    onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'description', e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                                  className="w-48 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                />
                              )}
                              
                              {activity.notes && (
                                <textarea
                                  placeholder="Note e suggerimenti"
                                  value={activity.notes}
                                  onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'notes', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm h-20 resize-none bg-white"
                                />
                              )}
                              
                              {activity.alternatives && activity.alternatives.length > 0 && (
                                <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                                  <strong>Alternative:</strong> {activity.alternatives.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                          
                          <button
                            onClick={() => addActivity(day.id, movement.id)}
                            className="text-sm text-green-600 hover:text-green-800 flex items-center"
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
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors flex items-center justify-center"
              >
                <Plus className="h-6 w-6 mr-2" />
                Aggiungi Giorno {travelPlan.length + 1}
              </button>
            </div>
            
            {/* ✅ NUOVO: Bottone elabora condizionale */}
            <div className="mt-8 pt-8 border-t border-gray-200 text-center space-y-4">
              {travelPlan.length > 0 && userHasModified && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      🔄 Hai apportato delle modifiche al tuo itinerario
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
                    Modello: {selectedModel}
                  </p>
                </>
              )}
              
              {travelPlan.length > 0 && !userHasModified && (
                <p className="text-sm text-gray-500">
                  ✅ Itinerario aggiornato. Apporta modifiche per vedere il bottone "Elabora"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen risultato finale - ✅ MIGLIORATO: Icone + Styling
  if (currentScreen === 'result') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setCurrentScreen('choice')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Nuovo progetto
            </button>
            <h2 className="text-3xl font-bold text-gray-800">Il tuo itinerario finale</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentScreen('manual')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Modifica
              </button>
              <button
                onClick={enhancePlan}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center"
              >
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Completami
              </button>
              <button
                onClick={downloadJSON}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Scarica JSON
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8">
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
                Generato con: {selectedModel}
              </div>
            </div>
            
            <div className="space-y-8">
              {travelPlan.map((day) => (
                <div key={day.id} className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      {day.day}
                    </span>
                    Giorno {day.day}
                  </h3>
                  
                  <div className="space-y-6">
                    {day.movements.map((movement, mIndex) => (
                      <div key={movement.id} className="border-l-4 border-blue-300 pl-6">
                        <div className="flex items-center text-gray-700 mb-4">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="font-semibold">{movement.from}</span>
                          <ChevronRight className="h-4 w-4 mx-2" />
                          <span className="font-semibold">{movement.to}</span>
                          {movement.transport && (
                            <span className="ml-2 text-sm text-gray-500">({movement.transport})</span>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {movement.activities.map((activity) => (
                            <div key={activity.id} className="bg-gray-100 border border-gray-300 rounded-lg p-4 shadow-sm">
                              <div className="flex items-start gap-4">
                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold min-w-fit">
                                  {activity.time}
                                </div>
                                <div className="flex items-center mr-2">
                                  {getActivityIcon(activity.description)}
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-800 font-medium">{activity.description}</p>
                                  {activity.cost && (
                                    <p className="text-sm text-green-600 mt-1">💰 {activity.cost}</p>
                                  )}
                                  {activity.notes && (
                                    <p className="text-sm text-gray-600 mt-2 bg-blue-50 p-2 rounded">💡 {activity.notes}</p>
                                  )}
                                  {activity.alternatives && activity.alternatives.length > 0 && (
                                    <p className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                                      🔄 Alternative: {activity.alternatives.join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TravelPlanner;