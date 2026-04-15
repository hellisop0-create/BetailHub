import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  documentId,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Ad } from '../types';
import AdCard from '../components/AdCard';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Heart,
  List,
  Trash2,
  CheckCircle,
  LogOut,
  Loader2,
  Clock,
  Edit3,
  Eye,
  Settings,
  Tag,
  Zap,
  XCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Profile() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Updated Tab State
  const [activeTab, setActiveTab] = useState<'listings' | 'favorites' | 'featured'>('listings');
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [favoriteAds, setFavoriteAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Filter for Featured Ads: ensures paid/test ads show up correctly
  const featuredAds = myAds.filter(ad => 
    ad.isFeatured === true || 
    ['pending', 'active', 'declined'].includes(ad.featuredStatus || '')
  );

  // Fetch User's Own Listings
  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);

    const q = query(
      collection(db, 'ads'),
      where('sellerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Ad));
      setMyAds(ads);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch Favorites
  useEffect(() => {
    if (activeTab !== 'favorites' || !user?.favoriteAds || user.favoriteAds.length === 0) {
      setFavoriteAds([]);
      return;
    }
    setLoadingFavs(true);
    try {
      const q = query(collection(db, 'ads'), where(documentId(), 'in', user.favoriteAds));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setFavoriteAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)));
        setLoadingFavs(false);
      }, () => setLoadingFavs(false));
      return () => unsubscribe();
    } catch (error) {
      setLoadingFavs(false);
    }
  }, [activeTab, user?.favoriteAds]);

  if (!user) return null;

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm('Are you sure you want to delete this ad permanently?')) return;
    try {
      await deleteDoc(doc(db, 'ads', adId));
      toast.success('Ad deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete ad');
    }
  };

  const handleToggleSold = async (adId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'sold' ? 'active' : 'sold';
      await updateDoc(doc(db, 'ads', adId), {
        status: newStatus
      });
      toast.success(newStatus === 'sold' ? 'Marked as Sold' : 'Marked as Active');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="relative inline-block mb-4">
                <img
                  src={user.photoURL || 'https://picsum.photos/seed/user/100/100'}
                  alt=""
                  className="w-24 h-24 rounded-full border-4 border-green-50 mx-auto object-cover shadow-sm"
                />
                {user.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user.displayName || 'User'}</h2>
              <p className="text-sm text-gray-500 mb-8">{user.email}</p>

              <button
                onClick={logout}
                className="w-full bg-red-50 text-red-600 py-3 rounded-2xl font-bold hover:bg-red-100 flex items-center justify-center space-x-2 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 flex space-x-2">
              <button
                onClick={() => setActiveTab('listings')}
                className={cn(
                  "flex-1 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all",
                  activeTab === 'listings' ? "bg-green-700 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <List className="w-5 h-5" />
                <span>My Ads</span>
              </button>

              <button
                onClick={() => setActiveTab('featured')}
                className={cn(
                  "flex-1 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all",
                  activeTab === 'featured' ? "bg-green-700 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Zap className="w-5 h-5" />
                <span>Featured</span>
              </button>

              <button
                onClick={() => setActiveTab('favorites')}
                className={cn(
                  "flex-1 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all",
                  activeTab === 'favorites' ? "bg-green-700 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Heart className="w-5 h-5" />
                <span>Favorites</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'listings' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    <div className="col-span-full flex justify-center py-20"><Loader2 className="w-10 h-10 text-green-700 animate-spin" /></div>
                  ) : myAds.length > 0 ? (
                    myAds.map(ad => (
                      <div key={ad.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col space-y-5 transition-all hover:shadow-md">

                        {/* Header: Image and Info */}
                        <div className="flex space-x-4">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100 relative">
                            <img
                              src={ad.images?.[0] || 'https://via.placeholder.com/300'}
                              alt=""
                              className={cn("w-full h-full object-cover", ad.status === 'sold' && "opacity-50 grayscale")}
                            />
                            {ad.status === 'sold' && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest">Sold</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900 truncate text-lg pr-2">{ad.title}</h4>
                              {ad.status === 'pending' && (
                                <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-1 rounded-lg flex items-center font-bold uppercase tracking-wider border border-amber-100">
                                  <Clock className="w-3 h-3 mr-1" /> Pending
                                </span>
                              )}
                              {ad.status === 'sold' && (
                                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-lg flex items-center font-bold uppercase tracking-wider border border-gray-200">
                                  <Tag className="w-3 h-3 mr-1" /> Sold
                                </span>
                              )}
                            </div>
                            <p className="text-green-700 font-extrabold text-xl">
                              {ad.price ? `${ad.price.toLocaleString()} PKR` : 'Price on Call'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">ID: {ad.id.slice(0, 8)}</p>
                          </div>
                        </div>

                        {/* Forced Controls Bar */}
                        <div className="pt-4 border-t border-gray-50">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3 flex items-center">
                            <Settings className="w-3 h-3 mr-1" /> Manage Your Ad
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => navigate(`/ad/${ad.id}`)}
                              className="flex items-center justify-center space-x-1 py-2.5 px-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors text-sm font-bold border border-gray-200"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => navigate(`/edit-ad/${ad.id}`)}
                              className="flex items-center justify-center space-x-1 py-2.5 px-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm font-bold border border-blue-100"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => {
                                const service = encodeURIComponent("Featured Ad (Weekly)");
                                const price = encodeURIComponent("1,000 PKR");
                                navigate(`/billing?adId=${ad.id}&service=${service}&price=${price}`);
                              }}
                              className="flex items-center justify-center space-x-1 py-2.5 px-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors text-sm font-bold border border-amber-100"
                            >
                              <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                              <span>Promote</span>
                            </button>

                            <button
                              onClick={() => handleToggleSold(ad.id, ad.status)}
                              className={cn(
                                "flex items-center justify-center space-x-1 py-2.5 px-2 rounded-xl transition-colors text-sm font-bold border",
                                ad.status === 'sold'
                                  ? "bg-green-600 text-white border-green-700 hover:bg-green-700"
                                  : "bg-white text-green-700 border-green-200 hover:bg-green-50"
                              )}
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>{ad.status === 'sold' ? 'Mark Active' : 'Mark Sold'}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteAd(ad.id)}
                              className="flex items-center justify-center space-x-1 py-2.5 px-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors text-sm font-bold border border-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 font-medium">No ads found. Try posting one!</p>
                      <button onClick={() => navigate('/post')} className="mt-4 bg-green-700 text-white px-6 py-2 rounded-xl font-bold">Post Now</button>
                    </div>
                  )}
                </div>
              ) : activeTab === 'featured' ? (
                /* Featured Ads Section */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredAds.length > 0 ? (
                    featuredAds.map(ad => (
                      <div key={ad.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col space-y-5 transition-all hover:shadow-md">
                        <div className="flex space-x-4">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100 relative">
                            <img
                              src={ad.images?.[0] || 'https://via.placeholder.com/300'}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900 truncate text-lg pr-2">{ad.title}</h4>
                              
                              {/* FEATURED ACTIVITY STATUS */}
                              {ad.featuredStatus === 'pending' && (
                                <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-1 rounded-lg flex items-center font-bold uppercase tracking-wider border border-amber-100">
                                  <Clock className="w-3 h-3 mr-1" /> Pending
                                </span>
                              )}
                              {(ad.featuredStatus === 'active' || ad.isFeatured) && (
                                <span className="bg-green-50 text-green-600 text-[10px] px-2 py-1 rounded-lg flex items-center font-bold uppercase tracking-wider border border-green-100">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Active
                                </span>
                              )}
                              {ad.featuredStatus === 'declined' && (
                                <span className="bg-red-50 text-red-600 text-[10px] px-2 py-1 rounded-lg flex items-center font-bold uppercase tracking-wider border border-red-100">
                                  <XCircle className="w-3 h-3 mr-1" /> Declined
                                </span>
                              )}
                            </div>
                            <p className="text-green-700 font-extrabold text-xl">
                              {ad.price ? `${ad.price.toLocaleString()} PKR` : 'Price on Call'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">ID: {ad.id.slice(0, 8)}</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => navigate(`/ad/${ad.id}`)}
                              className="flex items-center justify-center space-x-1 py-2.5 px-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors text-sm font-bold border border-gray-200"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => navigate(`/edit-ad/${ad.id}`)}
                              className="flex items-center justify-center space-x-1 py-2.5 px-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm font-bold border border-blue-100"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
                      <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium">No featured ads found.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Favorites Tab */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loadingFavs ? (
                    <div className="col-span-full flex justify-center py-20"><Loader2 className="w-10 h-10 text-green-700 animate-spin" /></div>
                  ) : favoriteAds.length > 0 ? (
                    favoriteAds.map(ad => <AdCard key={ad.id} ad={ad} isFavorite={true} onToggleFavorite={() => { }} />)
                  ) : (
                    <div className="col-span-full bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 font-medium">Your favorites list is empty.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}