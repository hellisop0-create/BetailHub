import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad, Category } from '../types';
import AdCard from '../components/AdCard';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, SlidersHorizontal, MapPin, X } from 'lucide-react';
import { cn } from '../lib/utils';

const categories: Category[] = ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Others'];
const cities = ['All Pakistan', 'Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useLanguage();

  const categoryFilter = searchParams.get('category') as Category | null;
  const cityFilter = searchParams.get('city') || 'All Pakistan';
  const sortFilter = searchParams.get('sort') || 'latest';

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, 'ads'), where('status', '==', 'active'));

    if (categoryFilter) {
      q = query(q, where('category', '==', categoryFilter));
    }

    if (cityFilter !== 'All Pakistan') {
      q = query(q, where('city', '==', cityFilter));
    }

    // Sorting logic (Note: Firestore requires composite indexes for multiple filters + sort)
    // For simplicity in this demo, we'll sort client-side if needed or just use default
    q = query(q, orderBy('createdAt', sortFilter === 'price_asc' || sortFilter === 'price_desc' ? 'desc' : 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
  
  // Custom sorting: Featured ads always come first
  results.sort((a, b) => {
    // 1. Check if one is featured and the other isn't
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;

    // 2. If they are both featured (or both not), use the selected filter
    if (sortFilter === 'price_asc') return a.price - b.price;
    if (sortFilter === 'price_desc') return b.price - a.price;
    
    // Default to newest first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  setAds(results);
  setLoading(false);
});

    return () => unsubscribe();
  }, [categoryFilter, cityFilter, sortFilter]);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {categoryFilter ? t(categoryFilter.toLowerCase()) : t('latest')}
          </h1>
          
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('search')}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden p-2 bg-white border border-gray-200 rounded-lg text-gray-600"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={cn(
            "w-full md:w-64 space-y-8",
            showFilters ? "block" : "hidden md:block"
          )}>
            {/* Category Filter */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                {t('categories')}
                {categoryFilter && (
                  <button onClick={() => updateFilter('category', null)} className="text-xs text-red-500 font-normal">Clear</button>
                )}
              </h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => updateFilter('category', cat)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg transition-colors",
                      categoryFilter === cat ? "bg-green-700 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {t(cat.toLowerCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {t('location')}
              </h3>
              <select
                value={cityFilter}
                onChange={(e) => updateFilter('city', e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-none"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Sort By</h3>
              <select
                value={sortFilter}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-none"
              >
                <option value="latest">Latest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </aside>

          {/* Listings Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-xl h-80 animate-pulse border border-gray-200"></div>
                ))}
              </div>
            ) : ads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.map(ad => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or search terms.</p>
                <button
                  onClick={() => setSearchParams({})}
                  className="bg-green-700 text-white px-6 py-2 rounded-full font-bold"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
