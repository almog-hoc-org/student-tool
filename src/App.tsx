import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FinancialCheckup from "./pages/FinancialCheckup";
import DealBusinessPlan from "./pages/DealBusinessPlan";
import MortgageCalculator from "./pages/MortgageCalculator";
import PropertyVisit from "./pages/PropertyVisit";
import RenovationFeasibility from "./pages/RenovationFeasibility";
import UrbanRenewal from "./pages/UrbanRenewal";
import TransactionTimeline from "./pages/TransactionTimeline";
import History from "./pages/History";
import Dashboard from "./pages/Dashboard";
import Glossary from "./pages/Glossary";
import PurchaseTaxCalculator from "./pages/PurchaseTaxCalculator";
import Summary from "./pages/Summary";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DashboardProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={
              <Layout>
                <div className="animate-fade-in">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/financial-checkup" element={<FinancialCheckup />} />
                    <Route path="/deal-business-plan" element={<DealBusinessPlan />} />
                    <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
                    <Route path="/property-visit" element={<PropertyVisit />} />
                    <Route path="/renovation-feasibility" element={<RenovationFeasibility />} />
                    <Route path="/urban-renewal" element={<UrbanRenewal />} />
                    <Route path="/transaction-timeline" element={<TransactionTimeline />} />
                    <Route path="/summary" element={<Summary />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/glossary" element={<Glossary />} />
                    <Route path="/purchase-tax" element={<PurchaseTaxCalculator />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </Layout>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </DashboardProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
