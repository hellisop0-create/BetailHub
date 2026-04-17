import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad, Category } from '../types';
import AdCard from '../components/AdCard';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, MapPin, Package, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { LOCATION_DATA } from '../components/locations';

const categories: Category[] = ['Cattle', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Others'];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [exactAds, setExactAds] = useState<Ad[]>([]);
  const [otherAds, setOtherAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters] = useState(false);
  const { t } = useLanguage();

  const categoryFilter = searchParams.get('category') as Category | null;
  const provinceFilter = searchParams.get('province') || '';
  const cityFilter = searchParams.get('city') || '';
  const sortFilter = searchParams.get('sort') || 'latest';

  useEffect(() => {
    setLoading(true);
    // 1. CLEAR STATE ON EVERY FILTER CHANGE
    setExactAds([]);
    setOtherAds([]);

    let q = query(collection(db, 'ads'), where('status', '==', 'active'));
    if (categoryFilter) {
      q = query(q, where('category', '==', categoryFilter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allFetchedAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      
      const seenIds = new Set();
      const localExact: Ad[] = [];
      const localOthers: Ad[] = [];

      allFetchedAds.forEach(ad => {
        if (seenIds.has(ad.id)) return;
        seenIds.add(ad.id);

        const isProvinceMatch = !provinceFilter || ad.province === provinceFilter;
        const isCityMatch = !cityFilter || ad.city === cityFilter;
        
        // 2. EXCLUSIVE LOGIC: If filtering, separate them. If not, everything is exact.
        if (provinceFilter || cityFilter) {
          if (isProvinceMatch && isCityMatch) {
            localExact.push(ad);
          } else {
            localOthers.push(ad);
          }
        } else {
          localExact.push(ad);
        }
      });
      console.table(allFetchedAds.map(ad => ({ id: ad.id, title: ad.title })));

      const sortFunction = (a: Ad, b: Ad) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if (sortFilter === 'price_asc') return a.price - b.price;
        if (sortFilter === 'price_desc') return b.price - a.price;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      };

      setExactAds([...localExact].sort(sortFunction));
      setOtherAds([...localOthers].sort(sortFunction));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [categoryFilter, provinceFilter, cityFilter, sortFilter]);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key === 'province') newParams.delete('city');
    setSearchParams(newParams);
  };


  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Search className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {categoryFilter ? t(categoryFilter.toLowerCase()) : t('latest')}
              </h1>
              <div className="flex items-center text-sm text-gray-500 mt-0.5">
                <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                {cityFilter || provinceFilter || 'All Pakistan'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full w-fit">
            <Package className="w-4 h-4" />
            {exactAds.length} Ads Found
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className={cn("w-full lg:w-64 space-y-8", showFilters ? "block" : "hidden lg:block")}>
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                {t('categories')}
                {categoryFilter && (
                  <button onClick={() => updateFilter('category', null)} className="text-xs text-red-500 font-normal underline">Clear</button>
                )}
              </h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={`cat-${cat}`} // IMPROVED KEY
                    onClick={() => updateFilter('category', cat)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg transition-colors text-sm",
                      categoryFilter === cat ? "bg-green-700 text-white font-bold" : "bg-white text-gray-600 hover:bg-gray-100 border border-transparent"
                    )}
                  >
                    {t(cat.toLowerCase())}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center text-sm uppercase tracking-wider">
                <MapPin className="w-4 h-4 mr-2" /> {t('location')}
              </h3>
              
              <select
                value={provinceFilter}
                onChange={(e) => updateFilter('province', e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
              >
                <option value="">All Provinces</option>
                {LOCATION_DATA.map((loc, idx) => (
                  <option key={`prov-${loc.province}-${idx}`} value={loc.province}>{loc.province}</option>
                ))}
              </select>

              <select
                value={cityFilter}
                onChange={(e) => updateFilter('city', e.target.value)}
                disabled={!provinceFilter}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">All Cities</option>
                {LOCATION_DATA.find(l => l.province === provinceFilter)?.cities.map((city, idx) => (
                  <option key={`city-${city}-${idx}`} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Sort By</h3>
              <select
                value={sortFilter}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm"
              >
                <option value="latest">Latest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </aside>

          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={`skeleton-${i}`} className="h-80 bg-white animate-pulse rounded-2xl border border-gray-100" />)}
              </div>
            ) : (
              <div className="space-y-12">
                {exactAds.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {exactAds.map(ad => <AdCard key={`exact-${ad.id}`} ad={ad} />)}
                  </div>
                )}

                {(provinceFilter || cityFilter) && otherAds.length > 0 && (
                  <div className="pt-10 border-t border-gray-200">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                      <p className="text-gray-500">Other {categoryFilter || 'livestock'} ads available in Pakistan</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {otherAds.map(ad => <AdCard key={`other-${ad.id}`} ad={ad} />)}
                    </div>
                  </div>
                )}
                
                {exactAds.length === 0 && otherAds.length === 0 && (
                   <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center max-w-2xl mx-auto">
                      <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900">No ads found</h3>
                      <p className="text-gray-500 mt-2">Try clearing filters to see more listings.</p>
                    </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}