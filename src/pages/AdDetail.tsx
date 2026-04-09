import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Ad } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../lib/utils';
import { getOrCreateChat } from '../lib/chat-service';
import { 
  MapPin, Phone, MessageCircle, MessageSquare, ShieldCheck, Share2, 
  ChevronLeft, ChevronRight, Calendar, Weight, 
  Activity, Info, Crown, Star, Hash, EyeOff, ExternalLink
} from 'lucide-react';
import AdCard from '../components/AdCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AdDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [ad, setAd] = useState<any | null>(null);
  const [relatedAds, setRelatedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchAd = async () => {
      setLoading(true);
      try {
        const adDoc = await getDoc(doc(db, 'ads', id));
        if (adDoc.exists()) {
          const adData = { id: adDoc.id, ...adDoc.data() } as Ad;
          setAd(adData);
          
          // Increment View Count
          await updateDoc(doc(db, 'ads', id), { viewCount: increment(1) });

          // Fetch Related Ads
          const relatedQuery = query(
            collection(db, 'ads'),
            where('category', '==', adData.category),
            where('status', '==', 'active'),
            limit(5)
          );
          
          const unsubscribe = onSnapshot(relatedQuery, (snapshot) => {
            setRelatedAds(snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as Ad))
              .filter(a => a.id !== id)
              .slice(0, 4)
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

  // Permissions & Ownership
  const isOwner = user?.uid === ad?.sellerUid;
  const canSeePrivateInfo = isOwner || user?.email === 'hellisop0@gmail.com';
  const isGold = ad?.isFeatured || ad?.featured;

  // Contact Helpers
  const cleanPhone = ad?.phoneNumber?.replace(/\D/g, '');
  const finalWhatsappLink = ad?.whatsappLink?.startsWith('http') 
    ? ad.whatsappLink 
    : `https://wa.me/${cleanPhone}`;

  // UPDATED: Start Chat Logic
  const handleStartChat = async () => {
    if (!user) {
      toast.error("Please login to message the seller");
      return;
    }

    try {
      // We pass 5 arguments: buyerId, sellerId, adId, adTitle, sellerName
      const chatId = await getOrCreateChat(
        user.uid, 
        ad.sellerUid, 
        ad.id, 
        ad.title,
        ad.sellerName || "Seller" // Ensures the name shows in the chat header
      );
      
      // Navigate to Messages and pass the ID to open it
      navigate('/messages', { state: { selectedChatId: chatId } });
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error("Could not start chat. Please try again.");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: ad.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-8">
      <div className="h-96 bg-gray-200 rounded-3xl" />
      <div className="h-12 bg-gray-200 w-2/3 rounded-xl" />
      <div className="h-48 bg-gray-200 rounded-2xl" />
    </div>
  );

  if (!ad) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-xs font-bold uppercase tracking-wider text-gray-400">
          <Link to="/" className="hover:text-green-700">Mandi</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{ad.category}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Media & Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Gallery */}
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-200 relative">
              <div className="aspect-[16/10] relative bg-black flex items-center justify-center">
                {ad.images?.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        src={ad.images[currentImageIndex]}
                        className="max-h-full max-w-full object-contain"
                      />
                    </AnimatePresence>
                    {ad.images.length > 1 && (
                      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                        <button 
                          onClick={() => setCurrentImageIndex(p => (p === 0 ? ad.images.length - 1 : p - 1))}
                          className="p-3 bg-black/50 text-white rounded-2xl backdrop-blur-md pointer-events-auto hover:bg-green-600 transition-colors"
                        >
                          <ChevronLeft />
                        </button>
                        <button 
                          onClick={() => setCurrentImageIndex(p => (p === ad.images.length - 1 ? 0 : p + 1))}
                          className="p-3 bg-black/50 text-white rounded-2xl backdrop-blur-md pointer-events-auto hover:bg-green-600 transition-colors"
                        >
                          <ChevronRight />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-white/20 flex flex-col items-center">
                    <Info size={48} className="mb-2" />
                    <span>No Images Provided</span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-gray-900 leading-tight">{ad.title}</h1>
                    {isGold && (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                        <Crown size={12} fill="currentColor" /> Featured
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 font-bold">
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-green-600" /> {ad.city}</span>
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(ad.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-green-700">{formatPrice(ad.price)}</div>
                  <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">Negotiable</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'Breed', val: ad.breed, icon: Info },
                  { label: 'Age', val: ad.age, icon: Calendar },
                  { label: 'Weight', val: ad.weight, icon: Weight },
                  { label: 'Health', val: ad.healthCondition, icon: Activity },
                ].map((item, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-100 p-4 rounded-3xl text-center">
                    <item.icon className="w-5 h-5 mx-auto mb-2 text-green-600" />
                    <p className="text-[10px] uppercase font-black text-gray-400 mb-1">{item.label}</p>
                    <p className="font-bold text-gray-800 truncate">{item.val || 'N/A'}</p>
                  </div>
                ))}
              </div>

              <div className="prose max-w-none">
                <h3 className="text-xl font-black text-gray-900 mb-4">Seller Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{ad.description}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-6">
            
            {/* Dashboard (Owner/Admin Only) */}
            {canSeePrivateInfo && (
              <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-100">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter mb-4 opacity-80">
                  <ShieldCheck size={16} /> Management Tools
                </div>
                <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex justify-between items-center group cursor-pointer" onClick={() => { navigator.clipboard.writeText(ad.id); toast.success("ID Copied"); }}>
                  <div>
                    <p className="text-[9px] font-black uppercase text-blue-200">Ad Reference ID</p>
                    <p className="font-mono font-bold tracking-tighter uppercase">{ad.id}</p>
                  </div>
                  <Hash size={18} className="text-blue-300 group-hover:rotate-12 transition-transform" />
                </div>
                {ad.hidePhoneNumber && (
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl flex items-center gap-3 text-xs">
                    <EyeOff size={14} /> <span>Your number is hidden from buyers.</span>
                  </div>
                )}
              </div>
            )}

            {/* Contact Card */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-200 sticky top-24">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white flex items-center justify-center font-black text-xl shadow-lg">
                  {ad.sellerName?.charAt(0) || 'M'}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 leading-none mb-1">{ad.sellerName}</h3>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-tighter">Verified Seller</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Internal Chat: Trigger with sellerName */}
                {!isOwner && (
                  <button 
                    onClick={handleStartChat}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                  >
                    <MessageSquare size={20} /> Start Internal Chat
                  </button>
                )}

                {(!ad.hidePhoneNumber || canSeePrivateInfo) ? (
                  <>
                    <a 
                      href={finalWhatsappLink} target="_blank" rel="noreferrer"
                      className="w-full bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
                    >
                      <MessageCircle size={20} /> WhatsApp Seller
                    </a>
                    <a 
                      href={`tel:${ad.phoneNumber}`}
                      className="w-full border-2 border-gray-100 text-gray-900 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95"
                    >
                      <Phone size={20} /> Call Now
                    </a>
                  </>
                ) : (
                  <div className="p-6 bg-gray-50 rounded-3xl text-center border border-dashed border-gray-200">
                    <EyeOff size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-tight">Phone Number Hidden By Seller</p>
                  </div>
                )}

                <button onClick={handleShare} className="w-full pt-4 text-xs font-black text-gray-400 hover:text-green-600 transition-colors flex items-center justify-center gap-2">
                  <Share2 size={14} /> Share Listing
                </button>
              </div>
            </div>

            {/* Safety Reminder */}
            <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6">
              <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase mb-3">
                <ShieldCheck size={16} /> Secure Trading Tips
              </div>
              <ul className="text-[11px] text-amber-800 space-y-2 font-medium opacity-80 leading-relaxed">
                <li>• Inspect the animal in person at a verified Mandi.</li>
                <li>• Avoid making advance payments online.</li>
                <li>• Use the internal chat for better security records.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Listings */}
        {relatedAds.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-black text-gray-900 mb-8 px-2">Similar Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedAds.map(item => <AdCard key={item.id} ad={item} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}