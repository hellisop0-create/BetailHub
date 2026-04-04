import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, Crown, Star } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { motion } from 'motion/react';

interface AdCardProps {
  ad: any; 
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

const AdCard: React.FC<AdCardProps> = ({ ad, isFavorite = false, onToggleFavorite }) => {
  
  const isGold = 
    ad.isFeatured === true || 
    ad.isFeatured === "true" || 
    ad.featured === true || 
    ad.is_featured === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "bg-white rounded-xl overflow-hidden border transition-all duration-300 group relative",
        isGold ? "z-10" : "border-gray-200 hover:shadow-xl"
      )}
      style={isGold ? {
        border: '3px solid #FFD700',
        boxShadow: '0 10px 25px -5px rgba(255, 215, 0, 0.3)',
      } : {}}
    >
      {/* HEART TOGGLE BUTTON */}
      <motion.button
        whileTap={{ scale: 0.8 }} // Shrinks slightly when pressed
        whileHover={{ scale: 1.1 }} // Grows slightly on hover
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite?.(e);
        }}
        className={cn(
          "absolute top-3 right-3 p-2 rounded-full z-30 shadow-sm transition-all duration-300",
          isFavorite ? "bg-red-50" : "bg-white/80 hover:bg-white"
        )}
      >
        <Heart 
          size={20}
          className={cn(
            "transition-all duration-300",
            isFavorite 
              ? "fill-red-500 text-red-500" // Filled State
              : "text-gray-400 fill-transparent hover:text-red-400" // Empty State
          )} 
        />
      </motion.button>

      <Link to={`/ad/${ad.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={ad.images?.[0] || 'https://placehold.co/400x300?text=No+Photo'}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {isGold && (
            <div className="absolute top-3 left-3 z-20">
              <span className="flex items-center gap-1.5 bg-yellow-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-white/20 uppercase tracking-wider">
                <Crown className="w-3 h-3 fill-white" />
                Featured
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="w-full">
              <h2 className="text-base font-bold flex items-center gap-2 text-gray-900 truncate">
                {ad.title}
                {isGold && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />}
              </h2> 
              <div className="text-xl font-black text-green-700 mt-1">
                {formatPrice(ad.price)}
              </div>
            </div>
          </div>

          <div className="flex items-center text-gray-500 text-xs mt-3 pt-3 border-t border-gray-50">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            <span className="truncate font-medium">{ad.city || 'Location N/A'}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default AdCard;