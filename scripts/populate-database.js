// Script per popolare il database Xata con dati iniziali
// Uso: node scripts/populate-database.js

require('dotenv').config({ path: '.env.local' });

const XATA_API_KEY = process.env.XATA_API_KEY;
const XATA_DB_URL = process.env.XATA_DATABASE_URL || 'https://testdaniele77-1-s-workspace-j00f29.eu-central-1.xata.sh/db/travel_planner:main';

if (!XATA_API_KEY) {
  console.error('❌ XATA_API_KEY not found in environment variables');
  process.exit(1);
}

// Helper per chiamare API Xata
async function xataCall(table, method = 'POST', data = null) {
  const url = `${XATA_DB_URL}/tables/${table}/${method === 'POST' ? 'data' : 'query'}`;
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${XATA_API_KEY}`,
      'Content-Type': 'application/json',
    }
  };
  
  if (data && method === 'POST') {
    options.body = JSON.stringify(data);
  } else if (method === 'GET') {
    options.method = 'POST';
    options.body = JSON.stringify({ page: { size: 100 } });
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Xata API error (${response.status}): ${error}`);
  }
  
  return await response.json();
}

// Dati da inserire
const seedData = {
  continents: [
    { name: 'Europe', code: 'EU' },
    { name: 'Asia', code: 'AS' },
    { name: 'Africa', code: 'AF' },
    { name: 'North America', code: 'NA' },
    { name: 'South America', code: 'SA' },
    { name: 'Oceania', code: 'OC' }
  ],
  
  countries: [
    { name: 'Italy', code: 'IT', continent_code: 'EU', flag_url: 'https://flagcdn.com/w320/it.png' },
    { name: 'France', code: 'FR', continent_code: 'EU', flag_url: 'https://flagcdn.com/w320/fr.png' },
    { name: 'Spain', code: 'ES', continent_code: 'EU', flag_url: 'https://flagcdn.com/w320/es.png' },
    { name: 'Germany', code: 'DE', continent_code: 'EU', flag_url: 'https://flagcdn.com/w320/de.png' },
    { name: 'United Kingdom', code: 'GB', continent_code: 'EU', flag_url: 'https://flagcdn.com/w320/gb.png' },
    { name: 'United States', code: 'US', continent_code: 'NA', flag_url: 'https://flagcdn.com/w320/us.png' },
    { name: 'Japan', code: 'JP', continent_code: 'AS', flag_url: 'https://flagcdn.com/w320/jp.png' },
    { name: 'Australia', code: 'AU', continent_code: 'OC', flag_url: 'https://flagcdn.com/w320/au.png' }
  ],
  
  cities: [
    // Italia
    { name: 'Rome', code: 'rome', country_code: 'IT', region_name: 'Lazio', region_type: 'region', type: 'capital', lat: 41.9028, lng: 12.4964, population: 2870000 },
    { name: 'Milan', code: 'milan', country_code: 'IT', region_name: 'Lombardia', region_type: 'region', type: 'major', lat: 45.4642, lng: 9.19, population: 1390000 },
    { name: 'Naples', code: 'naples', country_code: 'IT', region_name: 'Campania', region_type: 'region', type: 'major', lat: 40.8518, lng: 14.2681, population: 970000 },
    { name: 'Turin', code: 'turin', country_code: 'IT', region_name: 'Piedmont', region_type: 'region', type: 'major', lat: 45.0703, lng: 7.6869, population: 870000 },
    { name: 'Florence', code: 'florence', country_code: 'IT', region_name: 'Tuscany', region_type: 'region', type: 'major', lat: 43.7696, lng: 11.2558, population: 383000 },
    
    // Francia
    { name: 'Paris', code: 'paris', country_code: 'FR', region_name: 'Île-de-France', region_type: 'region', type: 'capital', lat: 48.8566, lng: 2.3522, population: 2200000 },
    { name: 'Lyon', code: 'lyon', country_code: 'FR', region_name: 'Auvergne-Rhône-Alpes', region_type: 'region', type: 'major', lat: 45.7640, lng: 4.8357, population: 518000 },
    { name: 'Marseille', code: 'marseille', country_code: 'FR', region_name: 'Provence-Alpes-Côte d\'Azur', region_type: 'region', type: 'major', lat: 43.2965, lng: 5.3698, population: 870000 },
    
    // Spagna
    { name: 'Madrid', code: 'madrid', country_code: 'ES', region_name: 'Community of Madrid', region_type: 'autonomous_community', type: 'capital', lat: 40.4168, lng: -3.7038, population: 3280000 },
    { name: 'Barcelona', code: 'barcelona', country_code: 'ES', region_name: 'Catalonia', region_type: 'autonomous_community', type: 'major', lat: 41.3851, lng: 2.1734, population: 1620000 },
    { name: 'Seville', code: 'seville', country_code: 'ES', region_name: 'Andalusia', region_type: 'autonomous_community', type: 'major', lat: 37.3886, lng: -5.9823, population: 688000 },
    
    // USA
    { name: 'New York', code: 'new_york', country_code: 'US', region_name: 'New York', region_type: 'state', type: 'major', lat: 40.7128, lng: -74.0060, population: 8336000 },
    { name: 'Los Angeles', code: 'los_angeles', country_code: 'US', region_name: 'California', region_type: 'state', type: 'major', lat: 34.0522, lng: -118.2437, population: 3970000 },
    { name: 'Washington DC', code: 'washington_dc', country_code: 'US', region_name: 'District of Columbia', region_type: 'federal_district', type: 'capital', lat: 38.9072, lng: -77.0369, population: 705000 }
  ],
  
  attractions: [
    // Roma
    { name: 'Colosseum', code: 'rome_colosseum', city_code: 'rome', type: 'monument', subtype: 'historical', description: 'Ancient Roman amphitheatre and iconic symbol of Imperial Rome', lat: 41.8902, lng: 12.4922, visit_duration: '2h', opening_hours: '{"daily": "08:30-19:15"}', cost_range: '€16', image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5', image_alt: 'Roman Colosseum exterior view', is_active: true },
    { name: 'Vatican Museums', code: 'rome_vatican_museums', city_code: 'rome', type: 'museum', subtype: 'art', description: 'World-famous art collection including the Sistine Chapel', lat: 41.9029, lng: 12.4534, visit_duration: '3h', opening_hours: '{"mon-sat": "08:00-18:00"}', cost_range: '€20', image_url: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140', image_alt: 'Vatican Museums interior', is_active: true },
    { name: 'Pantheon', code: 'rome_pantheon', city_code: 'rome', type: 'monument', subtype: 'historical', description: 'Best-preserved Roman building, now a church', lat: 41.8986, lng: 12.4769, visit_duration: '45m', opening_hours: '{"daily": "09:00-19:00"}', cost_range: 'Free', image_url: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b', image_alt: 'Pantheon Rome exterior', is_active: true },
    { name: 'Trevi Fountain', code: 'rome_trevi_fountain', city_code: 'rome', type: 'monument', subtype: 'landmark', description: 'Baroque fountain and popular wishing spot', lat: 41.9009, lng: 12.4833, visit_duration: '30m', opening_hours: '{"daily": "24h"}', cost_range: 'Free', image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5', image_alt: 'Trevi Fountain at night', is_active: true },
    { name: 'Roman Forum', code: 'rome_roman_forum', city_code: 'rome', type: 'monument', subtype: 'historical', description: 'Ancient Roman public square with ruins', lat: 41.8925, lng: 12.4853, visit_duration: '2h30m', opening_hours: '{"daily": "08:30-19:15"}', cost_range: '€16', image_url: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e', image_alt: 'Roman Forum ruins', is_active: true },
    
    // Milano
    { name: 'Duomo di Milano', code: 'milan_duomo', city_code: 'milan', type: 'monument', subtype: 'religious', description: 'Gothic cathedral with stunning spires', lat: 45.4642, lng: 9.1900, visit_duration: '1h30m', opening_hours: '{"daily": "09:00-19:00"}', cost_range: '€15', image_url: 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd', image_alt: 'Milan Cathedral facade', is_active: true },
    { name: 'La Scala', code: 'milan_la_scala', city_code: 'milan', type: 'theatre', subtype: 'cultural', description: 'World-famous opera house', lat: 45.4674, lng: 9.1898, visit_duration: '1h', opening_hours: '{"tue-sun": "10:00-17:30"}', cost_range: '€12', image_url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7', image_alt: 'La Scala theatre interior', is_active: true },
    
    // Parigi
    { name: 'Eiffel Tower', code: 'paris_eiffel_tower', city_code: 'paris', type: 'monument', subtype: 'landmark', description: 'Iconic iron tower and symbol of France', lat: 48.8584, lng: 2.2945, visit_duration: '2h', opening_hours: '{"daily": "09:30-23:45"}', cost_range: '€25', image_url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f', image_alt: 'Eiffel Tower at sunset', is_active: true },
    { name: 'Louvre Museum', code: 'paris_louvre', city_code: 'paris', type: 'museum', subtype: 'art', description: 'World\'s largest art museum', lat: 48.8606, lng: 2.3376, visit_duration: '4h', opening_hours: '{"wed-mon": "09:00-18:00"}', cost_range: '€17', image_url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a', image_alt: 'Louvre pyramid', is_active: true }
  ],
  
  events: [
    // Roma
    { name: 'Rome Film Festival', code: 'rome_film_festival', city_code: 'rome', description: 'International cinema festival showcasing Italian and world cinema', recurrence_rule: 'annual', season: 'autumn', start_date: '2025-10-14', end_date: '2025-10-24', duration: '11 days', cost_range: '€15-50', image_url: 'https://images.unsplash.com/photo-1489599800-78b747338b96', image_alt: 'Film festival red carpet', is_active: true },
    { name: 'La Lunga Notte dei Musei', code: 'rome_museums_night', city_code: 'rome', description: 'Special night opening of Roman museums with €1 entry', recurrence_rule: 'annual', season: 'spring', start_date: '2025-05-18', end_date: '2025-05-18', duration: '1 night', cost_range: '€1', image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96', image_alt: 'Museum at night', is_active: true },
    
    // Milano
    { name: 'Milano Fashion Week', code: 'milan_fashion_week', city_code: 'milan', description: 'International fashion shows and events', recurrence_rule: 'biannual', season: 'spring', start_date: '2025-02-18', end_date: '2025-02-24', duration: '7 days', cost_range: '€50-500', image_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b', image_alt: 'Fashion runway show', is_active: true },
    
    // Parigi
    { name: 'Nuit Blanche Paris', code: 'paris_nuit_blanche', city_code: 'paris', description: 'All-night arts festival with free museum access', recurrence_rule: 'annual', season: 'autumn', start_date: '2025-10-05', end_date: '2025-10-05', duration: '1 night', cost_range: 'Free', image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30', image_alt: 'Paris night art installation', is_active: true }
  ]
};

// Funzione principale
async function populateDatabase() {
  console.log('🚀 Starting database population...\n');
  
  try {
    // 1. Popola continenti
    console.log('📍 Populating continents...');
    for (const continent of seedData.continents) {
      try {
        await xataCall('continents', 'POST', continent);
        console.log(`   ✅ ${continent.name} (${continent.code})`);
      } catch (error) {
        console.log(`   ⚠️  ${continent.name}: ${error.message}`);
      }
    }
    
    // 2. Popola paesi
    console.log('\n🏳️  Populating countries...');
    for (const country of seedData.countries) {
      try {
        await xataCall('countries', 'POST', country);
        console.log(`   ✅ ${country.name} (${country.code})`);
      } catch (error) {
        console.log(`   ⚠️  ${country.name}: ${error.message}`);
      }
    }
    
    // 3. Popola città
    console.log('\n🏙️  Populating cities...');
    for (const city of seedData.cities) {
      try {
        await xataCall('cities', 'POST', city);
        console.log(`   ✅ ${city.name}, ${city.region_name} (${city.country_code})`);
      } catch (error) {
        console.log(`   ⚠️  ${city.name}: ${error.message}`);
      }
    }
    
    // 4. Popola attrazioni
    console.log('\n🎯 Populating attractions...');
    for (const attraction of seedData.attractions) {
      try {
        await xataCall('attractions', 'POST', attraction);
        console.log(`   ✅ ${attraction.name} (${attraction.city_code})`);
      } catch (error) {
        console.log(`   ⚠️  ${attraction.name}: ${error.message}`);
      }
    }
    
    // 5. Popola eventi
    console.log('\n🎪 Populating events...');
    for (const event of seedData.events) {
      try {
        await xataCall('events', 'POST', event);
        console.log(`   ✅ ${event.name} (${event.city_code})`);
      } catch (error) {
        console.log(`   ⚠️  ${event.name}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Database population completed!');
    console.log('\n📊 Summary:');
    console.log(`   • ${seedData.continents.length} continents`);
    console.log(`   • ${seedData.countries.length} countries`);
    console.log(`   • ${seedData.cities.length} cities`);
    console.log(`   • ${seedData.attractions.length} attractions (5 for Rome! 🏛️)`);
    console.log(`   • ${seedData.events.length} events (2 for Rome! 🎬)`);
    
  } catch (error) {
    console.error('❌ Database population failed:', error.message);
    process.exit(1);
  }
}

// Esegui script
populateDatabase();