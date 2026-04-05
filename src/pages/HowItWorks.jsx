import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Search, Sparkles, Shield, FileCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Search,
    title: 'Choose Your Destination',
    description: 'Select your target country and travel purpose — tourism, study, work, or business.',
    detail: 'Our platform covers 8+ popular destinations with comprehensive visa information.',
    color: 'bg-blue-500',
  },
  {
    icon: Sparkles,
    title: 'Get Smart Recommendations',
    description: 'Our AI analyzes your intent and suggests the best visa type for your situation.',
    detail: 'No more guessing — we match you with the visa that gives you the best chance.',
    color: 'bg-purple-500',
  },
  {
    icon: Shield,
    title: 'Check Your Approval Chances',
    description: 'Enter your profile details and get a risk breakdown with approval probability.',
    detail: 'Our Risk Analyzer evaluates GPA, finances, employment, gaps, and more.',
    color: 'bg-emerald-500',
  },
  {
    icon: FileCheck,
    title: 'Get Personalized Checklist',
    description: 'Receive a tailored document checklist based on your visa type and profile.',
    detail: 'Track your progress as you prepare each document for submission.',
    color: 'bg-amber-500',
  },
  {
    icon: CheckCircle2,
    title: 'Prepare & Apply',
    description: 'Follow step-by-step instructions, tips, and interview preparation guides.',
    detail: 'From filling forms to attending interviews — we guide you through every step.',
    color: 'bg-secondary',
  },
];

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-14">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">How VisaCurator Works</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          From choosing a destination to getting your visa — we simplify the entire process.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-border hidden md:block" />
        <div className="space-y-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className={`flex flex-col md:flex-row items-center gap-6 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
            >
              <div className="flex-1 w-full">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${s.color} text-white flex items-center justify-center mb-4`}>
                      <s.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{s.title}</h3>
                    <p className="text-muted-foreground mb-2">{s.description}</p>
                    <p className="text-sm text-muted-foreground/80">{s.detail}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="hidden md:flex w-12 h-12 rounded-full bg-card border-4 border-border items-center justify-center font-bold text-primary z-10 shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 hidden md:block" />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="text-center mt-14">
        <Link to="/destinations">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10">
            Get Started Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}