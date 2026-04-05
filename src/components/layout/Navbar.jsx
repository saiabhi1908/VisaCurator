import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Globe, Menu, X, User, BookmarkIcon, Bell } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navLinks = [
  { label: 'Destinations', path: '/destinations' },
  { label: 'Visa Types', path: '/visa-types' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Risk Checker', path: '/risk-checker' },
  { label: 'Doc Scanner', path: '/document-scanner' },
  { label: 'Trip Planner', path: '/itinerary' },
  { label: 'VisaMates', path: '/visamates' }, // ✅ ADDED
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, navigateToLogin } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Globe className="w-7 h-7 text-secondary" />
            <span className="text-xl font-bold text-primary font-display">
              VisaCurator
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-primary bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <BookmarkIcon className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bell className="w-5 h-5" />
            </Button>

            {user ? (
              <Link to="/profile">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {user.full_name?.[0] ||
                    user.email?.[0]?.toUpperCase() ||
                    'U'}
                </div>
              </Link>
            ) : (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                onClick={navigateToLogin}
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                location.pathname === link.path
                  ? 'text-primary bg-accent'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-border">
            {user ? (
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Profile</span>
              </Link>
            ) : (
              <Button className="w-full bg-primary" onClick={navigateToLogin}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}