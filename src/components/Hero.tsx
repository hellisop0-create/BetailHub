import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Simplified Pakistan Location Hierarchy
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

// Suggestion Popover Component
const SuggestionList = ({ items, onSelect, visible }) => {
  if (!visible || items.length === 0) return null;
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[999] max-h-48 overflow-y-auto py-1">
      {items.map((item) => (
        <div
          key={item}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevents blur from closing list before selection
            onSelect(item);
          }}
          className="px-4 py-2 hover:bg-green-50 cursor-pointer text-left text-sm text-gray-700 font-medium flex justify-between items-center group"
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

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            const cityPart = addr.city || addr.town || addr.village || addr.suburb || "";
            const statePart = addr.state || "";
            const formattedAddress = `${cityPart}${cityPart && statePart ? ', ' : ''}${statePart}, Pakistan`;
            setQuery(formattedAddress);
          } else {
            setQuery(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          setQuery(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        alert("Unable to retrieve location. Please select manually.");
        setIsLocating(false);
      }
    );
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    const locationFinal = area || city || province || "All Pakistan";
    if (locationFinal !== "All Pakistan") params.append('location', locationFinal);
    navigate(`/search?${params.toString()}`);
  };

  const provinceSuggestions = Object.keys(LOCATION_DATA).filter(p => 
    p.toLowerCase().includes(province.toLowerCase()) && province !== p
  );

  const citySuggestions = province && LOCATION_DATA[province] 
    ? Object.keys(LOCATION_DATA[province]).filter(c => c.toLowerCase().includes(city.toLowerCase()) && city !== c)
    : [];

  const areaSuggestions = province && city && LOCATION_DATA[province][city]
    ? LOCATION_DATA[province][city].filter(a => a.toLowerCase().includes(area.toLowerCase()) && area !== a)
    : [];

  return (
    <div className="relative bg-green-900 py-20">
      <div 
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            Pakistan Livestock Mandi
          </h1>
          <p className="text-green-100 text-lg opacity-90">
            پاکستان لائیوسٹاک منڈی - پاکستان کا منفرد ڈیجیٹل (آن لائن) مویشی منڈی
          </p>
        </motion.div>

        <form 
          onSubmit={handleSearch} 
          className="max-w-6xl mx-auto bg-white rounded-2xl p-3 flex flex-col gap-3 shadow-2xl relative z-50"
        >
          <div className="flex flex-col md:flex-row gap-2 w-full">
            <div className="flex-[1.5] flex items-center px-4 border border-gray-100 rounded-xl bg-gray-50">
              <Search className="text-gray-400 w-5 h-5 mr-3" />
              <input 
                type="text" 
                placeholder="What are you looking for?" 
                className="w-full py-4 bg-transparent outline-none text-gray-700 font-medium"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                type="button"
                onClick={handleCurrentLocation}
                className={`ml-2 text-orange-500 hover:scale-110 transition-transform ${isLocating ? 'animate-spin' : ''}`}
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-2 flex-[2.5]">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Province"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-gray-600 font-semibold text-sm cursor-text"
                  value={province}
                  onFocus={() => setActiveField('province')}
                  onBlur={() => setActiveField(null)}
                  onChange={(e) => { setProvince(e.target.value); setCity(""); setArea(""); }}
                />
                <SuggestionList 
                  items={provinceSuggestions} 
                  visible={activeField === 'province'} 
                  onSelect={(val) => { setProvince(val); setCity(""); setArea(""); setActiveField(null); }} 
                />
              </div>

              <AnimatePresence>
                {province && (
                  <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="relative flex-1">
                    <input 
                      type="text"
                      placeholder="City"
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-gray-600 font-semibold text-sm cursor-text"
                      value={city}
                      onFocus={() => setActiveField('city')}
                      onBlur={() => setActiveField(null)}
                      onChange={(e) => { setCity(e.target.value); setArea(""); }}
                    />
                    <SuggestionList 
                      items={citySuggestions} 
                      visible={activeField === 'city'} 
                      onSelect={(val) => { setCity(val); setArea(""); setActiveField(null); }} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {city && (
                  <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="relative flex-1">
                    <input 
                      type="text"
                      placeholder="Area"
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-gray-600 font-semibold text-sm cursor-text"
                      value={area}
                      onFocus={() => setActiveField('area')}
                      onBlur={() => setActiveField(null)}
                      onChange={(e) => setArea(e.target.value)}
                    />
                    <SuggestionList 
                      items={areaSuggestions} 
                      visible={activeField === 'area'} 
                      onSelect={(val) => { setArea(val); setActiveField(null); }} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              type="submit" 
              className="bg-orange-500 text-white px-10 py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors active:scale-95"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}