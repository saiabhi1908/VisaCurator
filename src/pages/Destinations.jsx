import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { countries, regions, purposes } from '@/lib/visaData';

const filters = ['Study-friendly', 'Work visa availability', 'PR options'];

export default function Destinations() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [purposeModal, setPurposeModal] = useState(false);
  const [pendingCountry, setPendingCountry] = useState(null);

  const toggleFilter = (f) => {
    setSelectedFilters(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  const filtered = countries.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchRegion = selectedRegion === 'all' || c.region === selectedRegion;
    const matchFilters = selectedFilters.length === 0 || selectedFilters.every(f => c.features?.includes(f));
    return matchSearch && matchRegion && matchFilters;
  });

  const handleCountryClick = (country) => {
    setPendingCountry(country);
    setPurposeModal(true);
  };

  const handlePurposeSelect = (purposeValue) => {
    setPurposeModal(false);
    navigate(`/visa-recommendation?country=${pendingCountry.id}&purpose=${purposeValue}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-24 space-y-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-1">Find your path</h2>
              <p className="text-sm text-muted-foreground mb-5">Discover global opportunities tailored to your goals.</p>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search country..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 bg-card"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Visa Accessibility</p>
              <div className="space-y-3">
                {filters.map(f => (
                  <label key={f} className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={selectedFilters.includes(f)}
                      onCheckedChange={() => toggleFilter(f)}
                    />
                    <span className="text-sm text-foreground group-hover:text-secondary transition-colors">{f}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Geographic Region</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedRegion('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedRegion === 'all' ? 'bg-primary text-white' : 'bg-card text-foreground border border-border hover:bg-muted'
                  }`}
                >
                  All
                </button>
                {regions.map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRegion(r)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedRegion === r ? 'bg-primary text-white' : 'bg-card text-foreground border border-border hover:bg-muted'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-secondary/10 rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-1">Need Help?</h3>
              <p className="text-xs text-muted-foreground mb-4">Our AI can build a custom visa roadmap for you.</p>
              <Button size="sm" className="bg-secondary text-white hover:bg-secondary/90 w-full" onClick={() => navigate('/risk-checker')}>
                Check My Chances
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Badge className="bg-secondary/10 text-secondary border-0 mb-2">
                {filtered.length} COUNTRIES FOUND
              </Badge>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Explore Destinations</h1>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all group">
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 text-3xl">{c.flag}</div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-foreground mb-1">{c.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{c.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {c.tags.map(t => (
                          <Badge key={t} variant="secondary" className="text-xs font-medium">
                            {t}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        onClick={() => handleCountryClick(c)}
                      >
                        Explore Visas
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Purpose Picker Modal */}
      <Dialog open={purposeModal} onOpenChange={setPurposeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span>{pendingCountry?.flag}</span>
              <span>{pendingCountry?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mb-2">
            What is the purpose of your visit? We'll show you the right visa options.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {purposes.map(p => (
              <button
                key={p.value}
                onClick={() => handlePurposeSelect(p.value)}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <span className="text-3xl">{p.icon}</span>
                <span className="font-semibold text-foreground group-hover:text-primary text-sm">{p.label}</span>
                <span className="text-xs text-muted-foreground text-center">{p.description}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
