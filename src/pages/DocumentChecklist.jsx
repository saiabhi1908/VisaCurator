import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { aiAPI } from '@/api/client';
import { countries } from '@/lib/visaData';

export default function DocumentChecklist() {
  const params = new URLSearchParams(window.location.search);
  const countryId = params.get('country');
  const purpose = params.get('purpose');
  const visaName = params.get('visa') || 'General';
  const country = countries.find(c => c.id === countryId);

  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    if (!country) return;

    setLoading(true);
    aiAPI.invoke(`You are a visa document expert. Generate a PERSONALIZED document checklist for a "${visaName}" visa to ${country.name} for ${purpose} purpose.

Respond with ONLY a JSON object:
{
  "title": string,
  "categories": [{
    "category": string,
    "documents": [{
      "name": string,
      "description": string,
      "required": boolean,
      "tip": string
    }]
  }]
}`).then(res => {
      setChecklist(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [countryId, purpose, visaName]);

  const toggleCheck = (catIdx, docIdx) => {
    const key = `${catIdx}-${docIdx}`;
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalDocs = checklist?.categories?.reduce((sum, cat) => sum + cat.documents.length, 0) || 0;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        <p className="text-muted-foreground">Generating your personalized checklist...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Document Checklist
          </h1>
          <p className="text-muted-foreground">
            {country?.flag} {country?.name} — {visaName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{checkedCount}/{totalDocs}</p>
            <p className="text-xs text-muted-foreground">Documents Ready</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
            {checkedCount === totalDocs && totalDocs > 0 ? (
              <CheckCircle2 className="w-6 h-6 text-secondary" />
            ) : (
              <FileText className="w-6 h-6 text-secondary" />
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-secondary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${totalDocs > 0 ? (checkedCount / totalDocs) * 100 : 0}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="space-y-8">
        {checklist?.categories?.map((cat, catIdx) => (
          <motion.div
            key={catIdx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.1 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              {cat.category}
            </h2>
            <div className="space-y-3">
              {cat.documents.map((doc, docIdx) => {
                const isChecked = checked[`${catIdx}-${docIdx}`];
                return (
                  <Card
                    key={docIdx}
                    className={`cursor-pointer transition-all ${isChecked ? 'bg-secondary/5 border-secondary/30' : 'hover:shadow-md'}`}
                    onClick={() => toggleCheck(catIdx, docIdx)}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      <Checkbox checked={isChecked} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {doc.name}
                          </p>
                          {doc.required ? (
                            <Badge className="bg-destructive/10 text-destructive border-0 text-xs">Required</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Optional</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                        {doc.tip && !isChecked && (
                          <p className="text-xs text-secondary mt-2">💡 {doc.tip}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <Link to={`/risk-checker?country=${countryId}&purpose=${purpose}&visa=${encodeURIComponent(visaName)}`} className="flex-1">
          <Button variant="outline" className="w-full h-12 text-base">
            Back to Risk Checker
          </Button>
        </Link>
        <Link to="/profile" className="flex-1">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base">
            View My Applications
          </Button>
        </Link>
      </div>
    </div>
  );
}