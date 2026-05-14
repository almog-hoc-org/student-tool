import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import BudgetCalculator from "./pages/BudgetCalculator";
import BusinessPlan from "./pages/BusinessPlan";
import MortgageCalculator from "./pages/MortgageCalculator";
import Login from "./pages/Login";
import PendingApproval from "./pages/PendingApproval";
import AIAdvisor from "./pages/AIAdvisor";
import Chat from "./pages/Chat";
import Account from "./pages/Account";
import Support from "./pages/Support";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminInviteCodes from "./pages/admin/AdminInviteCodes";
import AdminSupport from "./pages/admin/AdminSupport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/pending" element={<PendingApproval />} />
            <Route path="*" element={
              <ProtectedRoute>
                <Layout>
                  <div className="animate-fade-in">
                    <Routes>
                      <Route path="/" element={<BudgetCalculator />} />
                      <Route path="/business-plan" element={<BusinessPlan />} />
                      <Route path="/mortgage" element={<MortgageCalculator />} />
                      <Route path="/advisor" element={<AIAdvisor />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                      <Route path="/admin/codes" element={<AdminRoute><AdminInviteCodes /></AdminRoute>} />
                      <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
