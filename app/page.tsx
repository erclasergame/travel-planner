'use client'

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Clock, Users, Download, Sparkles, ArrowLeft, ChevronRight, Lightbulb, Edit3, Trash2 } from 'lucide-react';

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

  // Gestione piano di viaggio
  const addDay = () => {
    setTravelPlan([...travelPlan, {
      id: Date.now(),
      day: travelPlan.length + 1,
      movements: []
    }]);
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
  };

  // 🔧 FIX: Chiamate API con modello selezionato
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiPlan = JSON.parse(data.content);
      
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
      setCurrentScreen('manual');
    } catch (error) {
      console.error('Errore nella generazione:', error);
      alert(`Errore nella generazione del piano: ${error.message}`);
    }
    setLoading(false);
  };

  const processPlan = async () => {
    console.log('🚀 Processando con modello:', selectedModel);
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const processedPlan = JSON.parse(data.content);
      
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
      setCurrentScreen('result');
    } catch (error) {
      console.error('Errore nell\'elaborazione:', error);
      alert(`Errore nell'elaborazione del piano: ${error.message}`);
    }
    setLoading(false);
  };

  const enhancePlan = async () => {
    console.log('🚀 Migliorando con modello:', selectedModel);
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
          action: 'enhance',
          selectedModel: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const enhancedPlan = JSON.parse(data.content);
      
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
    } catch (error) {
      console.error('Errore nel miglioramento:', error);
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

  // Screen iniziale - 🚫 RIMOSSO Settings button
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

  // Screen manuale/editabile - 🚫 RIMOSSO Settings button + ✅ AGGIUNTO Export
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
            {/* ✅ NUOVO: Export disponibile già qui */}
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
                            <div key={activity.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                              <div className="flex gap-3">
                                <input
                                  type="text"
                                  placeholder="Orario (es. 09:00-11:00)"
                                  value={activity.time}
                                  onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'time', e.target.value)}
                                  className="w-48 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Descrizione attività"
                                  value={activity.description}
                                  onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'description', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
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
                                  className="w-48 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              )}
                              
                              {activity.notes && (
                                <textarea
                                  placeholder="Note e suggerimenti"
                                  value={activity.notes}
                                  onChange={(e) => updateActivity(day.id, movement.id, activity.id, 'notes', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm h-20 resize-none"
                                />
                              )}
                              
                              {activity.alternatives && activity.alternatives.length > 0 && (
                                <div className="text-sm text-gray-600">
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
            
            <div className="mt-8 pt-8 border-t border-gray-200 text-center space-y-4">
              {travelPlan.length > 0 && (
                <>
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
                        Elabora tu Claude
                      </>
                    )}
                  </button>
                  
                  <p className="text-sm text-gray-600">
                    L'AI completerà e ottimizzerà il tuo itinerario rispettando le tue scelte
                  </p>
                  <p className="text-xs text-gray-500">
                    Modello: {selectedModel}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen risultato finale - 🚫 RIMOSSO Settings button
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
                            <div key={activity.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start gap-4">
                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold min-w-fit">
                                  {activity.time}
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-800 font-medium">{activity.description}</p>
                                  {activity.cost && (
                                    <p className="text-sm text-green-600 mt-1">💰 {activity.cost}</p>
                                  )}
                                  {activity.notes && (
                                    <p className="text-sm text-gray-600 mt-2">💡 {activity.notes}</p>
                                  )}
                                  {activity.alternatives && activity.alternatives.length > 0 && (
                                    <p className="text-sm text-blue-600 mt-2">
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