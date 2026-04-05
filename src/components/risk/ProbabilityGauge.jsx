import React from 'react';
import { motion } from 'framer-motion';

const levelConfig = {
  low: { color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'Low Risk' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-100', label: 'Medium Risk' },
  high: { color: 'text-destructive', bg: 'bg-red-100', label: 'High Risk' },
};

export default function ProbabilityGauge({ value, level }) {
  const config = levelConfig[level] || levelConfig.medium;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="52"
            stroke="currentColor"
            className="text-muted"
            strokeWidth="10"
            fill="none"
          />
          <motion.circle
            cx="60" cy="60" r="52"
            stroke="currentColor"
            className={config.color}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - value / 100) }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`text-4xl font-bold ${config.color}`}
          >
            {value}%
          </motion.span>
        </div>
      </div>
      <div className={`px-4 py-1.5 rounded-full ${config.bg} ${config.color} text-sm font-semibold`}>
        {config.label}
      </div>
      <p className="text-xs text-muted-foreground mt-2">Visa Approval Probability</p>
    </div>
  );
}