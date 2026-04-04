import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext'; // Added for identity check
import { formatPrice, cn } from '../lib/utils';
import { 
  MapPin, Phone, MessageCircle, ShieldCheck, Share2, 
  ChevronLeft, ChevronRight, Flag, Calendar, Weight, 
  Activity, Info, Crown, Star, Hash 
} from 'lucide-react';
import AdCard from '../components/AdCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AdDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth(); // Get current logged-in user
  const [ad, setAd] = useState<any | null>(null);
  const [relatedAds, setRelatedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const fetchAd = async () => {
      setLoading(true);
      try {
        const adDoc = await getDoc(doc(db, 'ads', id));
        if (adDoc.exists()) {
          const adData = { id: adDoc.id, ...adDoc.data() } as Ad;
          setAd(adData);
          
          // Increment view count
          await updateDoc(doc(db, 'ads', id), { viewCount: increment(1) });

          // Fetch related ads in same category
          const relatedQuery = query(
            collection(db, 'ads'),
            where('category', '==', adData.category),
            where('status', '==', 'active'),
            limit(4)
          );
          const unsubscribe = onSnapshot(relatedQuery, (snapshot) => {
            setRelatedAds(snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as Ad))
              .filter(a => a.id !== id)
            );
          });
          return () => unsubscribe();
        } else {
          toast.error('Ad not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching ad:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-96 bg-gray-200 rounded-2xl mb-8"></div>
        <div className="h-10 bg-gray-200 w-3/4 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!ad) return null;

  // Determine if Ad should show Golden styles
  const isGold = ad.isFeatured === true || ad.isFeatured === "true" || ad.is_featured === true || ad.featured === true;

  // Identity Check: Is the viewer the owner or admin?
  const canSeePrivateInfo = user?.uid === ad.sellerUid || user?.email === 'hellisop0@gmail.com';

  // Format WhatsApp Link (Removes non-digits for the URL)
  const cleanPhone = ad.phoneNumber?.replace(/\D/g, '');
  const finalWhatsappLink = ad.whatsappLink?.startsWith('http') 
    ? ad.whatsappLink 
    : `https://wa.me/${cleanPhone}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ad.title,
        text: ad.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm text-gray-500">
          <Link to="/" className="hover:text-green-700">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/browse?category=${ad.category}`} className="hover:text-green-700 capitalize">
            {t(ad.category.toLowerCase())}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium truncate">{ad.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative group">
              <div className="aspect-video relative bg-black flex items-center justify-center">
                {ad.images && ad.images.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        src={ad.images[currentImageIndex]}
                        alt={ad.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </AnimatePresence>
                    {ad.images.length > 1 && (
                      <>
                        <button 
                          onClick={() => setCurrentImageIndex((p) => (p === 0 ? ad.images.length - 1 : p - 1))} 
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-all"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={() => setCurrentImageIndex((p) => (p === ad.images.length - 1 ? 0 : p + 1))} 
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-all"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 flex flex-col items-center">
                    <Info className="w-12 h-12 mb-2 opacity-20" /> No Photos Available
                  </div>
                )}
              </div>
            </div>

            {/* Ad Info Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-gray-900">{ad.title}</h1>
                  {isGold && (
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-md uppercase tracking-wider">
                      <Crown className="w-3.5 h-3.5 fill-white" />
                      Featured
                    </div>
                  )}
                </div>

                <div className="text-3xl font-black text-green-700 mb-4 flex items-center gap-2">
                  {formatPrice(ad.price)}
                  {isGold && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 animate-pulse" />}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
                  {ad.isUrgent && (
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-red-200">
                      URGENT SALE
                    </span>
                  )}
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-green-600" /> {ad.city}</span>
                  <span className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-green-600" /> {new Date(ad.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                  <Info className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Breed</div>
                  <div className="font-semibold text-gray-800">{ad.breed || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Age</div>
                  <div className="font-semibold text-gray-800">{ad.age || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                  <Weight className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Weight</div>
                  <div className="font-semibold text-gray-800">{ad.weight || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                  <Activity className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Health</div>
                  <div className="font-semibold text-gray-800">{ad.healthCondition || 'Healthy'}</div>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Description</h3>
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{ad.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* UNIQUE AD ID SECTION: Only visible to Owner/Admin */}
            {canSeePrivateInfo && (
              <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-blue-800 font-black text-xs uppercase tracking-widest mb-3">
                  <ShieldCheck className="w-4 h-4" />
                  Seller Dashboard
                </div>
                <div className="bg-white rounded-xl p-3 border border-blue-200 flex justify-between items-center shadow-inner">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Unique Ad ID</span>
                  <span className="text-sm font-mono font-black text-blue-700 selection:bg-blue-100">
                    #{ad.id.slice(-8).toUpperCase()}
                  </span>
                </div>
                <p className="text-[9px] text-blue-500 mt-2 text-center font-medium">
                  Visible only to you and the Admin
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-6 border-b pb-2">Seller Details</h3>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-xl shadow-inner">
                  {ad.sellerName?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-bold text-gray-900 flex items-center gap-1">
                    {ad.sellerName} 
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-xs text-gray-500 italic">Verified Mandi Seller</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <a 
                  href={finalWhatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" /> 
                  WhatsApp Seller
                </a>
                
                <a 
                  href={`tel:${ad.phoneNumber}`} 
                  className="w-full border-2 border-green-600 text-green-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition-all active:scale-95"
                >
                  <Phone className="w-5 h-5" /> 
                  Call Now
                </a>

                <button 
                  onClick={handleShare}
                  className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-green-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" /> Share this Ad
                </button>
              </div>
            </div>

            {/* Safety Tips Card */}
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
               <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                 <ShieldCheck className="w-4 h-4" /> Safety First
               </h4>
               <ul className="text-xs text-amber-800 space-y-2 list-disc pl-4">
                 <li>Never pay advance via Easypaisa or JazzCash.</li>
                 <li>Always visit the animal in person before buying.</li>
                 <li>Meet in a public place or well-known Mandi.</li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}