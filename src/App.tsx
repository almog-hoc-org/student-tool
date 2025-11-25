import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import FinancialCheckup from "./pages/FinancialCheckup";
import DealBusinessPlan from "./pages/DealBusinessPlan";
import MortgageCalculator from "./pages/MortgageCalculator";
import PropertyVisit from "./pages/PropertyVisit";
import RenovationFeasibility from "./pages/RenovationFeasibility";
import UrbanRenewal from "./pages/UrbanRenewal";
import TransactionTimeline from "./pages/TransactionTimeline";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Layout>
          <div className="animate-fade-in">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/financial-checkup" element={<FinancialCheckup />} />
              <Route path="/deal-business-plan" element={<DealBusinessPlan />} />
              <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
              <Route path="/property-visit" element={<PropertyVisit />} />
              <Route path="/renovation-feasibility" element={<RenovationFeasibility />} />
              <Route path="/urban-renewal" element={<UrbanRenewal />} />
              <Route path="/transaction-timeline" element={<TransactionTimeline />} />
              <Route path="/history" element={<History />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
