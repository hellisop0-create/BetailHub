import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, limit, onSnapshot, orderBy } from 'firebase/firestore';

export default function PromotionalBanner() {
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    // Get the latest active ad
    // Change 'active_ads' to 'advertisements'
const q = query(
  collection(db, 'advertisements'), 
  where('isActive', '==', true),
  orderBy('createdAt', 'desc'),
  limit(1)
);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setAd({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setAd(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!ad) return null;

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <a 
  href={ad.targetUrl && ad.targetUrl.trim() !== "" ? ad.targetUrl : "#"} 
  target="_blank" 
  rel="sponsored noopener noreferrer"
  className="block group relative overflow-hidden rounded-2xl shadow-xl transition-all hover:scale-[1.01]"
>
        <img 
          src={ad.imageUrl} 
          alt="Sponsored Advertisement" 
          className="w-full h-auto object-cover max-h-[300px]"
        />
        {/* Professional "Ad" Badge */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-1 rounded uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          Sponsored
        </div>
      </a>
    </div>
  );
}