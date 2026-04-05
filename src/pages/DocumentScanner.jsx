import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { documentScanAPI } from '@/api/client';
import { countries } from '@/lib/visaData';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Upload, FileText, Image, X, CheckCircle2,
  AlertTriangle, XCircle, Loader2, Shield,
  ChevronDown, ChevronUp, File, ScanLine
} from 'lucide-react';

const statusConfig = {
  valid:   { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2, label: 'Valid' },
  warning: { color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     icon: AlertTriangle, label: 'Needs Attention' },
  invalid: { color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         icon: XCircle,       label: 'Invalid' },
};

const checkStatusConfig = {
  pass: { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2 },
  warn: { color: 'text-amber-600',   bg: 'bg-amber-100',   icon: AlertTriangle },
  fail: { color: 'text-red-600',     bg: 'bg-red-100',     icon: XCircle },
};

const overallConfig = {
  valid:   { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300',  icon: CheckCircle2,  text: 'All Documents Look Good!' },
  warning: { color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-300',      icon: AlertTriangle, text: 'Some Documents Need Attention' },
  invalid: { color: 'text-red-700',     bg: 'bg-red-50 border-red-300',          icon: XCircle,       text: 'Issues Found in Your Documents' },
};

const visaTypes = [
  'Tourist Visa', 'Student Visa (F-1)', 'Student Visa (Tier 4)',
  'Work Visa (H-1B)', 'Skilled Worker Visa', 'Business Visa',
  'PR Application', 'Digital Nomad Visa', 'Golden Visa',
  'Study Permit', 'Employment Pass',
];

const purposes = ['tourism', 'study', 'work', 'business'];

function FileCard({ file, onRemove }) {
  const isImage = file.type.startsWith('image/');
  const sizeKB = (file.size / 1024).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {isImage
          ? <Image className="w-5 h-5 text-primary" />
          : <FileText className="w-5 h-5 text-primary" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{sizeKB} KB • {isImage ? 'Image' : 'PDF'}</p>
      </div>
      <button
        onClick={() => onRemove(file.name)}
        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function DocumentResult({ doc, index }) {
  const [expanded, setExpanded] = useState(true);
  const config = statusConfig[doc.status] || statusConfig.warning;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`border rounded-2xl overflow-hidden ${config.bg}`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          doc.status === 'valid' ? 'bg-emerald-100' :
          doc.status === 'warning' ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{doc.document_type || doc.filename}</p>
            <Badge className={`border-0 text-xs ${
              doc.status === 'valid' ? 'bg-emerald-100 text-emerald-700' :
              doc.status === 'warning' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {config.label}
            </Badge>
            {doc.confidence > 0 && (
              <span className="text-xs text-muted-foreground">
                {doc.confidence}% confidence
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{doc.summary}</p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        }
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Checks */}
              {doc.checks?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Verification Checks
                  </p>
                  <div className="space-y-2">
                    {doc.checks.map((check, i) => {
                      const cc = checkStatusConfig[check.status] || checkStatusConfig.warn;
                      const CIcon = cc.icon;
                      return (
                        <div key={i} className="flex items-start gap-3 bg-white/70 rounded-xl p-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cc.bg}`}>
                            <CIcon className={`w-3.5 h-3.5 ${cc.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{check.label}</p>
                            <p className="text-xs text-muted-foreground">{check.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Issues */}
              {doc.issues?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Issues Found
                  </p>
                  <div className="space-y-1.5">
                    {doc.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {doc.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Recommendations
                  </p>
                  <div className="space-y-1.5">
                    {doc.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DocumentScanner() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [files, setFiles] = useState([]);
  const [country, setCountry] = useState('');
  const [visaType, setVisaType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);
    const valid = fileArray.filter(f =>
      ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(f.type)
    );
    setFiles(prev => {
      const existing = prev.map(f => f.name);
      const unique = valid.filter(f => !existing.includes(f.name));
      return [...prev, ...unique];
    });
  };

  const removeFile = (name) => {
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleScan = async () => {
    if (!isAuthenticated) { navigateToLogin(); return; }
    if (files.length === 0) { setError('Please upload at least one document'); return; }
    if (!country) { setError('Please select a country'); return; }
    if (!visaType) { setError('Please select a visa type'); return; }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('documents', f));
      formData.append('country', country);
      formData.append('visa_type', visaType);
      formData.append('purpose', purpose);

      const data = await documentScanAPI.scan(formData);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to scan documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setError('');
  };

  const overall = result ? overallConfig[result.overall_status] : null;
  const OIcon = overall?.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm mb-4">
          <ScanLine className="w-4 h-4" /> AI Document Scanner
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          Visa Document Checker
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Upload your documents and AI will verify if they meet the requirements for your specific visa and country.
        </p>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Country + Visa Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-secondary" />
                Visa Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block">Destination Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Visa Type</Label>
                <Select value={visaType} onValueChange={setVisaType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    {visaTypes.map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Purpose</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {purposes.map(p => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-secondary" />
                Upload Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={e => handleFiles(e.target.files)}
                />
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-base font-semibold text-foreground mb-1">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports JPG, PNG, PDF • Max 10MB per file • Up to 10 documents
                </p>
              </div>

              {/* Suggested Documents */}
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Common documents to upload:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Passport', 'Bank Statement', 'Admission Letter',
                    'Employment Letter', 'Travel Insurance', 'Itinerary',
                    'Invitation Letter', 'Financial Documents', 'Photo'
                  ].map(doc => (
                    <span key={doc} className="text-xs bg-background border border-border px-2 py-1 rounded-full text-foreground">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Uploaded Files */}
              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {files.length} file{files.length > 1 ? 's' : ''} ready to scan
                    </p>
                    {files.map(file => (
                      <FileCard key={file.name} file={file} onRemove={removeFile} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                onClick={handleScan}
                disabled={loading || files.length === 0}
                className="w-full h-14 bg-secondary hover:bg-secondary/90 text-white text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Scanning {files.length} document{files.length > 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-5 h-5 mr-2" />
                    Scan Documents
                  </>
                )}
              </Button>

              {loading && (
                <p className="text-center text-sm text-muted-foreground">
                  AI is reading and verifying each document. This may take 10-30 seconds...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Overall Status */}
          <div className={`border-2 rounded-2xl p-6 ${overall?.bg}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  result.overall_status === 'valid' ? 'bg-emerald-100' :
                  result.overall_status === 'warning' ? 'bg-amber-100' : 'bg-red-100'
                }`}>
                  {OIcon && <OIcon className={`w-7 h-7 ${overall?.color}`} />}
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${overall?.color}`}>{overall?.text}</h2>
                  <p className="text-sm text-muted-foreground">
                    {result.country} • {result.visa_type} • {result.total_documents} document{result.total_documents > 1 ? 's' : ''} scanned
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{result.valid_count}</p>
                    <p className="text-xs text-muted-foreground">Valid</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{result.warning_count}</p>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{result.invalid_count}</p>
                    <p className="text-xs text-muted-foreground">Invalid</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Document Analysis</h3>
            {result.documents.map((doc, i) => (
              <DocumentResult key={i} doc={doc} index={i} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 h-12"
            >
              <Upload className="w-4 h-4 mr-2" /> Scan More Documents
            </Button>
            <Button
              onClick={() => window.print()}
              className="flex-1 h-12 bg-primary text-white"
            >
              <File className="w-4 h-4 mr-2" /> Save Report
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}