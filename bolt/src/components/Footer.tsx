import React from 'react';
import { Link } from 'react-router-dom';
import { Hotel, Instagram, Facebook, Twitter, Mail, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div>
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
              <Hotel size={24} />
              <span>MyBooking</span>
            </Link>
            <p className="mt-4 text-neutral-400">
              La tua piattaforma di fiducia per trovare e prenotare alloggi in tutto il mondo.
              Trova hotel, ostelli e case vacanza ai migliori prezzi.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Link Utili</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/search" className="text-neutral-400 hover:text-white transition-colors">
                  Cerca alloggi
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-neutral-400 hover:text-white transition-colors">
                  Registrati
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-neutral-400 hover:text-white transition-colors">
                  Accedi
                </Link>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  Chi siamo
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Supporto</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  Centro assistenza
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  Termini e condizioni
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  Privacy policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contatti</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Mail size={18} className="text-neutral-400" />
                <a href="mailto:info@mybooking.com" className="text-neutral-400 hover:text-white transition-colors">
                  info@mybooking.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone size={18} className="text-neutral-400" />
                <a href="tel:+390123456789" className="text-neutral-400 hover:text-white transition-colors">
                  +39 012 345 6789
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-8 pt-6 text-center text-neutral-500 text-sm">
          <p>&copy; {new Date().getFullYear()} MyBooking. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;