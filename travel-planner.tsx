import React, { useState } from 'react';
import { Plus, MapPin, Clock, Users, Download, Sparkles, ArrowLeft, ChevronRight } from 'lucide-react';

const TravelPlanner = () => {
  const [currentScreen, setCurrentScreen] = useState('initial'); // initial, choice, manual, result
  const [tripData, setTripData] = useState({
    from: '',
    to: '',
    duration: '',
    people: '',
    description: ''
  });
  const [travelPlan, setTravelPlan] = useState([]);
  const [loading, setLoading] = useState(false);

  // Struttura per il piano di viaggio
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

  const generateAIPlan = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          messages: [
            {
              role: "user",
              content: `Crea un itinerario di viaggio completo e dettagliato per:
- Partenza: ${tripData.from}
- Destinazione: ${tripData.to}
- Durata: ${tripData.duration}
- Numero persone: ${tripData.people}
- Tipo di viaggio: ${tripData.description}

IMPORTANTE: Rispondi ESCLUSIVAMENTE con un JSON valido in questo formato esatto:
[
  {
    "day": 1,
    "movements": [
      {
        "from": "città/luogo di partenza",
        "to": "città/luogo di arrivo",
        "activities": [
          {
            "description": "Descrizione dettagliata dell'attività",
            "time": "09:00-11:00"
          },
          {
            "description": "Pranzo al ristorante X",
            "time": "12:30-14:00"
          }
        ]
      }
    ]
  }
]

Crea un piano completo con:
- Orari precisi per ogni attività (formato HH:MM-HH:MM)
- Pranzi e cene inclusi
- Attività turistiche specifiche
- Spostamenti logici
- Almeno 5-7 attività per giorno

NON aggiungere testo prima o dopo il JSON. SOLO il JSON.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;
      
      // Pulizia più aggressiva del testo
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      responseText = responseText.replace(/^[^[{]*/, "").replace(/[^}\]]*$/, "");
      
      console.log("Response text dopo pulizia:", responseText);
      
      const aiPlan = JSON.parse(responseText);
      
      // Validazione della struttura
      if (!Array.isArray(aiPlan)) {
        throw new Error("La risposta non è un array valido");
      }
      
      const formattedPlan = aiPlan.map((day, index) => ({
        id: Date.now() + index,
        day: day.day || (index + 1),
        movements: (day.movements || []).map((movement, mIndex) => ({
          id: Date.now() + index * 1000 + mIndex,
          from: movement.from || "",
          to: movement.to || "",
          activities: (movement.activities || []).map((activity, aIndex) => ({
            id: Date.now() + index * 1000 + mIndex * 100 + aIndex,
            description: activity.description || "",
            time: activity.time || ""
          }))
        }))
      }));
      
      setTravelPlan(formattedPlan);
      setCurrentScreen('result');
    } catch (error) {
      console.error('Errore dettagliato nella generazione:', error);
      alert(`Errore nella generazione del piano: ${error.message}. Riprova o usa la modalità manuale.`);
    }
    setLoading(false);
  };

  const enhancePlan = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          messages: [
            {
              role: "user",
              content: `Arricchisci questo itinerario di viaggio aggiungendo dettagli mancanti come orari, ristoranti specifici, costi stimati, tempi di percorrenza e riempiendo spazi vuoti con attività o tempo libero:

${JSON.stringify(travelPlan, null, 2)}

Località: da ${tripData.from} a ${tripData.to}
Durata: ${tripData.duration}
Persone: ${tripData.people}

Rispondi SOLO con il JSON aggiornato nello stesso formato, ma molto più dettagliato.`
            }
          ]
        })
      });

      const data = await response.json();
      let responseText = data.content[0].text;
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const enhancedPlan = JSON.parse(responseText);
      const formattedPlan = enhancedPlan.map((day, index) => ({
        id: day.id || Date.now() + index,
        day: day.day,
        movements: day.movements.map((movement, mIndex) => ({
          id: movement.id || Date.now() + index * 1000 + mIndex,
          from: movement.from,
          to: movement.to,
          activities: movement.activities.map((activity, aIndex) => ({
            id: activity.id || Date.now() + index * 1000 + mIndex * 100 + aIndex,
            description: activity.description,
            time: activity.time
          }))
        }))
      }));
      
      setTravelPlan(formattedPlan);
    } catch (error) {
      console.error('Errore nel miglioramento:', error);
      alert('Errore nel miglioramento del piano. Riprova.');
    }
    setLoading(false);
  };

  const processPlan = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          messages: [
            {
              role: "user",
              content: `Elabora e arricchisci questo piano di viaggio manuale aggiungendo orari dettagliati, pasti (pranzo/cena) se mancanti, e riempiendo spazi vuoti con proposte di attività o "tempo libero":

${JSON.stringify(travelPlan, null, 2)}

Contesto viaggio: da ${tripData.from} a ${tripData.to}, ${tripData.duration}, ${tripData.people} persone.

Rispondi SOLO con il JSON elaborato nello stesso formato, ma molto più completo e logico.`
            }
          ]
        })
      });

      const data = await response.json();
      let responseText = data.content[0].text;
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const processedPlan = JSON.parse(responseText);
      const formattedPlan = processedPlan.map((day, index) => ({
        id: day.id || Date.now() + index,
        day: day.day,
        movements: day.movements.map((movement, mIndex) => ({
          id: movement.id || Date.now() + index * 1000 + mIndex,
          from: movement.from,
          to: movement.to,
          activities: movement.activities.map((activity, aIndex) => ({
            id: activity.id || Date.now() + index * 1000 + mIndex * 100 + aIndex,
            description: activity.description,
            time: activity.time
          }))
        }))
      }));
      
      setTravelPlan(formattedPlan);
      setCurrentScreen('result');
    } catch (error) {
      console.error('Errore nell\'elaborazione:', error);
      alert('Errore nell\'elaborazione del piano. Riprova.');
    }
    setLoading(false);
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify({
      tripInfo: tripData,
      itinerary: travelPlan
    }, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `viaggio-${tripData.from}-${tripData.to}.json`;
    link.click();
  };

  // Screen iniziale
  if (currentScreen === 'initial') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-lg mx-auto pt-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Travel Planner</h1>
            <p className="text-gray-600">Pianifica il tuo viaggio perfetto</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
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
              
              <textarea
                placeholder="Descrivi il tipo di viaggio che vorresti... (relax, avventura, cultura, etc.)"
                value={tripData.description}
                onChange={(e) => setTripData({...tripData, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
              />
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
                <p className="text-gray-600">Lascia che Claude crei l'itinerario perfetto per te automaticamente</p>
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
                <p className="text-gray-600">Costruisci il tuo itinerario passo dopo passo con il tuo controllo</p>
              </div>
            </div>
          </div>
        </div>
        
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Generando il tuo itinerario...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Screen manuale
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
            <h2 className="text-3xl font-bold text-gray-800">Costruisci il tuo itinerario</h2>
            <div></div>
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
                        
                        <div className="space-y-2">
                          {movement.activities.map((activity) => (
                            <div key={activity.id} className="flex gap-3">
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
            
            {travelPlan.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 text-center">
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
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Screen risultato
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
            <h2 className="text-3xl font-bold text-gray-800">Il tuo itinerario</h2>
            <div className="flex gap-3">
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
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
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
                        </div>
                        
                        <div className="space-y-3">
                          {movement.activities.map((activity) => (
                            <div key={activity.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start gap-4">
                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold min-w-fit">
                                  {activity.time}
                                </div>
                                <p className="text-gray-800 flex-1">{activity.description}</p>
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