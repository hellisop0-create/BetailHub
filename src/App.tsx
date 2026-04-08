import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from 'sonner';

// Pages
import Home from './pages/Home';
import Browse from './pages/Browse';
import AdDetail from './pages/AdDetail';
import PostAd from './pages/PostAd';
import EditAd from './pages/EditAd'; // Fixed relative path
import Profile from './pages/Profile';
import SearchPage from './pages/SearchPage';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';

export default function App() {
  const [showCaution, setShowCaution] = useState(true);

  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />

          <div className="min-h-screen flex flex-col bg-gray-50 font-sans relative">
            
            {/* Caution Popup - Glass Overlay */}
            {showCaution && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md bg-white/30 p-4">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center ring-1 ring-black/5">
                  <div className="flex justify-center mb-4">
                    <div className="bg-amber-50 p-4 rounded-full">
                      <span className="text-4xl">⚠️</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Caution Notice</h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    1. Make sure to meet the Buyer/Seller in the public/crowded place. 
                    2. Do not pay anything in advance.
                    3. Do not post anything prohibited on this website.
                    <h2 className="text-m font-extrabold text-gray-900 mb-2">Pakistan Livestock Mandi and Admins are not responsible for any kind of scam</h2>
                  </p>
                  <button
                    onClick={() => setShowCaution(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg"
                  >
                    I Understand & Enter
                  </button>
                </div>
              </div>
            )}

            {/* Header / Navigation */}
            <Navbar />

            {/* Main Content Area */}
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/ad/:id" element={<AdDetail />} />

                {/* User Action Routes */}
                <Route path="/post-ad" element={<PostAd />} />
                <Route path="/edit-ad/:id" element={<EditAd />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Admin Routes */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin" element={<Admin />} />

                {/* Catch-all: You could add a 404 page here later */}
                <Route path="*" element={<Home />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />

            {/* Notifications Overlay */}
            <Toaster position="top-center" richColors closeButton />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}