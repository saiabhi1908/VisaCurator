import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { applicationsAPI } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, FileText, Clock, CheckCircle2, XCircle, LogOut, Globe, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { countries } from '@/lib/visaData';
import { Link } from 'react-router-dom';
import ApplyModal from '@/pages/ApplyModal';

const statusConfig = {
  draft:       { color: 'bg-muted text-muted-foreground',   label: 'Draft',       icon: Clock },
  in_progress: { color: 'bg-blue-100 text-blue-700',        label: 'In Progress', icon: Clock },
  submitted:   { color: 'bg-amber-100 text-amber-700',      label: 'Submitted',   icon: FileText },
  approved:    { color: 'bg-emerald-100 text-emerald-700',  label: 'Approved',    icon: CheckCircle2 },
  rejected:    { color: 'bg-red-100 text-red-700',          label: 'Rejected',    icon: XCircle },
};

export default function Profile() {
  const { user, logout, isAuthenticated } = useAuth();

  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);

  // Resume modal state
  const [resumeApp, setResumeApp]       = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);

  const loadApplications = () => {
    applicationsAPI.list()
      .then(data => setApplications(data))
      .catch(() => setApplications([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) { setIsLoading(false); return; }
    loadApplications();
  }, [isAuthenticated]);

  const handleContinue = (app) => {
    setResumeApp(app);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setResumeApp(null);
    // Refresh list so status/step updates are reflected
    loadApplications();
  };

  const stats = {
    total:      applications.length,
    approved:   applications.filter(a => a.status === 'approved').length,
    inProgress: applications.filter(a => ['draft', 'in_progress'].includes(a.status)).length,
    submitted:  applications.filter(a => a.status === 'submitted').length,
    avgRisk:    applications.filter(a => a.risk_score).length > 0
      ? Math.round(applications.filter(a => a.risk_score).reduce((s, a) => s + a.risk_score, 0) / applications.filter(a => a.risk_score).length)
      : 0,
  };

  // Parse the saved country + visa info from a resumed application
  const getResumeProps = (app) => {
    const country = countries.find(x => x.id === app.country);
    return {
      country,
      visaName: app.visa_type,
      visaCode: app.user_profile?.visa_code || '',
      purpose:  app.purpose,
      existingApplication: {
        ...app,
        // Ensure JSON fields are strings (backend returns them parsed already in some configs)
        user_profile: typeof app.user_profile === 'string'
          ? app.user_profile
          : JSON.stringify(app.user_profile || {}),
        documents_checklist: typeof app.documents_checklist === 'string'
          ? app.documents_checklist
          : JSON.stringify(app.documents_checklist || {}),
      },
    };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold font-display shrink-0">
          {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">{user?.full_name || 'User'}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Member since {user?.created_date ? format(new Date(user.created_date), 'MMMM yyyy') : 'recently'}
          </p>
        </div>
        <Button variant="outline" className="text-muted-foreground" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Applications', value: stats.total,      icon: FileText,    color: 'text-primary' },
          { label: 'Approved',     value: stats.approved,   icon: CheckCircle2,color: 'text-emerald-600' },
          { label: 'In Progress',  value: stats.inProgress, icon: Clock,       color: 'text-blue-600' },
          { label: 'Submitted',    value: stats.submitted,  icon: FileText,    color: 'text-amber-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card>
              <CardContent className="p-5 text-center">
                <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Applications */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">My Applications</h2>
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading...</div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-6">Start exploring destinations and check your visa chances.</p>
              <Link to="/destinations">
                <Button className="bg-primary hover:bg-primary/90 text-white">Explore Destinations</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app, i) => {
              const c  = countries.find(x => x.id === app.country);
              const sc = statusConfig[app.status] || statusConfig.draft;
              const canResume = ['draft', 'in_progress'].includes(app.status);

              return (
                <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{c?.flag || '🌍'}</span>
                        <div>
                          <p className="font-medium text-foreground">{c?.name || app.country} — {app.visa_type}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {app.purpose} • {format(new Date(app.created_date), 'MMM d, yyyy')}
                          </p>
                          {canResume && (
                            <p className="text-xs text-blue-600 mt-0.5">
                              Saved at step {app.current_step} of 8
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {app.risk_score && (
                          <span className="text-sm font-semibold text-secondary">{app.risk_score}%</span>
                        )}
                        <Badge className={`${sc.color} border-0`}>{sc.label}</Badge>

                        {/* Continue button for draft / in_progress */}
                        {canResume && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                            onClick={() => handleContinue(app)}
                          >
                            <PlayCircle className="w-4 h-4" />
                            Continue
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resume ApplyModal */}
      {resumeApp && (
        <ApplyModal
          open={modalOpen}
          onClose={handleModalClose}
          {...getResumeProps(resumeApp)}
        />
      )}
    </div>
  );
}
