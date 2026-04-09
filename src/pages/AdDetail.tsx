import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, cn } from '../lib/utils';
// Added getOrCreateChat import
import { getOrCreateChat } from '../lib/chat-service';
import { 
  MapPin, Phone, MessageCircle, MessageSquare, ShieldCheck, Share2, 
  ChevronLeft, ChevronRight, Flag, Calendar, Weight, 
  Activity, Info, Crown, Star, Hash, EyeOff, X, Maximize2 
} from 'lucide-react';
import AdCard from '../components/AdCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AdDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ad, setAd] = useState<any | null>(null);
  const [relatedAds, setRelatedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
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
          
          await updateDoc(doc(db, 'ads', id), { viewCount: increment(1) });

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

  // Lock scroll when fullscreen is active
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isFullScreen]);

  const handleStartChat = async () => {
    if (!user) {
      toast.error("Please login to message the seller");
      return;
    }

    try {
      const chatId = await getOrCreateChat(
        user.uid, 
        ad.sellerUid, 
        ad.id, 
        ad.title,
        ad.sellerName // <--- Add this 5th argument
      );
      navigate('/messages', { state: { selectedChatId: chatId } });
    } catch (error) {
      console.error("Chat error:", error); // Useful for debugging
      toast.error("Could not start chat. Please try again.");
    }
  };

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

  const isGold = ad.isFeatured === true || ad.isFeatured === "true" || ad.is_featured === true || ad.featured === true;
  const isOwner = user?.uid === ad.sellerUid;
  const canSeePrivateInfo = isOwner || user?.email === 'hellisop0@gmail.com';

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Unique ID copied!');
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
              <div 
                className="aspect-video relative bg-black flex items-center justify-center cursor-zoom-in"
                onClick={() => ad.images && ad.images.length > 0 && setIsFullScreen(true)}
              >
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
                    
                    {/* Expand Hint */}
                    <div className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-5 h-5" />
                    </div>

                    {ad.images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((p) => (p === 0 ? ad.images.length - 1 : p - 1));
                          }} 
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-all z-10"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((p) => (p === ad.images.length - 1 ? 0 : p + 1));
                          }} 
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-all z-10"
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
            {canSeePrivateInfo && (
              <div className="bg-blue-600 border-2 border-blue-400 rounded-2xl p-5 shadow-lg text-white">
                <div className="flex items-center gap-2 text-blue-100 font-black text-xs uppercase tracking-widest mb-3">
                  <ShieldCheck className="w-4 h-4" />
                  Management Dashboard
                </div>
                <div 
                  onClick={() => copyToClipboard(ad.id)}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 flex justify-between items-center cursor-pointer hover:bg-white/20 transition-all shadow-inner"
                >
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-blue-200 uppercase">Unique Ad ID</span>
                    <span className="text-sm font-mono font-black tracking-wider uppercase">
                      {ad.id}
                    </span>
                  </div>
                  <Hash className="w-4 h-4 text-blue-200" />
                </div>
                {ad.hidePhoneNumber && (
                  <div className="mt-3 flex items-center gap-2 text-[10px] bg-red-500/20 p-2 rounded-lg border border-red-400/30">
                    <EyeOff className="w-3 h-3" />
                    <span>Your phone number is currently <strong>Hidden</strong> from buyers.</span>
                  </div>
                )}
                <p className="text-[9px] text-blue-100 mt-3 text-center font-medium italic opacity-80">
                  Visible only to you and the Admin
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-6 border-b pb-2">Seller Details</h3>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-xl shadow-inner border border-green-200">
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
                {/* Internal Chat Button */}
                {!isOwner && (
                  <button 
                    onClick={handleStartChat}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                  >
                    <MessageSquare className="w-5 h-5" /> 
                    Chat with Seller
                  </button>
                )}

                {(!ad.hidePhoneNumber || canSeePrivateInfo) ? (
                  <>
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
                  </>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <EyeOff className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">Contact Hidden</p>
                    <p className="text-[11px] text-gray-500 leading-tight">The seller has chosen to keep their phone number private.</p>
                  </div>
                )}

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
                  <ShieldCheck className="w-4 h-4 text-amber-600" /> Safety First
                </h4>
                <ul className="text-xs text-amber-800 space-y-2 list-disc pl-4">
                  <li>Never pay advance via Easypaisa or JazzCash.</li>
                  <li>Always visit the animal in person before buying.</li>
                  <li>Meet in a public place or well-known Mandi.</li>
                </ul>
            </div>
          </div>
        </div>

        {/* Related Ads Section */}
        {relatedAds.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedAds.map((relatedAd) => (
                <AdCard key={relatedAd.id} ad={relatedAd} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- WIDE SCREEN MODAL --- */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setIsFullScreen(false)}
          >
            <button 
              className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[1000]"
              onClick={() => setIsFullScreen(false)}
            >
              <X className="w-8 h-8" />
            </button>

            {ad.images.length > 1 && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((p) => (p === 0 ? ad.images.length - 1 : p - 1));
                  }} 
                  className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all z-[1000]"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((p) => (p === ad.images.length - 1 ? 0 : p + 1));
                  }} 
                  className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all z-[1000]"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={ad.images[currentImageIndex]}
              alt={ad.title}
              className="max-w-full max-h-full object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
              {currentImageIndex + 1} / {ad.images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}