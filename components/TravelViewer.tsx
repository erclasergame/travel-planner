// Componente integrato per visualizzazione avanzata itinerari
// File: components/TravelViewer.tsx

'use client'

import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Car, Euro, Calendar, Globe, Download, Share2,
  ArrowLeft, Save, ExternalLink, Star, Info, ChevronDown, ChevronUp 
} from 'lucide-react';

// Interfacce TypeScript
interface TripMetadata {
  id: string;
  title: string; 
  description?: string;
  duration: number;
  totalKm: number;
  totalTime: string;
  totalCost: string;
  created: string;
  modified: string;
  isPublic: boolean;
  tags: string[];
}

interface ActivityData {
  id: string;
  type: 'meal' | 'accommodation' | 'attraction' | 'shopping' | 'travel' | 'activity';
  subtype?: string;
  name: string;
  time?: string;
  coords: [number, number];
  address?: string;
  description?: string;
  duration: string;
  cost: string;
  required: boolean;
  alternatives: string[];
  notes: string;
  website?: string;
  specialties?: string[];
  cuisine?: string;
  accommodationType?: string;
  priority?: string;
}

interface DayData {
  dayNumber: number;
  date: string;
  stats: {
    km: number;
    time: string;
    cost: string;
    drivingTime: string;
    stops: number;
  };
  activities: ActivityData[];
}

interface TripData {
  metadata: TripMetadata;
  days: DayData[];
  settings?: {
    mapStyle: string;
    defaultZoom: number;
    showRoute: boolean;
    currency: string;
    language: string;
  };
}

interface TravelViewerProps {
  tripData: TripData;
  onBack?: () => void;
  onSaveAndShare?: (tripData: TripData) => Promise<string>;
  showBackButton?: boolean;
  showShareButton?: boolean;
  className?: string;
}

// Utility per icone e colori attività
const getActivityIcon = (type: string, subtype?: string): string => {
  switch (type) {
    case 'meal':
      if (subtype === 'breakfast') return '🍳';
      if (subtype === 'lunch') return '🍽️';
      if (subtype === 'dinner') return '🍷';
      if (subtype === 'aperitif') return '🥂';
      if (subtype === 'dessert') return '🍨';
      return '🍽️';
    case 'accommodation':
      return '🏨';
    case 'attraction':
      return '🏛️';
    case 'travel':
      return '🚗';
    case 'shopping':
      return '🛍️';
    case 'activity':
      return '🎯';
    default:
      return '📍';
  }
};

const getActivityColor = (type: string): string => {
  switch (type) {
    case 'meal': return '#FF6B6B';
    case 'accommodation': return '#4ECDC4';
    case 'attraction': return '#45B7D1';
    case 'travel': return '#96CEB4';
    case 'shopping': return '#FFEAA7';
    case 'activity': return '#DDA0DD';
    default: return '#95A5A6';
  }
};

// Componente Mappa Mock (sostituibile con Leaflet reale)
const MapComponent: React.FC<{
  activities: ActivityData[];
  selectedDay: number;
  className?: string;
}> = ({ activities, selectedDay, className = '' }) => {
  const activitiesWithCoords = activities
    .filter(activity => activity.coords && activity.type !== 'travel')
    .map((activity, index) => ({
      ...activity,
      position: { 
        x: 50 + (index * 60) % 300, 
        y: 100 + (index * 40) % 200 
      }
    }));

  return (
    <div className={`relative w-full h-full bg-green-50 rounded-lg overflow-hidden ${className}`}>
      {/* Background mappa mock */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100"></div>
      
      {/* Elementi geografici mock */}
      <div className="absolute top-10 left-10 w-20 h-16 bg-green-200 rounded-full opacity-60"></div>
      <div className="absolute top-32 right-20 w-16 h-12 bg-blue-200 rounded-lg opacity-60"></div>
      <div className="absolute bottom-20 left-32 w-24 h-18 bg-green-300 rounded-xl opacity-50"></div>
      
      {/* Markers attività */}
      {activitiesWithCoords.map((activity, index) => (
        <div
          key={activity.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          style={{ 
            left: `${activity.position.x}px`, 
            top: `${activity.position.y}px`,
            zIndex: 10
          }}
        >
          <div 
            className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold hover:scale-110 transition-transform"
            style={{ backgroundColor: getActivityColor(activity.type) }}
          >
            {index + 1}
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
            {activity.name}
          </div>
        </div>
      ))}
      
      {/* Linea percorso mock */}
      {activitiesWithCoords.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline
            points={activitiesWithCoords.map(a => `${a.position.x},${a.position.y}`).join(' ')}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.7"
          />
        </svg>
      )}
      
      {/* Attribuzione mappa */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
        © OpenStreetMap
      </div>
    </div>
  );
};

// Componente Card Attività
const ActivityCard: React.FC<{
  activity: ActivityData;
  index: number;
}> = ({ activity, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-3 mb-2 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex flex-col items-center">
            <div 
              className="w-6 h-6 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: getActivityColor(activity.type) }}
            >
              {index + 1}
            </div>
            <div className="text-lg mt-1" style={{ color: getActivityColor(activity.type) }}>
              {getActivityIcon(activity.type, activity.subtype)}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900">{activity.name}</h4>
              {activity.required && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded">
                  Obbligatorio
                </span>
              )}
              {activity.priority === 'high' && (
                <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
              {activity.time && (
                <span className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>{activity.time}</span>
                </span>
              )}
              
              {activity.duration && (
                <span>⏱️ {activity.duration}</span>
              )}
              
              {activity.cost && activity.cost !== '0€' && (
                <span className="flex items-center space-x-1">
                  <Euro size={12} />
                  <span>{activity.cost}</span>
                </span>
              )}
            </div>
            
            {activity.description && (
              <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
            )}
            
            {activity.address && (
              <p className="text-xs text-gray-500 mb-1 flex items-center space-x-1">
                <MapPin size={10} />
                <span>{activity.address}</span>
              </p>
            )}
            
            {activity.website && (
              <a 
                href={activity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 mb-1 flex items-center space-x-1"
              >
                <Globe size={10} />
                <span>Sito web</span>
                <ExternalLink size={8} />
              </a>
            )}
            
            {/* Sezione espandibile */}
            {(activity.specialties?.length || activity.alternatives?.length || activity.notes) && (
              <div className="mt-2">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                >
                  <Info size={10} />
                  <span>Dettagli</span>
                  {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
                
                {expanded && (
                  <div className="mt-2 space-y-2">
                    {activity.specialties && activity.specialties.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Specialità: </span>
                        <span className="text-xs text-gray-700">
                          {activity.specialties.join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {activity.alternatives && activity.alternatives.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Alternative: </span>
                        <span className="text-xs text-gray-700">
                          {activity.alternatives.join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {activity.notes && (
                      <p className="text-xs text-gray-500 italic">{activity.notes}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principale TravelViewer
const TravelViewer: React.FC<TravelViewerProps> = ({
  tripData,
  onBack,
  onSaveAndShare,
  showBackButton = true,
  showShareButton = true,
  className = ''
}) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  
  const currentDay = tripData.days.find(day => day.dayNumber === selectedDay);
  const activitiesWithCoords = currentDay?.activities.filter(activity => activity.coords) || [];

  // Export PDF (mock - da implementare con jsPDF)
  const exportToPDF = async () => {
    try {
      setLoading(true);
      
      // Mock export - qui andrebbe jsPDF
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Crea mock PDF
      const element = document.createElement('a');
      element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(
        `ITINERARIO: ${tripData.metadata.title}\n\n` +
        JSON.stringify(tripData, null, 2)
      );
      element.download = `${tripData.metadata.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
      element.click();
      
    } catch (error) {
      console.error('Errore export PDF:', error);
      alert('Errore durante l\'export del PDF');
    } finally {
      setLoading(false);
    }
  };

  // Salva e condividi
  const handleSaveAndShare = async () => {
    if (!onSaveAndShare) return;
    
    try {
      setLoading(true);
      const url = await onSaveAndShare(tripData);
      setShareUrl(url);
      
      // Copia URL negli appunti
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('Link copiato negli appunti!');
      }
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBackButton && onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Indietro
                </button>
              )}
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {tripData.metadata.title}
                </h1>
                {tripData.metadata.description && (
                  <p className="text-gray-600 mt-1">{tripData.metadata.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>{tripData.metadata.duration} giorni</span>
              </span>
              <span className="flex items-center space-x-1">
                <Car size={16} />
                <span>{tripData.metadata.totalKm}km</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock size={16} />
                <span>{tripData.metadata.totalTime}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Euro size={16} />
                <span>{tripData.metadata.totalCost}</span>
              </span>
            </div>
          </div>
          
          {/* Tags */}
          {tripData.metadata.tags && tripData.metadata.tags.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex space-x-2">
                {tripData.metadata.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
              
              {/* Action buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={exportToPDF}
                  disabled={loading}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm"
                >
                  <Download size={14} />
                  <span>{loading ? 'Generando...' : 'Scarica PDF'}</span>
                </button>
                
                {showShareButton && onSaveAndShare && (
                  <button
                    onClick={handleSaveAndShare}
                    disabled={loading}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
                  >
                    {shareUrl ? <Share2 size={14} /> : <Save size={14} />}
                    <span>
                      {loading ? 'Salvando...' : shareUrl ? 'Condividi' : 'Salva e Condividi'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-200px)]">
          
          {/* Sidebar */}
          <div className="lg:col-span-2 flex flex-col">
            
            {/* Tab giorni */}
            <div className="bg-white rounded-lg shadow-sm mb-4 p-1">
              <div className="flex space-x-1 overflow-x-auto">
                {tripData.days.map(day => (
                  <button
                    key={day.dayNumber}
                    onClick={() => setSelectedDay(day.dayNumber)}
                    className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded transition-colors ${
                      selectedDay === day.dayNumber
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Giorno {day.dayNumber}
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(day.date).toLocaleDateString('it-IT', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Statistiche giorno */}
            {currentDay && (
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Statistiche Giorno {currentDay.dayNumber}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Distanza:</span>
                    <span className="ml-2 font-medium">{currentDay.stats.km}km</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tempo totale:</span>
                    <span className="ml-2 font-medium">{currentDay.stats.time}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Guida:</span>
                    <span className="ml-2 font-medium">{currentDay.stats.drivingTime}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Costo:</span>
                    <span className="ml-2 font-medium">{currentDay.stats.cost}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lista attività */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex-1 overflow-y-auto">
              <h3 className="font-medium text-gray-900 mb-3">Programma</h3>
              
              {currentDay && currentDay.activities.map((activity, index) => (
                <ActivityCard 
                  key={activity.id} 
                  activity={activity} 
                  index={index}
                />
              ))}
              
              {(!currentDay || currentDay.activities.length === 0) && (
                <div className="text-center text-gray-500 py-8">
                  <p>Nessuna attività programmata per questo giorno</p>
                </div>
              )}
            </div>
          </div>

          {/* Mappa */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4 h-full">
              <h3 className="font-medium text-gray-900 mb-3">
                Mappa Interattiva - Giorno {selectedDay}
              </h3>
              <MapComponent 
                activities={activitiesWithCoords} 
                selectedDay={selectedDay}
                className="h-[calc(100%-3rem)]"
              />
            </div>
          </div>
          
        </div>
      </div>
      
      {/* URL condiviso */}
      {shareUrl && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <p className="text-sm font-medium mb-2">Link condiviso creato!</p>
          <p className="text-xs break-all">{shareUrl}</p>
        </div>
      )}
    </div>
  );
};

export default TravelViewer;