import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  { num: '01', title: 'Choose Destination', desc: 'Select your country and travel purpose' },
  { num: '02', title: 'Get Recommendations', desc: 'Receive AI-powered visa suggestions' },
  { num: '03', title: 'Check Your Chances', desc: 'Analyze approval probability with risk insights' },
  { num: '04', title: 'Prepare & Apply', desc: 'Follow step-by-step guide with document checklist' },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-muted/50 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg">Simple. Smart. Step by step.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="text-5xl font-bold text-secondary/20 mb-3 font-display">{s.num}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border -translate-x-1/2" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}