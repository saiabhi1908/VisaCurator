import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { aiAPI } from '@/api/client'; // ← UPDATED import
import { countries, purposes } from '@/lib/visaData';
import RiskResults from '@/components/risk/RiskResults';

export default function RiskChecker() {
  const params = new URLSearchParams(window.location.search);

  const [form, setForm] = useState({
    country: params.get('country') || '',
    purpose: params.get('purpose') || '',
    visa_name: params.get('visa') || '',
    gpa: '',
    bank_balance: '',
    gap_years: '0',
    employment_status: '',
    age: '',
    english_score: '',
    travel_history: '',
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const country = countries.find(c => c.id === form.country);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await aiAPI.invoke(`You are a visa risk assessment expert. Analyze this visa application profile and provide a detailed risk assessment.

Profile:
- Destination: ${country?.name || form.country}
- Purpose: ${form.purpose}
- Visa Type: ${form.visa_name || 'General'}
- GPA: ${form.gpa || 'Not specified'}
- Bank Balance: $${form.bank_balance || 'Not specified'}
- Gap Years: ${form.gap_years}
- Employment Status: ${form.employment_status}
- Age: ${form.age || 'Not specified'}
- English Score: ${form.english_score || 'Not specified'}
- Travel History: ${form.travel_history || 'None'}

Respond with ONLY a JSON object with these fields:
{
  "approval_probability": number 0-100,
  "risk_level": "low" | "medium" | "high",
  "factors": [{ "factor": string, "status": "strong"|"average"|"weak", "detail": string, "icon": "check"|"warning"|"x" }],
  "recommendations": [{ "action": string, "impact": string, "priority": "high"|"medium"|"low" }],
  "updated_probability": number 0-100,
  "summary": string
}`);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm mb-4">
          <Shield className="w-4 h-4" /> Hero Feature
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          Visa Risk Analyzer
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Get your visa approval probability with AI-powered risk breakdown and actionable recommendations.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Destination Country</Label>
                  <Select value={form.country} onValueChange={v => update('country', v)}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.flag} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Purpose</Label>
                  <Select value={form.purpose} onValueChange={v => update('purpose', v)}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      {purposes.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Visa Type (optional)</Label>
                  <Input value={form.visa_name} onChange={e => update('visa_name', e.target.value)} placeholder="e.g. F-1, H-1B" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>GPA</Label>
                    <Input type="number" step="0.1" max="4" value={form.gpa} onChange={e => update('gpa', e.target.value)} placeholder="e.g. 3.5" />
                  </div>
                  <div>
                    <Label>Age</Label>
                    <Input type="number" value={form.age} onChange={e => update('age', e.target.value)} placeholder="e.g. 25" />
                  </div>
                </div>
                <div>
                  <Label>Bank Balance (USD)</Label>
                  <Input type="number" value={form.bank_balance} onChange={e => update('bank_balance', e.target.value)} placeholder="e.g. 30000" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Gap Years</Label>
                    <Select value={form.gap_years} onValueChange={v => update('gap_years', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['0', '1', '2', '3', '4', '5+'].map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>English Score</Label>
                    <Input value={form.english_score} onChange={e => update('english_score', e.target.value)} placeholder="IELTS/TOEFL" />
                  </div>
                </div>
                <div>
                  <Label>Employment Status</Label>
                  <Select value={form.employment_status} onValueChange={v => update('employment_status', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self-employed">Self-Employed</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Travel History</Label>
                  <Select value={form.travel_history} onValueChange={v => update('travel_history', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No prior travel</SelectItem>
                      <SelectItem value="few">1-3 countries</SelectItem>
                      <SelectItem value="moderate">4-10 countries</SelectItem>
                      <SelectItem value="extensive">10+ countries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !form.country || !form.purpose}
                  className="w-full bg-secondary hover:bg-secondary/90 text-white h-12 text-base"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Shield className="w-5 h-5 mr-2" />}
                  {loading ? 'Analyzing...' : 'Check My Chances'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Shield className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Enter Your Profile</h3>
              <p className="text-muted-foreground max-w-sm">Fill in your details on the left to get a personalized visa approval probability analysis.</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-secondary" />
              <p className="text-muted-foreground text-lg">Analyzing your profile...</p>
              <p className="text-sm text-muted-foreground">This may take a few seconds</p>
            </div>
          )}

          {result && <RiskResults result={result} country={country} />}
        </div>
      </div>
    </div>
  );
}