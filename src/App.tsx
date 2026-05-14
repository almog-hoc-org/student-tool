import { lazy, Suspense } from "react";
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
import Login from "./pages/Login";
import PendingApproval from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";

// Heavy / less-frequent routes — split into separate chunks.
const BusinessPlan = lazy(() => import("./pages/BusinessPlan"));
const MortgageCalculator = lazy(() => import("./pages/MortgageCalculator"));
const AIAdvisor = lazy(() => import("./pages/AIAdvisor"));
const Chat = lazy(() => import("./pages/Chat"));
const Account = lazy(() => import("./pages/Account"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminInviteCodes = lazy(() => import("./pages/admin/AdminInviteCodes"));
const AdminInbox = lazy(() => import("./pages/admin/AdminInbox"));
const AdminBroadcasts = lazy(() => import("./pages/admin/AdminBroadcasts"));

const queryClient = new QueryClient({});

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
      טוען…
    </div>
  );
}

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
                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        <Route path="/" element={<BudgetCalculator />} />
                        <Route path="/business-plan" element={<BusinessPlan />} />
                        <Route path="/mortgage" element={<MortgageCalculator />} />
                        <Route path="/advisor" element={<AIAdvisor />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                        <Route path="/admin/codes" element={<AdminRoute><AdminInviteCodes /></AdminRoute>} />
                        <Route path="/admin/inbox" element={<AdminRoute><AdminInbox /></AdminRoute>} />
                        <Route path="/admin/broadcasts" element={<AdminRoute><AdminBroadcasts /></AdminRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
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
