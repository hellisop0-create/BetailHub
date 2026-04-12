import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-green-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img
                src="https://i.postimg.cc/250vR7KM/logo.png"
                alt="Logo"
                className="h-10 w-auto object-contain"
              />
              <span className="text-xl font-bold">{t('appName')}</span>
            </div>
            <p className="text-green-100 text-sm leading-relaxed">
              {t('tagline')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <Instagram href="" className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6">Quick Links</h3>
            <ul className="space-y-3 text-green-100 text-sm">
              <li><Link to="/browse" className="hover:text-white transition-colors">Browse Ads</Link></li>
              <li><Link to="/post-ad" className="hover:text-white transition-colors">Post an Ad</Link></li>
              <li><Link to="/browse?featured=true" className="hover:text-white transition-colors">Featured Ads</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">My Account</Link></li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Our Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold mb-6">Categories</h3>
            <ul className="space-y-3 text-green-100 text-sm">
              <li><Link to="/browse?category=Cow" className="hover:text-white transition-colors">Cattle</Link></li>
              <li><Link to="/browse?category=Buffalo" className="hover:text-white transition-colors">Buffalo</Link></li>
              <li><Link to="/browse?category=Goat" className="hover:text-white transition-colors">Goat</Link></li>
              <li><Link to="/browse?category=Sheep" className="hover:text-white transition-colors">Sheep</Link></li>
              <li><Link to="/browse?category=Camel" className="hover:text-white transition-colors">Camel</Link></li>
              <li><Link to="/browse?category=Others" className="hover:text-white transition-colors">Others</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6">Contact Us</h3>
            <ul className="space-y-4 text-green-100 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span>DHA Phase II, Karachi, Sindh, Pakistan</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span>PakistanLivestockMandi@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center text-green-200 text-xs">
          <p>&copy; {new Date().getFullYear()} Pakistan Livestock Mandi. All rights reserved.</p>
          <p className="mt-2">Designed by DSACSON for high-conversion livestock trading in Pakistan.</p>
        </div>
      </div>
    </footer>
  );
}
