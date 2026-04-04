import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; 
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, ShieldCheck, ShieldAlert, ExternalLink, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ads' | 'users'>('ads');

  useEffect(() => {
    if (!isAdmin) return;
    const unsubAds = onSnapshot(collection(db, 'ads'), (s) => setAds(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map(d => ({ uid: d.id, ...d.data() }))));
    return () => { unsubAds(); unsubUsers(); };
  }, [isAdmin]);

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;
    try {
      await deleteDoc(doc(db, 'ads', adId));
      toast.success('Ad deleted successfully');
    } catch (error) {
      toast.error('Failed to delete ad');
    }
  };

  const toggleUserVerification = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: !currentStatus
      });
      toast.success(`User ${!currentStatus ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm text-center">
          <h2 className="text-xl font-bold mb-4 text-red-600">🔒 Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have administrative privileges to view this page.</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🛡️ Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage platform content and users</p>
        </div>
        <div className="flex gap-2 bg-gray-200 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('ads')} 
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'ads' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Ads ({ads.length})
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'users' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Users ({users.length})
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{activeTab === 'ads' ? 'Ad Details' : 'User Profile'}</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{activeTab === 'ads' ? 'Seller' : 'Contact'}</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeTab === 'ads' ? (
                ads.length > 0 ? ads.map(ad => (
                  <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{ad.title}</span>
                        <span className="text-xs text-gray-400 font-mono">ID: {ad.id}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{ad.sellerName || 'Anonymous'}</span>
                        <span className="text-xs text-gray-400">{ad.category}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Link 
                          to={`/ad/${ad.id}`} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Ad"
                        >
                          <ExternalLink size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Ad"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-gray-400">No ads found</td>
                  </tr>
                )
              ) : (
                users.length > 0 ? users.map(u => (
                  <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserIcon size={20} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{u.displayName || 'Anonymous User'}</span>
                          <span className="text-xs text-gray-400 font-mono">{u.uid.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600">{u.email}</span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleUserVerification(u.uid, u.isVerified)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          u.isVerified 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {u.isVerified ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                        {u.isVerified ? 'VERIFIED' : 'VERIFY USER'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-gray-400">No users found</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
