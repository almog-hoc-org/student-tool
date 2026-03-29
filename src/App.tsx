import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ScrollToTop } from "@/components/ScrollToTop";
import BudgetCalculator from "./pages/BudgetCalculator";
import BusinessPlan from "./pages/BusinessPlan";
import MortgageCalculator from "./pages/MortgageCalculator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="*" element={
            <Layout>
              <div className="animate-fade-in">
                <Routes>
                  <Route path="/" element={<BudgetCalculator />} />
                  <Route path="/business-plan" element={<BusinessPlan />} />
                  <Route path="/mortgage" element={<MortgageCalculator />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
