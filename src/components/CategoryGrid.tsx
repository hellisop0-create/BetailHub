import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

// Using Web URLs so Google AI Studio can display them immediately
const categories = [
  { 
    id: 'Cow', 
    image: 'https://i.postimg.cc/KzSQT3Nn/cow.jpg', 
    color: 'bg-green-100' 
  },
  { 
    id: 'Buffalo', 
    image: 'https://i.postimg.cc/Bv1MtBxQ/buffalo.jpg', 
    color: 'bg-green-100' 
  },
  { 
    id: 'Goat', 
    image: 'https://i.postimg.cc/KzPfDcpx/goat.jpg', 
    color: 'bg-green-100' 
  },
  { 
    id: 'Sheep', 
    image: 'https://i.postimg.cc/bvQV3Rsq/sheep.jpg', 
    color: 'bg-green-100' 
  },
  { 
    id: 'Camel', 
    image: 'https://i.postimg.cc/KYnpJ549/camel.jpg', 
    color: 'bg-green-100' 
  },
  { 
    id: 'Others', 
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300', 
    color: 'bg-green-100' 
  },
];

export default function CategoryGrid() {
  const { t } = useLanguage();

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('categories')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <Link
                to={`/browse?category=${cat.id}`}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl ${cat.color} hover:shadow-md transition-all border border-transparent hover:border-gray-200 group h-full`}
              >
                {/* Fixed size Circle Container */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 overflow-hidden rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform border border-gray-100">
                  <img 
                    src={cat.image} 
                    alt={cat.id}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                <span className="font-semibold text-gray-700 text-sm sm:text-base text-center">
                  {t(cat.id.toLowerCase())}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}