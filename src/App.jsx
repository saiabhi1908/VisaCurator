import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AuthModal from '@/components/AuthModal';
import AppLayout from '@/components/layout/AppLayout';
import DocumentScanner from '@/pages/DocumentScanner';
import VisaMates from '@/pages/VisaMates';
import Home from '@/pages/Home';
import ItineraryGenerator from '@/pages/ItineraryGenerator';
import Destinations from '@/pages/Destinations';
import VisaRecommendation from '@/pages/VisaRecommendation';
import VisaDetails from '@/pages/VisaDetails';
import RiskChecker from '@/pages/RiskChecker';
import DocumentChecklist from '@/pages/DocumentChecklist';
import VisaTypes from '@/pages/VisaTypes';
import HowItWorks from '@/pages/HowItWorks';
import Chatbot from '@/components/Chatbot';
import Profile from '@/pages/Profile';

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <AuthModal />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/visa-recommendation" element={<VisaRecommendation />} />
          <Route path="/visa-details" element={<VisaDetails />} />
          <Route path="/risk-checker" element={<RiskChecker />} />
          <Route path="/document-checklist" element={<DocumentChecklist />} />
          <Route path="/itinerary" element={<ItineraryGenerator />} />
          <Route path="/document-scanner" element={<DocumentScanner />} />
          <Route path="/visa-types" element={<VisaTypes />} />
          <Route path="/visamates" element={<VisaMates />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <Chatbot /> {/* ← added here */}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;