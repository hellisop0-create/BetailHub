import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trash2, LayoutDashboard, Users, Star, 
  CheckCircle2, XCircle, ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_EMAILS = ['saadatali1403@gmail.com', 'hellisop0@gmail.com', 'mehreensaadat2@gmail.com'].map(e => e.toLowerCase().trim());

export default function Admin() {
  const { user, isAdmin: isAuthAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ads' | 'users'>('ads');

  const currentUserEmail = user?.email?.toLowerCase().trim();
  const isAdmin = isAuthAdmin || (currentUserEmail && ADMIN_EMAILS.includes(currentUserEmail));

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/admin-login');
  }, [isAdmin, authLoading, navigate]);

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

  const handleUpdateAdStatus = async (adId: string, status: 'active' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'ads', adId), { status });
      toast.success(`Listing ${status}`);
    } catch (error) { toast.error('Failed to update status'); }
  };

  const handleToggleFeatured = async (adId: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { isFeatured: !current });
      toast.success(current ? 'Removed from featured' : 'Marked as featured');
    } catch (error) { toast.error('Failed to update featured status'); }
  };

  const toggleUserVerification = async (uid: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isVerified: !current });
      toast.success(current ? 'User unverified' : 'User verified');
    } catch (error) { toast.error('Failed to update user'); }
  };

  const handleDelete = async (type: 'ads' | 'users', id: string) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, type, id));
      toast.success('Deleted successfully');
    } catch (error) { toast.error('Failed to delete'); }
  };

  if (authLoading) return <div className="p-10 text-center font-bold text-gray-400">LOADING...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Admin <span className="text-blue-600">Portal</span></h1>
          
          <div className="flex bg-white p-1 rounded-xl border shadow-sm">
            <button onClick={() => setActiveTab('ads')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-xs uppercase transition-all ${activeTab === 'ads' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>
              <LayoutDashboard size={14} /> Listings
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-xs uppercase transition-all ${activeTab === 'users' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>
              <Users size={14} /> Sellers
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="p-5">{activeTab === 'ads' ? 'Item' : 'User'}</th>
                <th className="p-5">Status / Info</th>
                <th className="p-5 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeTab === 'ads' ? ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5 flex items-center gap-4">
                    <img src={ad.images?.[0]} className="w-12 h-10 rounded object-cover border bg-gray-100" alt="" />
                    <div>
                      <p className="font-bold text-sm uppercase truncate max-w-[180px]">{ad.title}</p>
                      <p className="text-green-600 font-black text-[10px]">Rs {Number(ad.price).toLocaleString()}</p>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${ad.status === 'active' ? 'bg-green-100 text-green-700' : ad.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {ad.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleToggleFeatured(ad.id, ad.isFeatured)} className={`p-2 rounded-lg transition-all ${ad.isFeatured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:bg-gray-50'}`} title="Feature"><Star size={18} fill={ad.isFeatured ? "currentColor" : "none"} /></button>
                      <button onClick={() => handleUpdateAdStatus(ad.id, 'active')} className="p-2 text-green-500 hover:bg-green-50 rounded-lg" title="Approve"><CheckCircle2 size={18} /></button>
                      <button onClick={() => handleUpdateAdStatus(ad.id, 'rejected')} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg" title="Reject"><XCircle size={18} /></button>
                      <button onClick={() => handleDelete('ads', ad.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              )) : users.map((u) => (
                <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs uppercase">{u.displayName?.charAt(0) || 'U'}</div>
                    <span className="font-bold text-sm">{u.displayName || 'Seller'}</span>
                  </td>
                  <td className="p-5 text-xs text-gray-400 italic">{u.email}</td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toggleUserVerification(u.uid, u.isVerified)} className={`p-2 rounded-lg transition-all ${u.isVerified ? 'text-blue-500 bg-blue-50' : 'text-gray-300 hover:bg-gray-50'}`} title="Verify User"><ShieldCheck size={18} /></button>
                      <button onClick={() => handleDelete('users', u.uid)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Delete Seller"><Trash2 size={18} /></button>
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