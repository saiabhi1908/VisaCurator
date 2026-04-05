import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileCheck, BarChart3, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Smart Recommendations',
    description: 'AI-powered visa type suggestions based on your profile and destination.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: BarChart3,
    title: 'Risk Analyzer',
    description: 'Get your visa approval probability with detailed risk breakdown.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: FileCheck,
    title: 'Document Checklist',
    description: 'Personalized document requirements based on your visa type and profile.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Shield,
    title: 'Step-by-Step Guide',
    description: 'Complete walkthrough from application to approval with expert tips.',
    color: 'bg-purple-50 text-purple-600',
  },
];

export default function FeatureCards() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From choosing the right visa to tracking your application — we've got every step covered.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}