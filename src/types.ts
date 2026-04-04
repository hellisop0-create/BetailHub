export type Category = 'Cow' | 'Buffalo' | 'Goat' | 'Sheep' | 'Camel' | 'Others';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  favoriteAds?: string[]; // This is the crucial one for your heart icons!
  role?: 'admin' | 'user';
  isVerified?: boolean;
  phoneNumber?: string;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  breed: string;
  age: string;
  weight: string;
  healthCondition: string;
  images: string[];
  video?: string;
  city: string;
  area: string;
  phoneNumber: string;
  whatsappLink: string;
  sellerUid: string;
  sellerName: string;
  status: 'pending' | 'active' | 'rejected' | 'expired';
  isFeatured: boolean;
  isUrgent: boolean;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  adId: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  adId: string;
  amount: number;
  promotionType: 'featured' | 'urgent' | 'spotlight';
  paymentMethod: 'Easypaisa' | 'JazzCash';
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export type Language = 'en' | 'ur';

export interface Translations {
  [key: string]: {
    en: string;
    ur: string;
  };
}
