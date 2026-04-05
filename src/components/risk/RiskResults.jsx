import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ProbabilityGauge from './ProbabilityGauge';

const statusIcons = {
  strong: <Check className="w-4 h-4 text-emerald-600" />,
  average: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  weak: <X className="w-4 h-4 text-destructive" />,
};

const statusColors = {
  strong: 'border-l-emerald-500 bg-emerald-50/50',
  average: 'border-l-amber-500 bg-amber-50/50',
  weak: 'border-l-red-500 bg-red-50/50',
};

const priorityColors = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-muted text-muted-foreground',
};

export default function RiskResults({ result, country }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Probability */}
      <Card>
        <CardContent className="p-8 text-center">
          <ProbabilityGauge value={result.approval_probability} level={result.risk_level} />
          <p className="text-muted-foreground mt-4 max-w-md mx-auto">{result.summary}</p>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.factors?.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`border-l-4 rounded-lg p-4 ${statusColors[f.status]}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{statusIcons[f.status]}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{f.factor}</p>
                    <Badge variant="outline" className="capitalize text-xs">{f.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{f.detail}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.recommendations?.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl"
            >
              <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{r.action}</p>
                  <Badge className={`shrink-0 border-0 text-xs ${priorityColors[r.priority]}`}>
                    {r.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{r.impact}</p>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Updated Probability */}
      {result.updated_probability > result.approval_probability && (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">If you follow all recommendations</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-3xl font-bold text-muted-foreground">{result.approval_probability}%</span>
              <ArrowRight className="w-6 h-6 text-secondary" />
              <span className="text-4xl font-bold text-secondary">{result.updated_probability}%</span>
            </div>
            <p className="text-sm text-secondary font-medium mt-2">
              +{result.updated_probability - result.approval_probability}% improvement possible
            </p>
          </CardContent>
        </Card>
      )}

      <Link to={`/document-checklist?country=${country?.id}&purpose=study`}>
        <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base">
          Generate Document Checklist
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </motion.div>
  );
}