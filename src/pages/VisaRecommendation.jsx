import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, Check, Star, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { aiAPI } from '@/api/client';
import { countries, purposes } from '@/lib/visaData';

export default function VisaRecommendation() {
  const params = new URLSearchParams(window.location.search);
  const countryId = params.get('country');
  const purpose = params.get('purpose');
  const country = countries.find(c => c.id === countryId);
  const purposeInfo = purposes.find(p => p.value === purpose);

  const [visas, setVisas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!country || !purpose) return;
    setLoading(true);

    aiAPI.invoke(`You are a visa expert. For someone going to ${country.name} for ${purpose}, suggest the top 3 visa types.

Respond with ONLY a JSON object:
{
  "recommended_visa": string,
  "recommendation_reason": string,
  "visas": [{
    "name": string,
    "visa_code": string,
    "description": string,
    "processing_time": string,
    "recommended": boolean,
    "pros": [string, string, string]
  }]
}`).then(res => {
      setVisas(res);
      setLoading(false);
    })
    .catch((err) => {
      console.error("AI API error:", err);
      setLoading(false);
    });
  }, [countryId, purpose]);

  if (!country || !purpose) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Missing Information</h2>
        <p className="text-muted-foreground mb-6">Please select a destination and purpose first.</p>
        <Link to="/destinations"><Button>Browse Destinations</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{country.flag}</span>
          <div>
            <p className="text-sm text-muted-foreground">Visa options for</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {country.name} — {purposeInfo?.label}
            </h1>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <p className="text-muted-foreground">Analyzing best visa options...</p>
        </div>
      ) : visas && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary/10 border border-secondary/20 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-1">AI Recommendation</h3>
                <p className="text-muted-foreground">{visas.recommendation_reason}</p>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {visas.visas?.map((v, i) => (
              <motion.div
                key={v.visa_code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`relative overflow-hidden h-full ${v.recommended ? 'ring-2 ring-secondary shadow-lg' : ''}`}>
                  {v.recommended && (
                    <div className="absolute top-0 right-0 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                      <Star className="w-3 h-3" /> RECOMMENDED
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <Badge variant="outline" className="w-fit mb-2 text-xs">{v.visa_code}</Badge>
                    <CardTitle className="text-lg">{v.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{v.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground">
                      Processing: <span className="font-medium text-foreground">{v.processing_time}</span>
                    </div>
                    <div className="space-y-2">
                      {v.pros?.map((p, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                          <span className="text-foreground">{p}</span>
                        </div>
                      ))}
                    </div>
                    <Link to={`/visa-details?country=${countryId}&purpose=${purpose}&visa=${encodeURIComponent(v.name)}&code=${v.visa_code}`}>
                      <Button className={`w-full mt-2 ${v.recommended ? 'bg-secondary hover:bg-secondary/90 text-white' : 'bg-primary hover:bg-primary/90 text-white'}`}>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}