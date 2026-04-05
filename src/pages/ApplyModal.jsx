import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { applicationsAPI, aiAPI } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import {
  CheckCircle2, Loader2, ArrowRight, ArrowLeft, FileText, User,
  Calendar, Globe, Plane, Hotel, ClipboardList, Clock, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Steps definition
const STEPS = [
  { id: 1, title: 'Personal Info',    icon: User },
  { id: 2, title: 'Passport',         icon: FileText },
  { id: 3, title: 'Travel Dates',     icon: Calendar },
  { id: 4, title: 'Documents',        icon: ClipboardList },
  { id: 5, title: 'Appointment',      icon: Clock },
  { id: 6, title: 'Flights',          icon: Plane },
  { id: 7, title: 'Hotel',            icon: Hotel },
  { id: 8, title: 'Confirm',          icon: Globe },
];

export default function ApplyModal({ open, onClose, country, visaName, visaCode, purpose, existingApplication }) {
  const { user, isAuthenticated, navigateToLogin } = useAuth();

  // Restore from existing application if resuming
  const savedProfile    = existingApplication?.user_profile   ? JSON.parse(existingApplication.user_profile)   : {};
  const savedChecklist  = existingApplication?.documents_checklist ? JSON.parse(existingApplication.documents_checklist) : {};

  const [step, setStep]         = useState(existingApplication?.current_step || 1);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState('');
  const [appId, setAppId]       = useState(existingApplication?.id || null);

  // Docs checklist loaded from AI
  const [docsLoading, setDocsLoading]   = useState(false);
  const [docsList, setDocsList]         = useState([]);
  const [checkedDocs, setCheckedDocs]   = useState(savedChecklist.checked || {});

  const [form, setForm] = useState({
    full_name:        savedProfile.full_name        || user?.full_name || '',
    email:            savedProfile.email             || user?.email    || '',
    phone:            savedProfile.phone             || '',
    nationality:      savedProfile.nationality       || '',
    passport_number:  savedProfile.passport_number  || '',
    passport_expiry:  savedProfile.passport_expiry  || '',
    date_of_birth:    savedProfile.date_of_birth     || '',
    travel_date:      savedProfile.travel_date       || '',
    return_date:      savedProfile.return_date       || '',
    purpose:          savedProfile.purpose           || purpose || '',
    // Step 5: Appointment
    appointment_booked: savedProfile.appointment_booked || '',
    appointment_date:   savedProfile.appointment_date   || '',
    // Step 6: Flights
    flight_booked:    savedProfile.flight_booked    || '',
    flight_number:    savedProfile.flight_number    || '',
    // Step 7: Hotel
    hotel_booked:     savedProfile.hotel_booked     || '',
    hotel_name:       savedProfile.hotel_name       || '',
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // Load docs checklist from AI when reaching step 4
  useEffect(() => {
    if (step === 4 && docsList.length === 0 && visaName && country) {
      setDocsLoading(true);
      aiAPI.invoke(
        `You are a visa expert. List the required documents for "${visaName}" (${visaCode}) visa for ${country.name} for ${purpose || 'general'} purpose.
Respond ONLY with a JSON object:
{
  "documents": [
    { "id": string, "name": string, "description": string, "critical": boolean }
  ]
}`
      ).then(res => {
        setDocsList(res.documents || []);
        setDocsLoading(false);
      }).catch(() => setDocsLoading(false));
    }
  }, [step]);

  const toggleDoc = (id) => {
    setCheckedDocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allCriticalChecked = docsList
    .filter(d => d.critical)
    .every(d => checkedDocs[d.id]);

  // Validation per step
  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!form.full_name || !form.email || !form.phone || !form.nationality)
        return setError('All fields are required'), false;
    }
    if (step === 2) {
      if (!form.passport_number || !form.passport_expiry || !form.date_of_birth)
        return setError('All fields are required'), false;
    }
    if (step === 3) {
      if (!form.travel_date || !form.return_date)
        return setError('Both dates are required'), false;
      if (new Date(form.return_date) <= new Date(form.travel_date))
        return setError('Return date must be after travel date'), false;
    }
    if (step === 4) {
      if (!allCriticalChecked)
        return setError('Please confirm you have all critical documents before proceeding'), false;
    }
    if (step === 5) {
      if (!form.appointment_booked)
        return setError('Please indicate if you have booked a visa appointment'), false;
    }
    if (step === 6) {
      if (!form.flight_booked)
        return setError('Please indicate if you have booked your flight'), false;
    }
    if (step === 7) {
      if (!form.hotel_booked)
        return setError('Please indicate if you have booked your hotel/accommodation'), false;
    }
    return true;
  };

  // Save progress to DB (save as in_progress)
  const saveProgress = async (targetStep, finalStatus = 'in_progress') => {
    const payload = {
      country:      country?.id,
      visa_type:    visaName,
      purpose:      form.purpose || purpose,
      status:       finalStatus,
      current_step: targetStep,
      user_profile: form,
      documents_checklist: { docs: docsList, checked: checkedDocs },
    };
    if (appId) {
      await applicationsAPI.update(appId, payload);
    } else {
      const res = await applicationsAPI.create(payload);
      setAppId(res.id);
    }
  };

  const next = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      await saveProgress(step + 1);
      setStep(s => s + 1);
    } catch {
      setError('Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const back = () => { setError(''); setStep(s => s - 1); };

  const handleSaveAndExit = async () => {
    setLoading(true);
    try {
      await saveProgress(step);
      handleClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await saveProgress(8, 'submitted');
      setSubmitted(true);
    } catch {
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      if (!existingApplication) {
        setStep(1);
        setSubmitted(false);
        setCheckedDocs({});
        setDocsList([]);
        setAppId(null);
        setError('');
      }
    }, 300);
  };

  // ─── Not logged in ───────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Sign in to Apply</DialogTitle></DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-6">You need to sign in to submit a visa application.</p>
            <Button className="bg-primary text-white w-full h-11" onClick={() => { handleClose(); navigateToLogin(); }}>
              Sign In / Register
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Success screen ───────────────────────────────────────────
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-2">
              Your <span className="font-semibold text-foreground">{visaName}</span> application for{' '}
              <span className="font-semibold text-foreground">{country?.name}</span> has been submitted.
            </p>
            <p className="text-sm text-muted-foreground mb-8">You can track its status in your Profile page.</p>
            <div className="flex flex-col gap-3">
              <Button className="bg-primary text-white w-full" onClick={handleClose}>Close</Button>
              <Button variant="outline" className="w-full" onClick={() => { handleClose(); window.location.href = '/profile'; }}>
                View My Applications
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Main modal ───────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span>{country?.flag}</span>
              <span>Apply — {visaName}</span>
            </DialogTitle>
            {appId && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">In Progress</Badge>
            )}
          </div>
        </DialogHeader>

        {/* Step Progress Bar */}
        <div className="w-full bg-muted rounded-full h-1.5 mb-1">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Step {step} of {STEPS.length} — {STEPS[step - 1]?.title}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >

            {/* ── Step 1: Personal Info ── */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="As on passport" value={form.full_name} onChange={e => update('full_name', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" placeholder="you@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
                </div>
                <div>
                  <Label>Phone Number <span className="text-destructive">*</span></Label>
                  <Input placeholder="+91 9999999999" value={form.phone} onChange={e => update('phone', e.target.value)} />
                </div>
                <div>
                  <Label>Nationality <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. Indian" value={form.nationality} onChange={e => update('nationality', e.target.value)} />
                </div>
              </div>
            )}

            {/* ── Step 2: Passport ── */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Passport Number <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. A1234567" value={form.passport_number} onChange={e => update('passport_number', e.target.value)} />
                </div>
                <div>
                  <Label>Date of Birth <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
                </div>
                <div>
                  <Label>Passport Expiry <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.passport_expiry} onChange={e => update('passport_expiry', e.target.value)} />
                </div>
                <p className="col-span-2 text-xs text-muted-foreground bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                  ⚠️ Your passport must be valid for at least 6 months beyond your travel date.
                </p>
              </div>
            )}

            {/* ── Step 3: Travel Dates ── */}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Travel Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.travel_date} min={new Date().toISOString().split('T')[0]} onChange={e => update('travel_date', e.target.value)} />
                </div>
                <div>
                  <Label>Return Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.return_date} min={form.travel_date || new Date().toISOString().split('T')[0]} onChange={e => update('return_date', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Travel Purpose</Label>
                  <Select value={form.purpose} onValueChange={v => update('purpose', v)}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tourism">✈️ Tourism</SelectItem>
                      <SelectItem value="study">🎓 Study</SelectItem>
                      <SelectItem value="work">💼 Work</SelectItem>
                      <SelectItem value="business">🏢 Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ── Step 4: Documents Checklist ── */}
            {step === 4 && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Check off every document you have ready. You <strong>must</strong> have all critical documents before proceeding.
                </p>
                {docsLoading ? (
                  <div className="flex items-center justify-center py-10 gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                    <span className="text-sm text-muted-foreground">Loading required documents...</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {docsList.map(doc => (
                      <label
                        key={doc.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          checkedDocs[doc.id]
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <Checkbox
                          checked={!!checkedDocs[doc.id]}
                          onCheckedChange={() => toggleDoc(doc.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{doc.name}</span>
                            {doc.critical && (
                              <Badge className="bg-destructive/10 text-destructive border-0 text-xs">Required</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {!docsLoading && docsList.length > 0 && (
                  <p className={`text-xs mt-3 px-3 py-2 rounded-lg ${
                    allCriticalChecked
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {allCriticalChecked
                      ? '✅ All required documents confirmed. You can proceed.'
                      : '⚠️ Please check all Required documents before you can proceed.'}
                  </p>
                )}
              </div>
            )}

            {/* ── Step 5: Visa Appointment ── */}
            {step === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Have you booked your visa appointment at the embassy/consulate?</p>
                <div className="grid grid-cols-2 gap-3">
                  {['yes', 'no'].map(v => (
                    <button
                      key={v}
                      onClick={() => update('appointment_booked', v)}
                      className={`p-4 rounded-xl border-2 font-medium text-sm capitalize transition-all ${
                        form.appointment_booked === v
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/40 text-foreground'
                      }`}
                    >
                      {v === 'yes' ? '✅ Yes, booked' : '❌ Not yet'}
                    </button>
                  ))}
                </div>
                {form.appointment_booked === 'yes' && (
                  <div>
                    <Label>Appointment Date (optional)</Label>
                    <Input
                      type="date"
                      value={form.appointment_date}
                      onChange={e => update('appointment_date', e.target.value)}
                    />
                  </div>
                )}
                {form.appointment_booked === 'no' && (
                  <p className="text-xs bg-amber-50 border border-amber-100 text-amber-700 px-3 py-2 rounded-lg">
                    💡 You can still save this application and come back after booking your appointment.
                  </p>
                )}
              </div>
            )}

            {/* ── Step 6: Flight ── */}
            {step === 6 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Have you booked your flight ticket?</p>
                <div className="grid grid-cols-2 gap-3">
                  {['yes', 'no'].map(v => (
                    <button
                      key={v}
                      onClick={() => update('flight_booked', v)}
                      className={`p-4 rounded-xl border-2 font-medium text-sm transition-all ${
                        form.flight_booked === v
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/40 text-foreground'
                      }`}
                    >
                      {v === 'yes' ? '✈️ Yes, booked' : '❌ Not yet'}
                    </button>
                  ))}
                </div>
                {form.flight_booked === 'yes' && (
                  <div>
                    <Label>Flight Number (optional)</Label>
                    <Input
                      placeholder="e.g. AI202"
                      value={form.flight_number}
                      onChange={e => update('flight_number', e.target.value)}
                    />
                  </div>
                )}
                {form.flight_booked === 'no' && (
                  <p className="text-xs bg-amber-50 border border-amber-100 text-amber-700 px-3 py-2 rounded-lg">
                    💡 Many visa applications require confirmed flight bookings. You can still save and return later.
                  </p>
                )}
              </div>
            )}

            {/* ── Step 7: Hotel ── */}
            {step === 7 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Have you booked your hotel / accommodation?</p>
                <div className="grid grid-cols-2 gap-3">
                  {['yes', 'no'].map(v => (
                    <button
                      key={v}
                      onClick={() => update('hotel_booked', v)}
                      className={`p-4 rounded-xl border-2 font-medium text-sm transition-all ${
                        form.hotel_booked === v
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/40 text-foreground'
                      }`}
                    >
                      {v === 'yes' ? '🏨 Yes, booked' : '❌ Not yet'}
                    </button>
                  ))}
                </div>
                {form.hotel_booked === 'yes' && (
                  <div>
                    <Label>Hotel Name (optional)</Label>
                    <Input
                      placeholder="e.g. Marriott Downtown"
                      value={form.hotel_name}
                      onChange={e => update('hotel_name', e.target.value)}
                    />
                  </div>
                )}
                {form.hotel_booked === 'no' && (
                  <p className="text-xs bg-amber-50 border border-amber-100 text-amber-700 px-3 py-2 rounded-lg">
                    💡 Proof of accommodation is usually required. Save and come back once booked.
                  </p>
                )}
              </div>
            )}

            {/* ── Step 8: Confirm & Submit ── */}
            {step === 8 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-2">Review everything before submitting.</p>
                <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                  {[
                    { label: 'Destination',       value: `${country?.flag} ${country?.name}` },
                    { label: 'Visa Type',          value: `${visaName} (${visaCode})` },
                    { label: 'Full Name',          value: form.full_name },
                    { label: 'Email',              value: form.email },
                    { label: 'Phone',              value: form.phone },
                    { label: 'Nationality',        value: form.nationality },
                    { label: 'Passport No.',       value: form.passport_number },
                    { label: 'Date of Birth',      value: form.date_of_birth },
                    { label: 'Passport Expiry',    value: form.passport_expiry },
                    { label: 'Travel Date',        value: form.travel_date },
                    { label: 'Return Date',        value: form.return_date },
                    { label: 'Purpose',            value: form.purpose },
                    { label: 'Visa Appointment',   value: form.appointment_booked === 'yes' ? `✅ Booked${form.appointment_date ? ` (${form.appointment_date})` : ''}` : '❌ Not yet' },
                    { label: 'Flight',             value: form.flight_booked === 'yes' ? `✅ Booked${form.flight_number ? ` — ${form.flight_number}` : ''}` : '❌ Not yet' },
                    { label: 'Hotel',              value: form.hotel_booked === 'yes' ? `✅ Booked${form.hotel_name ? ` — ${form.hotel_name}` : ''}` : '❌ Not yet' },
                    { label: 'Docs Checked',       value: `${Object.values(checkedDocs).filter(Boolean).length} / ${docsList.length}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-medium text-foreground text-right max-w-[55%] truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mt-2">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex gap-2 mt-3">
          {step > 1 && (
            <Button variant="outline" onClick={back} className="h-11 px-4" disabled={loading}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}

          {/* Save & Exit button (available from step 2 onwards) */}
          {step > 1 && step < 8 && (
            <Button variant="outline" onClick={handleSaveAndExit} className="h-11 px-4 gap-1" disabled={loading}>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Save & Exit</span>
            </Button>
          )}

          {step < 8 ? (
            <Button onClick={next} disabled={loading} className="flex-1 h-11 bg-primary text-white hover:bg-primary/90">
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Next</span><ArrowRight className="w-4 h-4 ml-1" /></>
              }
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : null}
              Submit Application
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
