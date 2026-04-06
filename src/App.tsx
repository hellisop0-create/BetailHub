// src/App.tsx

import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Browse from './pages/Browse';
import AdDetail from './pages/AdDetail';
import PostAd from './pages/PostAd';
import Profile from './pages/Profile';
import SearchPage from './pages/SearchPage';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin'; // 1. IMPORT THIS
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />

          <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/edit-ad/:id" element={<EditAd />} />
                <Route path="/ad/:id" element={<AdDetail />} />
                <Route path="/post-ad" element={<PostAd />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* 2. ADD THE LOGIN ROUTE HERE */}
                <Route path="/admin-login" element={<AdminLogin />} />
                
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </main>
            <Footer />
            <Toaster position="top-center" richColors />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}