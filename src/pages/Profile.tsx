import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, // <--- Add this one
  deleteDoc, 
  doc, 
  getDocs, 
  documentId 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Ad } from '../types';
import AdCard from '../components/AdCard';
import { useLanguage } from '../contexts/LanguageContext';
import { Settings, Heart, List, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Profile() {
  const { user, logout } = useAuth();
  console.log("FULL USER OBJECT:", user);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'listings' | 'favorites'>('listings');
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [favoriteAds, setFavoriteAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // 1. Fetch User's Own Listings (Real-time)
  useEffect(() => {
  // 1. Guard: Only run if the tab is active and we have a user
  if (activeTab !== 'favorites' || !user) {
    setFavoriteAds([]);
    return;
  }

  // 2. Debugging: Check your console (F12) to see if this array is actually populated
  console.log("Current user favorite IDs:", user.favoriteAds);

  // 3. Guard: Firestore "in" query fails if array is empty or missing
  if (!user.favoriteAds || user.favoriteAds.length === 0) {
    setFavoriteAds([]);
    setLoadingFavs(false);
    return;
  }

  setLoadingFavs(true);

  try {
    // 4. Using the IDs directly from the user object
    const q = query(
      collection(db, 'ads'),
      where(documentId(), 'in', user.favoriteAds)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ads = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Ad));
      
      console.log("Found matching ads in DB:", ads.length);
      setFavoriteAds(ads);
      setLoadingFavs(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setLoadingFavs(false);
    });

    return () => unsubscribe();
  } catch (error) {
    console.error("Setup error:", error);
    setLoadingFavs(false);
  }
}, [activeTab, user, user?.favoriteAds]); // Added 'user' to the dependency array

  if (!user) return null;

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;
    try {
      await deleteDoc(doc(db, 'ads', adId));
      toast.success('Ad deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="relative inline-block mb-4">
                <img
                  src={user.photoURL || 'https://picsum.photos/seed/user/100/100'}
                  alt={user.displayName}
                  className="w-24 h-24 rounded-full border-4 border-green-100 mx-auto object-cover"
                />
                {user.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-white">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user.displayName}</h2>
              <p className="text-sm text-gray-500 mb-6">{user.email}</p>
              
              <div className="flex flex-col space-y-2">
                <button className="w-full bg-gray-50 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-100 flex items-center justify-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
                <button onClick={logout} className="w-full bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 flex items-center justify-center space-x-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tab Switcher */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200 flex space-x-2">
              <button
                onClick={() => setActiveTab('listings')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all",
                  "text-sm sm:text-base",
                  activeTab === 'listings' ? "bg-green-700 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <List className="w-5 h-5" />
                <span>{t('myAds')}</span>
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all",
                  "text-sm sm:text-base",
                  activeTab === 'favorites' ? "bg-green-700 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Heart className="w-5 h-5" />
                <span>{t('favorites')}</span>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'listings' ? (
              <div className="space-y-4">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse"></div>)}
                  </div>
                ) : myAds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myAds.map(ad => (
                      <div key={ad.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex space-x-4">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{ad.title}</h4>
                          <p className="text-green-700 font-bold mt-1">{ad.price.toLocaleString()} PKR</p>
                          <div className="flex space-x-2 mt-4">
                            <button onClick={() => handleDeleteAd(ad.id)} className="flex-1 bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 flex items-center justify-center">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                    <p className="text-gray-500">You haven't posted any ads yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {loadingFavs ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse"></div>)}
                  </div>
                ) : favoriteAds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favoriteAds.map(ad => (
                      <AdCard 
                        key={ad.id} 
                        ad={ad} 
                        isFavorite={true} 
                        onToggleFavorite={() => {}} // Not strictly needed here, handled by Home/Cards
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No favorite ads yet.</p>
                    <button onClick={() => navigate('/')} className="mt-4 text-green-700 font-bold">Explore Ads</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}