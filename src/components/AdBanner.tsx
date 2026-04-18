import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

const AdBanner = ({ location }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const adsRef = collection(db, "advertisements");
        const q = query(
          adsRef,
          where("location", "==", location),
          where("isActive", "==", true)
        );

        const querySnapshot = await getDocs(q);
        const adsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (adsList.length > 0) {
          const randomAd = adsList[Math.floor(Math.random() * adsList.length)];
          setAd(randomAd);
        }
      } catch (error) {
        console.error("Error fetching ad:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [location]);

  const handleAdClick = async () => {
    if (ad) {
      const adRef = doc(db, "advertisements", ad.id);
      await updateDoc(adRef, {
        clickCount: increment(1)
      });
      window.open(ad.targetUrl, '_blank');
    }
  };

  if (loading || !ad) return null;

  return (
    <button
      onClick={handleAdClick}
      /* 1. Remove w-full
         2. Add max-w-full to prevent it from going off-screen
         3. mx-auto keeps the whole button centered in your page
      */
      className="max-w-full h-full relative rounded-xl overflow-hidden bg-white flex items-center justify-center transition-transform active:scale-[0.98] mx-auto"
    >
      <picture className="flex items-center justify-center">
        {/* Desktop Image */}
        <source 
          media="(min-width: 768px)" 
          srcSet={ad.imageUrl} 
        />
        
        {/* Mobile Image */}
        <img
          src={ad.mobileImageUrl || ad.imageUrl}
          alt={ad.title || "Advertisement"}
          /* h-full: Fills the 128px/160px height.
             w-auto: Lets the width expand naturally so nothing is cropped.
             max-w-full: Stops it if it hits the edge of the phone screen.
          */
          className="h-full w-auto max-w-full object-contain block"
        />
      </picture>

      <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-sm text-[10px] text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
        Ad
      </div>
    </button>
  );
};

export default AdBanner;