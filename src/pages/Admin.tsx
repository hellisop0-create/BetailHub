import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Trash2, ShieldCheck, ShieldAlert, ExternalLink,
  Hash, LayoutDashboard, Users, Star, CheckCircle2, XCircle, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ads' | 'users'>('ads');

  const isAdmin = user?.email === 'hellisop0@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })));
    });

    return () => { unsubAds(); unsubUsers(); };
  }, [isAdmin]);

  // --- ACTIONS ---
  const handleUpdateAdStatus = async (adId: string, status: 'active' | 'declined') => {
    try {
      await updateDoc(doc(db, 'ads', adId), { status });
      toast.success(`Ad marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleToggleFeatured = async (adId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { isFeatured: !currentStatus });
      toast.success(!currentStatus ? 'Ad Featured (Gold)' : 'Featured removed');
    } catch (error) {
      toast.error('Feature toggle failed');
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm('PERMANENT DELETE? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'ads', adId));
      toast.success('Ad wiped from database');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-green-700 uppercase tracking-widest">Accessing CityCare Secure Layer...</div>;
  if (!isAdmin) return <div className="p-20 text-center font-black text-red-600 uppercase">Unauthorized Access Detected.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">ADMIN PANEL</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Mandi Operations & Verification</p>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm w-full md:w-auto">
            <button onClick={() => setActiveTab('ads')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${activeTab === 'ads' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'text-gray-400'}`}>
              <LayoutDashboard size={14} /> Listings ({ads.length})
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${activeTab === 'users' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'text-gray-400'}`}>
              <Users size={14} /> Sellers ({users.length})
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="p-5">{activeTab === 'ads' ? 'Listing Thumbnail & ID' : 'User Profile'}</th>
                <th className="p-5">{activeTab === 'ads' ? 'Seller & Price' : 'Email Address'}</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeTab === 'ads' ? (
                ads.map(ad => (
                  <tr key={ad.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm relative">
                          {ad.images?.[0] ? (
                            <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon size={16} /></div>
                          )}
                          {ad.isFeatured && <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-400 rounded-br-md shadow-sm"></div>}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm leading-tight mb-1">{ad.title}</div>
                          <div className="flex items-center gap-1">
                            <Hash size={10} className="text-blue-500" />
                            <span className="text-[10px] font-mono font-black text-blue-600 uppercase leading-none">{ad.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="text-xs font-bold text-gray-800">{ad.sellerName || 'Anonymous'}</div>
                      <div className="text-[10px] text-green-600 font-black mt-0.5">Rs {Number(ad.price).toLocaleString()}</div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${ad.status === 'active' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                          {ad.status || 'Pending'}
                        </span>
                        {ad.isFeatured && (
                          <span className="flex items-center gap-1 bg-yellow-400 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">
                            <Star size={8} fill="currentColor" /> GOLD
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-5 text-right flex justify-end gap-1">
                      <button onClick={() => handleUpdateAdStatus(ad.id, 'active')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle2 size={20} /></button>
                      <button onClick={() => handleUpdateAdStatus(ad.id, 'declined')} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"><XCircle size={20} /></button>
                      <button onClick={() => handleToggleFeatured(ad.id, ad.isFeatured)} className={`p-2 rounded-lg ${ad.isFeatured ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400'}`}><Star size={20} fill={ad.isFeatured ? 'white' : 'none'} /></button>
                      <Link to={`/ad/${ad.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ExternalLink size={20} /></Link>
                      <button onClick={() => handleDeleteAd(ad.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={20} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                users.map(u => (
                  <tr key={u.uid} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600 border border-blue-200 overflow-hidden flex-shrink-0">
                        {u.photoURL ? (
                          <img 
                            src={u.photoURL} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = u.displayName?.charAt(0) || 'U';
                            }}
                          />
                        ) : (
                          u.displayName?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm leading-tight">{u.displayName || 'Guest User'}</div>
                        <div className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-tighter">{u.uid}</div>
                      </div>
                    </td>
                    <td className="p-5 text-sm text-gray-500 font-medium">{u.email}</td>
                    <td className="p-5">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${u.isVerified ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {u.isVerified ? 'VERIFIED SELLER' : 'STANDARD'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}