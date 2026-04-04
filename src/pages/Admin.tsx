import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Ad, User, Transaction } from '../types';
import { 
  CheckCircle, XCircle, Shield, Users, FileText, 
  CreditCard, ExternalLink, ShieldCheck, AlertCircle, 
  Lock, Calendar, Star, Hash 
} from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Admin() {
  const { isAdmin } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ads' | 'users' | 'payments'>('ads');
  
  const [featuredSelections, setFeaturedSelections] = useState<{[key: string]: boolean}>({});
  const [timeFilter, setTimeFilter] = useState<'all' | '7days' | 'month'>('all');

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isUnlocked) return;

    let adsQuery = query(collection(db, 'ads'), where('status', '!=', 'rejected'));

    if (timeFilter !== 'all') {
      const now = new Date();
      const daysToSubtract = timeFilter === '7days' ? 7 : 30;
      const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract));
      
      adsQuery = query(
        collection(db, 'ads'), 
        where('status', '!=', 'rejected'),
        where('createdAt', '>=', Timestamp.fromDate(cutoffDate))
      );
    }

    const unsubAds = onSnapshot(adsQuery, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
    });

    const unsubTrans = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    });

    return () => {
      unsubAds();
      unsubUsers();
      unsubTrans();
    };
  }, [isUnlocked, timeFilter]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Using your updated credentials
    if (email === "z@gmail.com" && password === "admin1234") {
      setIsUnlocked(true);
      toast.success('Dashboard Unlocked');
    } else {
      toast.error('Access Denied');
    }
  };

  const handleToggleFeatured = async (adId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { is_featured: !currentStatus });
      toast.success(!currentStatus ? 'Ad Promoted' : 'Featured Removed');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleApproveAd = async (adId: string, isFeatured: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { 
        status: 'active',
        is_featured: isFeatured 
      });
      toast.success('Ad Approved!');
      setFeaturedSelections(prev => {
        const newState = {...prev};
        delete newState[adId];
        return newState;
      });
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const handleRejectAd = async (adId: string) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { status: 'rejected' });
      toast.success('Ad Rejected');
    } catch (error) {
      toast.error('Rejection failed');
    }
  };

  const handleVerifyUser = async (userId: string, isVerified: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isVerified: !isVerified });
      toast.success(isVerified ? 'Verification Removed' : 'User Verified');
    } catch (error) {
      toast.error('User update failed');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-700">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
            <p className="text-gray-500 text-sm mt-2">Manage CITYCARE Platform</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input 
              type="email" 
              placeholder="Admin Email" 
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none transition-all" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 outline-none transition-all" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-colors">
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-700" /> Admin Dashboard
          </h1>
          <button onClick={() => setIsUnlocked(false)} className="text-xs bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full font-medium transition-colors">
            Lock Panel
          </button>
        </div>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('ads')} 
            className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all", 
              activeTab === 'ads' ? "bg-green-700 text-white shadow-lg shadow-green-100" : "bg-white border text-gray-600 hover:bg-gray-50")}
          >
            <FileText className="w-4 h-4" /> Ads Management
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all", 
              activeTab === 'users' ? "bg-green-700 text-white shadow-lg shadow-green-100" : "bg-white border text-gray-600 hover:bg-gray-50")}
          >
            <Users className="w-4 h-4" /> User Base
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* ADS MANAGEMENT TABLE */}
          {activeTab === 'ads' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Unique ID</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Ad Details</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Seller</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-center">Featured</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Status</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ads.map(ad => (
                    <tr key={ad.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-mono font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded">
                          #{ad.id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={ad.images?.[0]} className="w-12 h-12 rounded-lg object-cover bg-gray-100" alt="" />
                          <div>
                            <div className="font-bold text-sm flex items-center gap-1">
                              {ad.title} {ad.is_featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">{ad.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">{ad.sellerName}</td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                          checked={ad.status === 'pending' ? !!featuredSelections[ad.id] : !!ad.is_featured}
                          onChange={(e) => {
                            if (ad.status === 'pending') {
                              setFeaturedSelections({...featuredSelections, [ad.id]: e.target.checked});
                            } else {
                              handleToggleFeatured(ad.id, !!ad.is_featured);
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider", 
                          ad.status === 'active' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                          {ad.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center space-x-2">
                          {ad.status === 'pending' && (
                            <button onClick={() => handleApproveAd(ad.id, !!featuredSelections[ad.id])} className="p-2 text-green-600 hover:bg-green-100 rounded-lg border border-green-100 transition-colors">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button onClick={() => handleRejectAd(ad.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <XCircle className="w-5 h-5" />
                          </button>
                          <Link to={`/ad/${ad.id}`} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                            <ExternalLink className="w-5 h-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* USER BASE TABLE */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">User Profile</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Contact Email</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Account Role</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-center">Verify Seller</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-right">Partial UID</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.length > 0 ? users.map(u => (
                    <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center font-bold text-green-700 border border-green-300 shadow-sm">
                            {u.displayName?.charAt(0) || u.email?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="font-bold text-sm text-gray-900">{u.displayName || 'Anonymous User'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">
                          {u.role || 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleVerifyUser(u.uid, !!u.isVerified)}
                          className={cn(
                            "p-2 rounded-xl transition-all active:scale-90",
                            u.isVerified ? "text-blue-600 bg-blue-50 border border-blue-100" : "text-gray-300 border border-transparent hover:bg-gray-100"
                          )}
                        >
                          <ShieldCheck className={cn("w-6 h-6", u.isVerified && "fill-blue-600/10")} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-[10px] font-mono text-gray-300">
                           {u.uid.slice(0, 10)}...
                         </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <Users className="w-12 h-12 mb-2" />
                          <p className="font-bold text-lg">No Users in Database</p>
                          <p className="text-sm">Verify your Firestore 'users' collection exists.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}