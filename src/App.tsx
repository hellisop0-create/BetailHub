import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Contexts - Paths fixed to current directory
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Components - Paths fixed to current directory
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ChatFAB from './components/ChatFAB';

// Pages - Paths fixed to current directory
import Home from './pages/Home';
import Browse from './pages/Browse';
import AdDetail from './pages/AdDetail';
import PostAd from './pages/PostAd';
import EditAd from './pages/EditAd';
import Profile from './pages/Profile';
import SearchPage from './pages/SearchPage';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import AllListings from './pages/AllListings';
import Messages from './pages/Messages';
import ServicesPage from './pages/ServicesPage';

// billing
import BillingPage from './pages/BillingPage';
import Checkout from './pages/Checkout';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/ad/:id" element={<AdDetail />} />
                <Route path="/post-ad" element={<PostAd />} />
                <Route path="/edit-ad/:id" element={<EditAd />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/all-listings" element={<AllListings />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/services" element={<ServicesPage />} />
              </Routes>
            </main>
            <Footer />
            <ChatFAB />
          </div>
          <Toaster position="top-center" richColors />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}