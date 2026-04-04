import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  // --- CHANGE CREDENTIALS HERE ---
  const MASTER_EMAIL = "zaheer7@gmail.com";
  const MASTER_PASS = "admin1234";

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Zero-wait validation
    if (email.trim().toLowerCase() === MASTER_EMAIL && password === MASTER_PASS) {
      sessionStorage.setItem('admin_session_active', 'true');
      sessionStorage.setItem('admin_user_email', email.trim().toLowerCase());
      
      toast.success("Access Granted");
      
      // Instant redirect
      navigate('/admin', { replace: true });
    } else {
      toast.error("Invalid Credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border-4 border-gray-900 text-center">
        <ShieldCheck size={40} className="mx-auto text-green-600 mb-2" />
        <h2 className="text-xl font-black uppercase mb-8">Admin Access</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full bg-gray-50 border-2 rounded-xl py-3 pl-12 font-bold focus:border-green-500 outline-none"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-gray-50 border-2 rounded-xl py-3 pl-12 font-bold focus:border-green-500 outline-none"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full bg-gray-900 text-white rounded-xl py-4 font-black uppercase text-xs hover:bg-green-600 transition-all">
            Login Now
          </button>
        </form>
      </div>
    </div>
  );
}