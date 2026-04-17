import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, MapPin, Edit3 } from 'lucide-react';
import { motion } from 'motion/react';
import { LOCATION_DATA } from './locations'; 

export default function Hero() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");

  // Get Unique Provinces
  const provinces = [...new Set(LOCATION_DATA.map(item => item.province))].sort();

  // Get Cities filtered by Province
  const cities = LOCATION_DATA
    .filter(item => item.province === province)
    .map(item => item.city)
    .sort();

  // Get Suggested Areas based on selected City
  const suggestedAreas = LOCATION_DATA
    .find(item => item.city === city && item.province === province)?.area || [];

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.append('q', query.trim());
    if (province) params.append('province', province);
    if (city) params.append('city', city);
    if (area) params.append('area', area);
    
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative bg-green-900 py-16 md:py-24">
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 font-brand">Chopan</h1>
          <p className="text-green-100 text-lg font-medium">Find livestock in your exact street or village</p>
        </motion.div>

        <form onSubmit={handleSearch} className="max-w-6xl mx-auto bg-white rounded-3xl p-4 shadow-2xl">
          <div className="flex flex-col gap-4">
            
            {/* 1. Main Keyword Search */}
            <div className="flex items-center px-4 bg-gray-50 rounded-2xl border border-gray-100">
              <Search className="text-gray-400 w-5 h-5 mr-3" />
              <input 
                type="text" 
                placeholder="Search for Cow, Goat, Camel..." 
                className="w-full py-5 bg-transparent outline-none text-gray-700 font-bold"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* 2. Hierarchical Location Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              
              {/* Province Selection */}
              <div className="relative">
                <select 
                  className="w-full p-4 bg-gray-100 rounded-xl outline-none appearance-none font-bold text-gray-600 text-sm cursor-pointer border-2 border-transparent focus:border-green-500 transition-all"
                  value={province}
                  onChange={(e) => { setProvince(e.target.value); setCity(""); setArea(""); }}
                >
                  <option value="">All Provinces</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* City Selection */}
              <div className="relative">
                <select 
                  disabled={!province}
                  className="w-full p-4 bg-gray-100 rounded-xl outline-none appearance-none font-bold text-gray-600 text-sm disabled:opacity-50 border-2 border-transparent focus:border-green-500 transition-all"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setArea(""); }}
                >
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Area: Typed OR Selected (Datalist) */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                   <Edit3 className="w-4 h-4 text-gray-400" />
                </div>
                <input 
                  list="area-suggestions"
                  disabled={!city}
                  placeholder={city ? "Type or select Area" : "Select City first"}
                  className="w-full p-4 pl-10 bg-gray-100 rounded-xl outline-none font-bold text-gray-600 text-sm disabled:opacity-50 border-2 border-transparent focus:border-green-500 transition-all placeholder:text-gray-400"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
                <datalist id="area-suggestions">
                  {suggestedAreas.map(a => <option key={a} value={a} />)}
                </datalist>
              </div>

              {/* Submit */}
              <button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-all active:scale-95 py-4 shadow-lg shadow-green-200"
              >
                FIND NOW
              </button>
            </div>
          </div>
        </form>
        
        <p className="text-green-200/50 text-xs mt-4 text-center font-medium">
          Tip: You can type your specific neighborhood if it's not in the list.
        </p>
      </div>
    </div>
  );
}