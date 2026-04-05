import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, GraduationCap, Briefcase, Building2, Palmtree } from 'lucide-react';
import { motion } from 'framer-motion';

const visaCategories = [
  {
    purpose: 'tourism',
    icon: Palmtree,
    title: 'Tourist Visa',
    description: 'For travel, sightseeing, and short-term visits. Usually the easiest to obtain with minimal requirements.',
    examples: ['B-1/B-2 (US)', 'Schengen Visa (EU)', 'eTA (Canada)', 'ETA (Australia)'],
    color: 'bg-amber-500',
    bgLight: 'bg-amber-50',
  },
  {
    purpose: 'study',
    icon: GraduationCap,
    title: 'Student Visa',
    description: 'For pursuing education abroad. Requires acceptance from a recognized institution and proof of finances.',
    examples: ['F-1 (US)', 'Tier 4 (UK)', 'Study Permit (Canada)', 'Subclass 500 (AU)'],
    color: 'bg-blue-500',
    bgLight: 'bg-blue-50',
  },
  {
    purpose: 'work',
    icon: Briefcase,
    title: 'Work Visa',
    description: 'For employment abroad. Usually requires a job offer and employer sponsorship.',
    examples: ['H-1B (US)', 'Skilled Worker (UK)', 'Blue Card (EU)', 'TSS 482 (AU)'],
    color: 'bg-emerald-500',
    bgLight: 'bg-emerald-50',
  },
  {
    purpose: 'business',
    icon: Building2,
    title: 'Business Visa',
    description: 'For business activities, meetings, conferences, and investment opportunities.',
    examples: ['B-1 (US)', 'Business Visa (UK)', 'BV (Canada)', 'Subclass 600 (AU)'],
    color: 'bg-purple-500',
    bgLight: 'bg-purple-50',
  },
];

export default function VisaTypes() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">Visa Types</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Understand the different visa categories and find the right one for your journey.
        </p>
      </div>

      <div className="space-y-6">
        {visaCategories.map((cat, i) => (
          <motion.div
            key={cat.purpose}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className={`${cat.bgLight} p-8 md:w-64 flex flex-col items-center justify-center text-center shrink-0`}>
                    <div className={`w-16 h-16 rounded-2xl ${cat.color} text-white flex items-center justify-center mb-3`}>
                      <cat.icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground">{cat.title}</h3>
                  </div>
                  <div className="p-8 flex-1">
                    <p className="text-muted-foreground mb-4">{cat.description}</p>
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Common Examples</p>
                      <div className="flex flex-wrap gap-2">
                        {cat.examples.map(e => (
                          <span key={e} className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-foreground">{e}</span>
                        ))}
                      </div>
                    </div>
                    <Link to={`/destinations`}>
                      <Button className="bg-primary hover:bg-primary/90 text-white">
                        Explore {cat.title}s
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}