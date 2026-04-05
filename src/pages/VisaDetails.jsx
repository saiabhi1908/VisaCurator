import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, DollarSign, BarChart3, ListChecks, Shield, ChevronRight, Loader2, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { aiAPI } from '@/api/client';
import ApplyModal from '@/pages/ApplyModal';
import { countries } from '@/lib/visaData';

export default function VisaDetails() {
  const params = new URLSearchParams(window.location.search);
  const countryId = params.get('country');
  const purpose = params.get('purpose');
  const visaName = params.get('visa');
  const visaCode = params.get('code');
  const country = countries.find(c => c.id === countryId);

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ NEW STATE
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    if (!visaName || !country) return;

    setLoading(true);
    aiAPI.invoke(`You are a visa expert. Provide COMPREHENSIVE details for the "${visaName}" (${visaCode}) visa for ${country.name} for ${purpose} purpose.

Respond with ONLY a JSON object:
{
  "overview": string,
  "processing_time": string,
  "validity": string,
  "requirements": [{ "item": string, "detail": string, "critical": boolean }],
  "fees": [{ "name": string, "amount": string, "note": string }],
  "eligibility": [{ "criterion": string, "detail": string, "status": "required"|"recommended"|"optional" }],
  "steps": [{ "step_number": number, "title": string, "description": string, "tip": string }]
}`).then(res => {
      setDetails(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [visaName, countryId]);

  if (!country || !visaName) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Missing visa information.</p>
        <Link to="/destinations"><Button>Browse Destinations</Button></Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        <p className="text-muted-foreground">Loading visa details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/destinations" className="hover:text-foreground">Destinations</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/visa-recommendation?country=${countryId}&purpose=${purpose}`} className="hover:text-foreground">{country.name}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{visaCode}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <span className="text-3xl">{country.flag}</span>
            {visaName}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">{details?.overview}</p>
        </div>
        <Link to={`/risk-checker?country=${countryId}&purpose=${purpose}&visa=${encodeURIComponent(visaName)}`}>
          <Button className="bg-secondary hover:bg-secondary/90 text-white shrink-0">
            <Shield className="w-4 h-4 mr-2" />
            Check My Chances
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Processing</p>
            <p className="font-semibold text-foreground">{details?.processing_time}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Validity</p>
            <p className="font-semibold text-foreground">{details?.validity}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Visa Code</p>
            <p className="font-semibold text-foreground">{visaCode}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requirements">
        <TabsList className="bg-muted w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="requirements"><FileText className="w-4 h-4 mr-1" />Requirements</TabsTrigger>
          <TabsTrigger value="fees"><DollarSign className="w-4 h-4 mr-1" />Fees</TabsTrigger>
          <TabsTrigger value="eligibility"><BarChart3 className="w-4 h-4 mr-1" />Eligibility</TabsTrigger>
          <TabsTrigger value="steps"><ListChecks className="w-4 h-4 mr-1" />Process</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="mt-6">
          <div className="space-y-3">
            {details?.requirements?.map((r, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${r.critical ? 'bg-destructive' : 'bg-secondary'}`} />
                  <div>
                    <p className="font-medium">{r.item}</p>
                    <p className="text-sm text-muted-foreground">{r.detail}</p>
                  </div>
                  {r.critical && <Badge className="ml-auto bg-destructive/10 text-destructive">Critical</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fees" className="mt-6">
          {details?.fees?.map((f, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex justify-between">
                <div>
                  <p className="font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.note}</p>
                </div>
                <span className="font-bold">{f.amount}</span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="eligibility" className="mt-6">
          {details?.eligibility?.map((e, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex justify-between">
                <div>
                  <p className="font-medium">{e.criterion}</p>
                  <p className="text-sm text-muted-foreground">{e.detail}</p>
                </div>
                <Badge>{e.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="steps" className="mt-6">
          {details?.steps?.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="font-semibold">{s.step_number}. {s.title}</p>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* ✅ UPDATED CTA */}
      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => setApplyOpen(true)}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-base"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Start Application
        </Button>

        <Link to={`/risk-checker?country=${countryId}&purpose=${purpose}&visa=${encodeURIComponent(visaName)}`} className="flex-1">
          <Button className="w-full bg-secondary hover:bg-secondary/90 text-white h-14 text-base">
            <Shield className="w-5 h-5 mr-2" />
            Check My Chances
          </Button>
        </Link>

        <Link to={`/document-checklist?country=${countryId}&purpose=${purpose}&visa=${encodeURIComponent(visaName)}`} className="flex-1">
          <Button variant="outline" className="w-full h-14 text-base">
            <FileText className="w-5 h-5 mr-2" />
            Document Checklist
          </Button>
        </Link>
      </div>

      {/* ✅ APPLY MODAL */}
      <ApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        country={country}
        visaName={visaName}
        visaCode={visaCode}
        purpose={purpose}
      />
    </div>
  );
}