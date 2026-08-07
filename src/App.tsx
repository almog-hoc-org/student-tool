import { Suspense } from "react";
import { lazyWithReload as lazy } from "@/lib/lazy-with-reload";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import BudgetCalculator from "./pages/BudgetCalculator";
import Login from "./pages/Login";
import PendingApproval from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";

// Heavy / less-frequent routes — split into separate chunks.
const BusinessPlan = lazy(() => import("./pages/BusinessPlan"));
const MortgageCalculator = lazy(() => import("./pages/MortgageCalculator"));
const PropertyCheck = lazy(() => import("./pages/PropertyCheck"));
const Chat = lazy(() => import("./pages/Chat"));
const DealComparison = lazy(() => import("./pages/DealComparison"));
const Account = lazy(() => import("./pages/Account"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminInviteCodes = lazy(() => import("./pages/admin/AdminInviteCodes"));
const AdminInbox = lazy(() => import("./pages/admin/AdminInbox"));
const AdminBroadcasts = lazy(() => import("./pages/admin/AdminBroadcasts"));
const AdminKnowledge = lazy(() => import("./pages/admin/AdminKnowledge"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const UsageGuide = lazy(() => import("./pages/UsageGuide"));
const TransactionTimeline = lazy(() => import("./pages/TransactionTimeline"));
const CapitalGainsCalculator = lazy(() => import("./pages/CapitalGainsCalculator"));

const queryClient = new QueryClient({});

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
      טוען…
    </div>
  );
}

const App = () => (
  <ErrorBoundary title="משהו השתבש" description="רענן את העמוד כדי להמשיך. הנתונים שלך שמורים.">
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
                    <ErrorBoundary title="העמוד נתקל בשגיאה" description="רענן את העמוד כדי להמשיך. הנתונים שלך נשמרים אוטומטית ולא הלכו לאיבוד.">
                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        <Route path="/" element={<BudgetCalculator />} />
                        <Route path="/business-plan" element={<BusinessPlan />} />
                        <Route path="/mortgage" element={<MortgageCalculator />} />
                        <Route path="/property-check" element={<PropertyCheck />} />
                        <Route path="/advisor" element={<Navigate to="/chat" replace />} />
                        <Route path="/chat" element={<ErrorBoundary title="הצ׳אט נתקל בשגיאה" description="רענן את העמוד. אם זה חוזר, הודעה בעייתית תבודד במקום להפיל את כל המסך."><Chat /></ErrorBoundary>} />
                        <Route path="/deal-comparison" element={<DealComparison />} />
                        <Route path="/timeline" element={<TransactionTimeline />} />
                        <Route path="/capital-gains" element={<CapitalGainsCalculator />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/onboarding" element={<Onboarding />} />
                        <Route path="/guide" element={<UsageGuide />} />
                        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                        <Route path="/admin/codes" element={<AdminRoute><AdminInviteCodes /></AdminRoute>} />
                        <Route path="/admin/inbox" element={<AdminRoute><AdminInbox /></AdminRoute>} />
                        <Route path="/admin/broadcasts" element={<AdminRoute><AdminBroadcasts /></AdminRoute>} />
                        <Route path="/admin/knowledge" element={<AdminRoute><AdminKnowledge /></AdminRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    </ErrorBoundary>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
