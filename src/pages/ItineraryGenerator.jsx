import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI } from '@/api/client';
import { countries } from '@/lib/visaData';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Loader2, Sparkles, MapPin, Clock, DollarSign, Lightbulb,
  Download, RotateCcw, Calendar, Utensils, Camera, Mountain,
  Building, ShoppingBag, Navigation, Plane, PlaneLanding,
} from 'lucide-react';

const interestOptions = [
  { value: 'culture',     label: 'Culture & History',         icon: Building  },
  { value: 'food',        label: 'Food & Cuisine',            icon: Utensils  },
  { value: 'adventure',   label: 'Adventure & Sports',        icon: Mountain  },
  { value: 'photography', label: 'Photography & Sightseeing', icon: Camera    },
  { value: 'shopping',    label: 'Shopping',                  icon: ShoppingBag },
  { value: 'nature',      label: 'Nature & Parks',            icon: MapPin    },
];

// Approximate USD → local currency exchange rates (for slider display only)
const USD_RATES = {
  USD: 1, CAD: 1.36, CNY: 7.24, GBP: 0.79, EUR: 0.92,
  SEK: 10.4, AUD: 1.53, NZD: 1.63, JPY: 149, SGD: 1.34,
  AED: 3.67, INR: 83.5, KRW: 1330, CHF: 0.89,
  MXN: 17.1, BRL: 4.97, ZAR: 18.7,
};

const getBudgetLabel = (usdVal) => {
  if (usdVal <= 500)   return { label: 'Backpacker', emoji: '🎒', color: 'text-emerald-600' };
  if (usdVal <= 2000)  return { label: 'Budget',     emoji: '💰', color: 'text-blue-600'    };
  if (usdVal <= 5000)  return { label: 'Mid-range',  emoji: '💳', color: 'text-violet-600'  };
  if (usdVal <= 12000) return { label: 'Comfort',    emoji: '🌟', color: 'text-amber-600'   };
  return                      { label: 'Luxury',     emoji: '💎', color: 'text-rose-600'    };
};

// Calculate number of days between two date strings
const calcDays = (from, to) => {
  if (!from || !to) return null;
  const diff = new Date(to) - new Date(from);
  return diff > 0 ? Math.round(diff / (1000 * 60 * 60 * 24)) : null;
};

// Format a date string nicely: "2025-06-10" → "10 Jun 2025"
const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ItineraryGenerator() {
  const [form, setForm] = useState({
    country:    '',
    travel_from: '',   // departure date
    travel_to:   '',   // return date
    interests:  [],
    budget:     2000,  // stored in USD
    visa_type:  '',
    cities:     '',
  });
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleInterest = (val) => {
    setForm(p => ({
      ...p,
      interests: p.interests.includes(val)
        ? p.interests.filter(i => i !== val)
        : [...p.interests, val],
    }));
  };

  const selectedCountry = countries.find(c => c.id === form.country);
  const currency        = selectedCountry?.currency || { code: 'USD', symbol: '$', name: 'US Dollar' };
  const rate            = USD_RATES[currency.code] || 1;
  const localBudget     = Math.round(form.budget * rate);
  const days            = calcDays(form.travel_from, form.travel_to);
  const budgetInfo      = getBudgetLabel(form.budget);

  // Per-day budget in local currency
  const perDayLocal = days ? Math.round(localBudget / days) : null;

  const handleGenerate = async () => {
    if (!form.country) { setError('Please select a destination country'); return; }
    if (!form.travel_from || !form.travel_to) { setError('Please select your travel dates'); return; }
    if (!days || days <= 0) { setError('Return date must be after departure date'); return; }
    setError('');
    setLoading(true);
    setItinerary(null);

    try {
      const res = await aiAPI.invoke(
        `You are an expert travel planner. Create a detailed ${days}-day travel itinerary for ${selectedCountry?.name}.

Trip details:
- Travel dates: ${fmtDate(form.travel_from)} to ${fmtDate(form.travel_to)} (${days} days)
- Total budget: ${currency.symbol}${localBudget.toLocaleString()} ${currency.code} (~$${form.budget.toLocaleString()} USD) — ${budgetInfo.label} level
- Visa type: ${form.visa_type || 'tourist'}
- Interests: ${form.interests.join(', ') || 'general sightseeing'}
${form.cities ? `- Specific cities/regions to visit: ${form.cities}` : ''}

IMPORTANT INSTRUCTIONS:
- Show ALL costs in ${currency.name} (${currency.code}, symbol: ${currency.symbol}) as the PRIMARY currency
- Budget must fit within ${currency.symbol}${localBudget.toLocaleString()} ${currency.code} total
- Take into account seasonal factors for the travel dates (${fmtDate(form.travel_from)} to ${fmtDate(form.travel_to)}) — mention if it's peak/off-peak season, festivals, weather
- Plan must cover exactly ${days} days, starting ${fmtDate(form.travel_from)}
${form.cities ? `- Must include the requested cities/regions: ${form.cities}` : ''}

Respond with ONLY a JSON object:
{
  "title": string,
  "overview": string,
  "season_note": string,
  "best_time_to_visit": string,
  "estimated_total_cost": string,
  "currency_tip": string,
  "days": [
    {
      "day": number,
      "date": string,
      "theme": string,
      "morning":   { "activity": string, "location": string, "duration": string, "tip": string, "cost": string },
      "afternoon": { "activity": string, "location": string, "duration": string, "tip": string, "cost": string },
      "evening":   { "activity": string, "location": string, "duration": string, "tip": string, "cost": string },
      "food_recommendation": string,
      "daily_estimated_cost": string
    }
  ],
  "packing_tips": [string],
  "visa_travel_tips": [string],
  "emergency_contacts": { "police": string, "ambulance": string, "tourist_helpline": string }
}`
      );

      setItinerary(res);
    } catch {
      setError('Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleReset = () => {
    setItinerary(null);
    setForm({ country: '', travel_from: '', travel_to: '', interests: [], budget: 2000, visa_type: '', cities: '' });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm mb-4">
          <Sparkles className="w-4 h-4" /> AI Travel Planner
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          Travel Itinerary Generator
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Tell us your destination and preferences — AI builds your perfect day-by-day trip plan instantly.
        </p>
      </div>

      {!itinerary ? (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6 space-y-6">

              {/* Country */}
              <div>
                <Label className="text-base font-semibold mb-2 block">🌍 Destination Country</Label>
                <Select value={form.country} onValueChange={v => { update('country', v); }}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">{c.flag} {c.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Travel Dates */}
              <div>
                <Label className="text-base font-semibold mb-2 block">📅 Travel Dates</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                      <Plane className="w-3 h-3" /> Departure
                    </Label>
                    <Input
                      type="date"
                      value={form.travel_from}
                      min={today}
                      onChange={e => {
                        update('travel_from', e.target.value);
                        // reset return date if it's now before departure
                        if (form.travel_to && e.target.value >= form.travel_to) {
                          update('travel_to', '');
                        }
                      }}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                      <PlaneLanding className="w-3 h-3" /> Return
                    </Label>
                    <Input
                      type="date"
                      value={form.travel_to}
                      min={form.travel_from || today}
                      onChange={e => update('travel_to', e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
                {/* Duration pill */}
                {days && days > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                    <Calendar className="w-3 h-3" />
                    {days} {days === 1 ? 'day' : 'days'} · {fmtDate(form.travel_from)} → {fmtDate(form.travel_to)}
                  </div>
                )}
              </div>

              {/* Cities / States */}
              <div>
                <Label className="text-base font-semibold mb-2 block">
                  <Navigation className="inline w-4 h-4 mr-1 mb-0.5" />
                  Cities / States to Visit{' '}
                  <span className="text-muted-foreground font-normal text-sm">(optional)</span>
                </Label>
                <Input
                  placeholder="e.g. Tokyo, Kyoto, Osaka"
                  value={form.cities}
                  onChange={e => update('cities', e.target.value)}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  List specific cities, states, or regions you'd like the plan to include.
                </p>
              </div>

              {/* Visa Type */}
              <div>
                <Label className="text-base font-semibold mb-2 block">🪪 Visa Type (optional)</Label>
                <Select value={form.visa_type} onValueChange={v => update('visa_type', v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="What visa do you have?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tourist">✈️ Tourist Visa</SelectItem>
                    <SelectItem value="student">🎓 Student Visa</SelectItem>
                    <SelectItem value="work">💼 Work Visa</SelectItem>
                    <SelectItem value="business">🏢 Business Visa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Slider — shows local currency */}
              <div>
                <Label className="text-base font-semibold mb-4 block">
                  💰 Total Trip Budget
                  {currency.code !== 'USD' && (
                    <span className="text-muted-foreground font-normal text-sm ml-2">
                      (in {currency.name})
                    </span>
                  )}
                </Label>
                <div className="px-1">
                  {/* Budget display card */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-muted rounded-2xl px-5 py-3 flex items-center gap-3">
                      <span className="text-2xl">{budgetInfo.emoji}</span>
                      <div>
                        <p className={`text-lg font-bold ${budgetInfo.color}`}>
                          {currency.symbol}{localBudget.toLocaleString()} {currency.code}
                        </p>
                        {currency.code !== 'USD' && (
                          <p className="text-xs text-muted-foreground">≈ ${form.budget.toLocaleString()} USD</p>
                        )}
                        <p className="text-xs text-muted-foreground">{budgetInfo.label} traveller</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {perDayLocal ? (
                        <>
                          <p>per day</p>
                          <p className="font-semibold text-foreground text-sm">
                            {currency.symbol}{perDayLocal.toLocaleString()} {currency.code}
                          </p>
                        </>
                      ) : (
                        <p className="italic">select dates<br/>for daily rate</p>
                      )}
                    </div>
                  </div>

                  {/* Slider (always in USD internally, displayed in local) */}
                  <Slider
                    min={200}
                    max={20000}
                    step={100}
                    value={[form.budget]}
                    onValueChange={([v]) => update('budget', v)}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{currency.symbol}{Math.round(200 * rate).toLocaleString()}</span>
                    <span>{currency.symbol}{Math.round(20000 * rate).toLocaleString()}</span>
                  </div>

                  {/* Quick preset pills — shown in local currency */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {[200, 1000, 3000, 7000, 15000].map(usd => (
                      <button
                        key={usd}
                        onClick={() => update('budget', usd)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          form.budget === usd
                            ? 'bg-primary text-white border-primary'
                            : 'bg-card text-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {currency.symbol}{Math.round(usd * rate).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div>
                <Label className="text-base font-semibold mb-2 block">🎯 Your Interests (select all that apply)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {interestOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => toggleInterest(value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.interests.includes(value)
                          ? 'border-secondary bg-secondary/5 text-secondary'
                          : 'border-border hover:border-secondary/40 text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
              )}

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full h-14 bg-secondary hover:bg-secondary/90 text-white text-base"
              >
                {loading
                  ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating your itinerary...</>
                  : <><Sparkles className="w-5 h-5 mr-2" /> Generate My Itinerary</>
                }
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Itinerary Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{selectedCountry?.flag}</span>
                  <h2 className="text-2xl font-bold text-foreground">{itinerary.title}</h2>
                </div>
                <p className="text-muted-foreground">{itinerary.overview}</p>
                {itinerary.season_note && (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg mt-2 inline-block">
                    🗓️ {itinerary.season_note}
                  </p>
                )}
              </div>
              <div className="flex gap-3 shrink-0">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" /> New Plan
                </Button>
                <Button onClick={handlePrint} className="bg-primary text-white">
                  <Download className="w-4 h-4 mr-2" /> Save / Print
                </Button>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Calendar,   label: 'Trip Dates',     value: `${fmtDate(form.travel_from)} → ${fmtDate(form.travel_to)}` },
                { icon: Clock,      label: 'Duration',       value: `${days} days` },
                { icon: DollarSign, label: 'Your Budget',    value: `${currency.symbol}${localBudget.toLocaleString()} ${currency.code}` },
                { icon: DollarSign, label: 'Est. Cost',      value: itinerary.estimated_total_cost },
              ].map(({ icon: Icon, label, value }) => (
                <Card key={label}>
                  <CardContent className="p-4 text-center">
                    <Icon className="w-5 h-5 text-secondary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground mt-1 leading-snug">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Day by Day */}
            <div className="space-y-6 mb-8">
              {itinerary.days?.map((day, i) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                            D{day.day}
                          </div>
                          <div>
                            <p className="text-lg">Day {day.day}{day.date ? ` — ${day.date}` : ''}</p>
                            <p className="text-sm font-normal text-secondary">{day.theme}</p>
                          </div>
                        </CardTitle>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {day.daily_estimated_cost}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { time: '🌅 Morning',   data: day.morning },
                        { time: '☀️ Afternoon', data: day.afternoon },
                        { time: '🌙 Evening',   data: day.evening },
                      ].map(({ time, data }) => data && (
                        <div key={time} className="flex gap-4 p-4 bg-muted/50 rounded-xl">
                          <div className="shrink-0">
                            <p className="text-xs font-semibold text-muted-foreground">{time}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-foreground">{data.activity}</p>
                              <span className="text-xs text-muted-foreground shrink-0">{data.cost}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                              <p className="text-xs text-muted-foreground">{data.location}</p>
                              <span className="text-muted-foreground mx-1">•</span>
                              <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                              <p className="text-xs text-muted-foreground">{data.duration}</p>
                            </div>
                            {data.tip && (
                              <div className="flex items-start gap-1.5 mt-2 bg-secondary/10 px-3 py-1.5 rounded-lg">
                                <Lightbulb className="w-3 h-3 text-secondary shrink-0 mt-0.5" />
                                <p className="text-xs text-secondary">{data.tip}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {day.food_recommendation && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                          <Utensils className="w-4 h-4 text-amber-600 shrink-0" />
                          <p className="text-sm text-amber-700">
                            <span className="font-medium">Food: </span>{day.food_recommendation}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Tips & Emergency */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">🎒 Packing Tips</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {itinerary.packing_tips?.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-secondary mt-0.5">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">🪪 Visa Travel Tips</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {itinerary.visa_travel_tips?.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-secondary mt-0.5">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {itinerary.emergency_contacts && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">🚨 Emergency Contacts in {selectedCountry?.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(itinerary.emergency_contacts).map(([key, value]) => (
                        <div key={key} className="text-center p-4 bg-muted rounded-xl">
                          <p className="text-xs text-muted-foreground capitalize mb-1">{key.replace('_', ' ')}</p>
                          <p className="text-xl font-bold text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
