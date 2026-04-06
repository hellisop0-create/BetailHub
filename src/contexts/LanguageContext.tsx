import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations } from '../types';

const translations: Translations = {
  appName: { en: 'Pakistan Livestock Mandi', ur: 'پاکستان مویشی منڈی' },
  hero: { en: 'Pakistan Livestock Mandi', ur: 'پاکستان میں سب کچھ تلاش کریں۔'},
  tagline: { en: 'Buy & Sell Livestock Easily', ur: 'مویشی خریدیں اور فروخت کریں آسانی سے' },
  search: { en: 'Search livestock...', ur: 'مویشی تلاش کریں...' },
  postAd: { en: 'Post Ad', ur: 'اشتہار لگائیں' },
  login: { en: 'Login', ur: 'لاگ ان' },
  logout: { en: 'Logout', ur: 'لاگ آؤٹ' },
  categories: { en: 'Categories', ur: 'اقسام' },
  featured: { en: 'Featured Ads', ur: 'نمایاں اشتہارات' },
  latest: { en: 'Latest Listings', ur: 'تازہ ترین اشتہارات' },
  price: { en: 'Price', ur: 'قیمت' },
  location: { en: 'Location', ur: 'مقام' },
  whatsapp: { en: 'WhatsApp', ur: 'واٹس ایپ' },
  call: { en: 'Call', ur: 'کال کریں' },
  viewDetails: { en: 'View Details', ur: 'تفصیلات دیکھیں' },
  urgent: { en: 'URGENT', ur: 'فوری' },
  verified: { en: 'Verified', ur: 'تصدیق شدہ' },
  myAds: { en: 'My Ads', ur: 'میرے اشتہارات' },
  favorites: { en: 'Favorites', ur: 'پسندیدہ' },
  profile: { en: 'Profile', ur: 'پروفائل' },
  admin: { en: 'Admin', ur: 'ایڈمن' },
  cow: { en: 'Cow', ur: 'گائے' },
  buffalo: { en: 'Buffalo', ur: 'بھینس' },
  goat: { en: 'Goat', ur: 'بکری' },
  sheep: { en: 'Sheep', ur: 'بھیڑ' },
  camel: { en: 'Camel', ur: 'اونٹ' },
  others: { en: 'Others', ur: 'دیگر' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
