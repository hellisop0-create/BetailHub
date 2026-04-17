import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Trash2, LayoutDashboard, Users, Star, 
  CheckCircle2, XCircle, ExternalLink, Search, BadgeCheck, Wallet
} from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_EMAILS = [
  'saadatali1403@gmail.com',
  'hellisop0@gmail.com',
  'chopan.com.pk@gmail.com',
  'mehreensaadat2@gmail.com'
].map(email => email.toLowerCase().trim());

export default function Admin() {
  const { user, isAdmin: isAuthAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ads' | 'users' | 'payments'>('ads');
  const [searchId, setSearchId] = useState('');

  const currentUserEmail = user?.email?.toLowerCase().trim();
  const isAdmin = isAuthAdmin || (currentUserEmail && ADMIN_EMAILS.includes(currentUserEmail));

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin-login');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubAds = onSnapshot(collection(db, 'ads'), (s) => 
      setAds(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => 
      setUsers(s.docs.map(d => ({ uid: d.id, ...d.data() })))
    );
    const unsubPayments = onSnapshot(query(collection(db, 'payments'), orderBy('createdAt', 'desc')), (s) => 
      setPayments(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubAds(); unsubUsers(); unsubPayments(); };
  }, [isAdmin]);

  const filteredAds = useMemo(() => {
    if (!searchId.trim()) return ads;
    return ads.filter(ad => ad.id.toLowerCase().includes(searchId.toLowerCase().trim()));
  }, [ads, searchId]);

  const handleUpdateStatus = async (id: string, s: 'active' | 'declined') => {
    try { 
      await updateDoc(doc(db, 'ads', id), { status: s }); 
      toast.success(`Ad marked as ${s}`); 
    } catch { toast.error('Update failed'); }
  };

  const handleApprovePayment = async (payId: string, adId: string) => {
    try {
      await updateDoc(doc(db, 'payments', payId), { status: 'approved' });
      await updateDoc(doc(db, 'ads', adId), { isFeatured: true, status: 'active' });
      toast.success('Payment Approved & Ad Featured');
    } catch { toast.error('Approval failed'); }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', id), { isFeatured: !currentStatus });
      toast.success(!currentStatus ? 'Featured' : 'Unfeatured');
    } catch { toast.error('Failed to toggle feature'); }
  };

  const handleToggleVerified = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isVerified: !currentStatus });
      toast.success(!currentStatus ? 'Seller Verified' : 'Verification Removed');
    } catch { toast.error('Failed to update verification'); }
  };

  const handleDelete = async (type: 'ads' | 'users' | 'payments', id: string) => {
    if (!window.confirm('Are you sure? This is permanent.')) return;
    try {
      await deleteDoc(doc(db, type, id));
      toast.success('Deleted successfully');
    } catch { toast.error('Delete failed'); }
  };

  if (authLoading) return <div className="p-10 text-center font-bold text-green-700 uppercase">Loading Secure Layer...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 uppercase">Admin Panel</h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Operations Dashboard</p>
            </div>

            {activeTab === 'ads' && (
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text"
                  placeholder="SEARCH BY AD ID..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase focus:ring-2 focus:ring-green-500 focus:outline-none shadow-sm"
                />
              </div>
            )}
          </div>

          <div className="flex bg-white p-1 rounded-xl border shadow-sm w-full overflow-x-auto">
            <button onClick={() => setActiveTab('ads')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === 'ads' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>
              <LayoutDashboard size={14} /> Listings ({filteredAds.length})
            </button>
            <button onClick={() => setActiveTab('payments')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === 'payments' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>
              <Wallet size={14} /> Payments ({payments.filter(p => p.status === 'pending').length})
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === 'users' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>
              <Users size={14} /> Sellers ({users.length})
            </button>
          </div>
        </div>

        {/* MOBILE LIST */}
        <div className="block lg:hidden space-y-3">
          {activeTab === 'ads' && filteredAds.map(ad => (
            <div key={ad.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex gap-3 items-start mb-3">
                <img src={ad.images?.[0]} className="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0 border" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{ad.title}</h3>
                  <p className="text-[9px] text-blue-500 font-mono mb-1">ID: {ad.id}</p>
                  <p className="text-green-600 font-black text-xs">Rs {Number(ad.price).toLocaleString()}</p>
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className={`mt-1 text-[8px] font-black px-2 py-0.5 rounded border uppercase ${ad.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                      {ad.status || 'Pending'}
                    </span>
                    {ad.isFeatured && <span className="mt-1 bg-yellow-400 text-white text-[8px] font-black px-2 py-0.5 rounded border border-yellow-500 uppercase">Gold</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t justify-between items-center">
                <div className="flex gap-1">
                  <button onClick={() => handleUpdateStatus(ad.id, 'active')} className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={18} /></button>
                  <button onClick={() => handleUpdateStatus(ad.id, 'declined')} className="p-2 bg-orange-50 text-orange-600 rounded-lg"><XCircle size={18} /></button>
                  <button onClick={() => handleToggleFeatured(ad.id, ad.isFeatured)} className={`p-2 rounded-lg ${ad.isFeatured ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-50 text-gray-400'}`}><Star size={18} /></button>
                </div>
                <div className="flex gap-1">
                  <Link to={`/ad/${ad.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ExternalLink size={18} /></Link>
                  <button onClick={() => handleDelete('ads', ad.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'payments' && payments.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-gray-900">{p.sellerEmail}</p>
                  <p className="text-[9px] text-blue-500 font-mono">TID: {p.tid}</p>
                </div>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${p.paymentPlatform === 'JazzCash' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                  {p.paymentPlatform}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <p className="text-xs font-black">Rs {p.amount}</p>
                <div className="flex gap-2">
                  {p.status === 'pending' && (
                    <button onClick={() => handleApprovePayment(p.id, p.adId)} className="p-2 bg-green-600 text-white rounded-lg"><CheckCircle2 size={16} /></button>
                  )}
                  <button onClick={() => handleDelete('payments', p.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'users' && users.map(u => (
              <div key={u.uid} className="bg-white p-4 rounded-xl border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(u.photoURL || u.image) ? (
                    <img src={u.photoURL || u.image} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase text-xs">
                      {u.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <div className="text-sm font-bold truncate max-w-[120px] flex items-center gap-1">
                      {u.displayName || 'Seller'}
                      {u.isVerified && <BadgeCheck size={14} className="text-blue-500 fill-blue-50" />}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[120px]">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleVerified(u.uid, u.isVerified)} 
                    className={`p-2 rounded-lg transition-colors ${u.isVerified ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                  >
                    <BadgeCheck size={18} />
                  </button>
                  <button onClick={() => handleDelete('users', u.uid)} className="text-red-400 p-2"><Trash2 size={18} /></button>
                </div>
              </div>
          ))}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden lg:block bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="p-5">{activeTab === 'ads' ? 'Listing' : activeTab === 'payments' ? 'Seller / TID' : 'User'}</th>
                <th className="p-5">{activeTab === 'ads' ? 'Price' : activeTab === 'payments' ? 'Platform' : 'Email'}</th>
                <th className="p-5">{activeTab === 'payments' ? 'Amount' : 'Status'}</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeTab === 'ads' && filteredAds.map(ad => (
                <tr key={ad.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <img src={ad.images?.[0]} className="w-12 h-10 rounded object-cover border" />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{ad.title}</span>
                        <span className="text-[10px] text-blue-500 font-mono">ID: {ad.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-sm font-black text-green-600">Rs {Number(ad.price).toLocaleString()}</td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${ad.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {ad.status || 'pending'}
                      </span>
                      {ad.isFeatured && <span className="bg-yellow-400 text-white text-[9px] font-black px-2 py-0.5 rounded border border-yellow-500 uppercase flex items-center gap-1"><Star size={8} fill="white" /> Gold</span>}
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleUpdateStatus(ad.id, 'active')} className="text-green-600 p-1 hover:bg-green-50 rounded"><CheckCircle2 size={18} /></button>
                      <button onClick={() => handleUpdateStatus(ad.id, 'declined')} className="text-orange-600 p-1 hover:bg-orange-50 rounded"><XCircle size={18} /></button>
                      <button onClick={() => handleToggleFeatured(ad.id, ad.isFeatured)} className={`${ad.isFeatured ? 'text-yellow-500' : 'text-gray-300'} p-1 hover:bg-yellow-50 rounded`}><Star size={18} fill={ad.isFeatured ? 'currentColor' : 'none'} /></button>
                      <Link to={`/ad/${ad.id}`} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><ExternalLink size={18} /></Link>
                      <button onClick={() => handleDelete('ads', ad.id)} className="text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'payments' && payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{p.sellerEmail}</span>
                      <span className="text-[10px] text-blue-500 font-mono">TID: {p.tid}</span>
                    </div>
                  </td>
                  <td className="p-5 text-sm">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${p.paymentPlatform === 'JazzCash' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                      {p.paymentPlatform}
                    </span>
                  </td>
                  <td className="p-5 text-sm font-black text-gray-700">Rs {p.amount}</td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      {p.status === 'pending' && (
                        <button onClick={() => handleApprovePayment(p.id, p.adId)} className="text-green-600 p-1 hover:bg-green-50 rounded" title="Approve"><CheckCircle2 size={18} /></button>
                      )}
                      <button onClick={() => handleDelete('payments', p.id)} className="text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'users' && users.map(u => (
                <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      {(u.photoURL || u.image || u.profilePic) ? (
                        <img 
                          src={u.photoURL || u.image || u.profilePic} 
                          referrerPolicy="no-referrer" 
                          className="w-10 h-10 rounded-full object-cover border shadow-sm" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase text-xs">
                          {u.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <span className="font-bold text-sm text-gray-900 flex items-center gap-1">
                        {u.displayName || 'Seller'}
                        {u.isVerified && <BadgeCheck size={14} className="text-blue-500 fill-blue-50" />}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 text-sm text-gray-500">{u.email}</td>
                  <td className="p-5">
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 uppercase">Seller</span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleToggleVerified(u.uid, u.isVerified)} 
                        className={`p-1 rounded hover:bg-blue-50 ${u.isVerified ? 'text-blue-600' : 'text-gray-300'}`}
                        title="Toggle Verification"
                      >
                        <BadgeCheck size={18} />
                      </button>
                      <button onClick={() => handleDelete('users', u.uid)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}