import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function Hero() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("All Pakistan");
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (city !== "All Pakistan") params.append('location', city);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative bg-green-900 py-20 overflow-hidden">
      {/* --- THE OLD PATTERN THEME --- */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{ 
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}
      />
      
      {/* Bottom Gradient Fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            Find everything in <span className="text-green-400">Pakistan</span>
          </h1>
          <p className="text-green-100 text-lg opacity-90">
            Buy and Sell Livestock Easily.
          </p>
        </motion.div>

        {/* --- THE SEARCH BOX --- */}
        <form 
          onSubmit={handleSearch} 
          className="max-w-4xl mx-auto bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl"
        >
          <div className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-100">
            <Search className="text-gray-400 w-5 h-5 mr-3" />
            <input 
              type="text" 
              placeholder="What are you looking for?" 
              className="w-full py-4 outline-none text-gray-700 font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center px-4 md:w-64">
            <MapPin className="text-gray-400 w-5 h-5 mr-3" />
            <select 
              className="bg-transparent outline-none w-full cursor-pointer text-gray-600 font-semibold"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option>All Pakistan</option>
              <option>Lahore</option>
              <option>Karachi</option>
              <option>Islamabad</option>
              <option>Rawalpindi</option>
              <option>Faisalabad</option>
              <option>Multan</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="bg-orange-500 text-white px-12 py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors active:scale-95"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}