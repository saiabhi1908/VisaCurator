import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, FileCheck, BarChart3, Globe, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { purposes } from '@/lib/visaData';
import HeroSearch from '@/components/home/HeroSearch';
import FeatureCards from '@/components/home/FeatureCards';
import HowItWorksSection from '@/components/home/HowItWorksSection';

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-primary py-20 lg:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-4 py-2 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Visa Intelligence
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight mb-6">
              Navigate Your<br />
              <span className="text-secondary">Visa Journey</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Smart recommendations, risk analysis, and step-by-step guidance for your visa application — all in one place.
            </p>
          </motion.div>
          <HeroSearch />
        </div>
      </section>

      <FeatureCards />
      <HowItWorksSection />

      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Get personalized visa recommendations and check your approval chances today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/destinations">
              <Button size="lg" className="bg-secondary text-white hover:bg-secondary/90 px-8">
                Explore Destinations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/risk-checker">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                Check My Chances
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}