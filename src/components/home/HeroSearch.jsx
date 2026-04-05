import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, MapPin, Target, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { countries, purposes } from '@/lib/visaData';

export default function HeroSearch() {
  const [country, setCountry] = useState('');
  const [purpose, setPurpose] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedCountry = countries.find(c => c.id === country);

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(searchText.toLowerCase()))
  );

  const handleSearch = () => {
    if (country && purpose) {
      navigate(`/visa-recommendation?country=${country}&purpose=${purpose}`);
    }
  };

  const selectCountry = (c) => {
    setCountry(c.id);
    setSearchText('');
    setShowDropdown(false);
  };

  const clearCountry = (e) => {
    e.stopPropagation();
    setCountry('');
    setSearchText('');
    setShowDropdown(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightedIndex]) selectCountry(filtered[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Reset highlight when filtered changes
  useEffect(() => { setHighlightedIndex(0); }, [searchText]);

  // Scroll highlighted item into view
  useEffect(() => {
    const el = dropdownRef.current?.children[highlightedIndex];
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.country-search-wrapper')) {
        setShowDropdown(false);
        setSearchText('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-white rounded-2xl p-3 shadow-2xl flex flex-col md:flex-row gap-3">

        {/* Country Search */}
        <div className="flex-1 relative country-search-wrapper">
          <div
            className="flex items-center gap-3 h-14 px-3 bg-muted/50 rounded-xl cursor-text"
            onClick={() => {
              if (!country) {
                setShowDropdown(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }
            }}
          >
            <MapPin className="w-5 h-5 text-secondary shrink-0" />

            {/* Show selected country OR search input */}
            {country && !showDropdown ? (
              <div className="flex items-center justify-between flex-1">
                <span className="flex items-center gap-2 text-base text-foreground">
                  <span>{selectedCountry?.flag}</span>
                  <span>{selectedCountry?.name}</span>
                </span>
                <button onClick={clearCountry} className="text-muted-foreground hover:text-foreground ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center flex-1 gap-2">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={searchText}
                  onChange={e => {
                    setSearchText(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Where do you want to go?"
                  className="flex-1 bg-transparent outline-none text-base text-foreground placeholder:text-muted-foreground"
                />
                {searchText && (
                  <button onClick={() => setSearchText('')} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div
                  ref={dropdownRef}
                  className="max-h-56 overflow-y-auto py-1"
                >
                  {filtered.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No countries found for "{searchText}"
                    </div>
                  ) : (
                    filtered.map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => selectCountry(c)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                          i === highlightedIndex
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <span className="text-lg">{c.flag}</span>
                        <div className="flex-1">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{c.region}</span>
                        </div>
                        {c.tags[0] && (
                          <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                            {c.tags[0]}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Purpose Select */}
        <div className="flex-1">
          <Select value={purpose} onValueChange={setPurpose}>
            <SelectTrigger className="border-0 h-14 text-base shadow-none bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-secondary shrink-0" />
                <SelectValue placeholder="What's your purpose?" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {purposes.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  <span className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSearch}
          disabled={!country || !purpose}
          className="h-14 px-8 bg-primary hover:bg-primary/90 text-white rounded-xl text-base"
        >
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-white/50 text-xs mt-3">
        ↑↓ to navigate • Enter to select • Esc to close
      </p>
    </motion.div>
  );
}