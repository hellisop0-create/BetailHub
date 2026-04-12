import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LOCATION_DATA = {
  "Sindh": {
    "Karachi": ["DHA", "Clifton", "Gulshan-e-Iqbal", "Gulistan-e-Johar", "North Nazimabad", "Malir", "Saddar", "Scheme 33"],
    "Hyderabad": ["Latifabad", "Qasimabad", "Tando Allahyar Road", "Hyder Chowk", "Heerabaad", "Pathan Colony", "Citizen Colony", "Autobahn"],
    "Sukkur": ["Military Road", "Barrage Road", "Rohri"],
    "Larkana": ["VIP Road", "Station Road"],
    "Mirpur Khas": ["Satellite Town", "Digri Road"]
  },
  "Punjab": {
    "Lahore": ["DHA", "Bahria Town", "Gulberg", "Johar Town", "Model Town", "Cantt"],
    "Faisalabad": ["Madina Town", "People's Colony", "D Ground"],
    "Rawalpindi": ["Bahria Town", "Saddar", "Chaklala", "Adiala Road"],
    "Multan": ["Bosan Road", "Gulgasht Colony", "Cantt"],
    "Gujranwala": ["Model Town", "DC Colony"],
    "Sialkot": ["Cantt", "Sialkot City"]
  },
  "Khyber Pakhtunkhwa": {
    "Peshawar": ["Hayatabad", "University Town", "Ring Road", "Saddar"],
    "Abbottabad": ["Jinnahabad", "Mandian"],
    "Mardan": ["Sheikh Maltoon Town", "Cantt"]
  },
  "Balochistan": {
    "Quetta": ["Jinnah Town", "Satellite Town", "Sariab Road"],
    "Gwadar": ["New Town", "Port Area"]
  }
};

// Reusable Dropdown List component
const SuggestionList = ({ items, onSelect, visible }) => {
  if (!visible || items.length === 0) return null;
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[999] max-h-60 overflow-y-auto py-2">
      {items.map((item) => (
        <div
          key={item}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevents blur before selection
            onSelect(item);
          }}
          className="px-4 py-3 hover:bg-green-50 cursor-pointer text-left text-sm text-gray-700 font-medium flex justify-between items-center group transition-colors"
        >
          {item}
          <Check className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100" />
        </div>
      ))}
    </div>
  );
};

export default function Hero() {
  const [query, setQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();

  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [activeField, setActiveField] = useState(null);

  const isSearchDisabled = !query.trim();

  // Logic to show all suggestions when field is focused, or filter when typing
  const getCitySuggestions = () => {
    if (!province || !LOCATION_DATA[province]) return [];
    const cities = Object.keys(LOCATION_DATA[province]);
    if (!city) return cities; // Show all if empty
    return cities.filter(c => c.toLowerCase().includes(city.toLowerCase()));
  };

  const getAreaSuggestions = () => {
    if (!province || !city || !LOCATION_DATA[province][city]) return [];
    const areas = LOCATION_DATA[province][city];
    if (!area) return areas; // Show all if empty
    return areas.filter(a => a.toLowerCase().includes(area.toLowerCase()));
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (isSearchDisabled) return;
    
    const params = new URLSearchParams({
      q: query.trim(),
      province: province,
      city: city,
      area: area
    });
    
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative bg-green-900 py-20 min-h-[500px]">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl md:text-7xl font-black text-white mb-4 tracking-tighter font-brand">BetailHub</h1>
          <p className="text-green-100 text-lg opacity-90">پاکستان کا منفرد آن لائن ڈیجیٹل مویشی منڈی</p>
        </motion.div>

        <form onSubmit={handleSearch} className="max-w-6xl mx-auto bg-white rounded-2xl p-3 flex flex-col gap-3 shadow-2xl relative z-50">
          <div className="flex flex-col lg:flex-row gap-2 w-full">
            
            {/* Main Search Input */}
            <div className="flex-[1.5] flex items-center px-4 border border-gray-100 rounded-xl bg-gray-50">
              <Search className="text-gray-400 w-5 h-5 mr-3" />
              <input 
                type="text" 
                placeholder="Find animals (e.g. Cow, Goat...)" 
                className="w-full py-4 bg-transparent outline-none text-gray-700 font-medium"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Location Selector Group */}
            <div className="flex flex-col md:flex-row gap-2 flex-[3]">
              
              {/* Province - Strict Selection */}
              <div className="relative flex-1">
                <select 
                  className="w-full h-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-gray-600 font-semibold text-sm appearance-none cursor-pointer"
                  value={province}
                  onChange={(e) => { setProvince(e.target.value); setCity(""); setArea(""); }}
                >
                  <option value="">Select Province</option>
                  {Object.keys(LOCATION_DATA).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* City - Typeable with Dropdown */}
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="City (Type or Select)"
                  disabled={!province}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-gray-600 font-semibold text-sm disabled:opacity-50"
                  value={city}
                  onFocus={() => setActiveField('city')}
                  onBlur={() => setTimeout(() => setActiveField(null), 200)}
                  onChange={(e) => { setCity(e.target.value); setArea(""); }}
                />
                <SuggestionList 
                  items={getCitySuggestions()} 
                  visible={activeField === 'city'} 
                  onSelect={(val) => { setCity(val); setArea(""); setActiveField(null); }} 
                />
              </div>

              {/* Area - Typeable with Dropdown */}
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Area (Type or Select)"
                  disabled={!city}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-gray-600 font-semibold text-sm disabled:opacity-50"
                  value={area}
                  onFocus={() => setActiveField('area')}
                  onBlur={() => setTimeout(() => setActiveField(null), 200)}
                  onChange={(e) => setArea(e.target.value)}
                />
                <SuggestionList 
                  items={getAreaSuggestions()} 
                  visible={activeField === 'area'} 
                  onSelect={(val) => { setArea(val); setActiveField(null); }} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSearchDisabled}
              className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 hover:bg-orange-600 disabled:opacity-50"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}