import { Suspense, lazy } from "react";
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
import { Loader2 } from "lucide-react";

// Auth-related pages eager (small + always on entry)
import Login from "./pages/Login";
import PendingApproval from "./pages/PendingApproval";

// Student-facing pages: lazy
const BudgetCalculator = lazy(() => import("./pages/BudgetCalculator"));
const BusinessPlan = lazy(() => import("./pages/BusinessPlan"));
const MortgageCalculator = lazy(() => import("./pages/MortgageCalculator"));
const AIAdvisor = lazy(() => import("./pages/AIAdvisor"));
const Chat = lazy(() => import("./pages/Chat"));
const Account = lazy(() => import("./pages/Account"));
const Support = lazy(() => import("./pages/Support"));
const Learn = lazy(() => import("./pages/Learn"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Lesson = lazy(() => import("./pages/Lesson"));

// Admin pages: lazy, separate chunk (most users never load these)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminInviteCodes = lazy(() => import("./pages/admin/AdminInviteCodes"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminCohorts = lazy(() => import("./pages/admin/AdminCohorts"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));

const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({});

function RouteFallback() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
                        <Route path="/support" element={<Support />} />
                        <Route path="/learn" element={<Learn />} />
                        <Route path="/learn/:courseSlug" element={<CourseDetail />} />
                        <Route path="/learn/:courseSlug/:moduleSlug/:lessonSlug" element={<Lesson />} />
                        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                        <Route path="/admin/users/:userId" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
                        <Route path="/admin/codes" element={<AdminRoute><AdminInviteCodes /></AdminRoute>} />
                        <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
                        <Route path="/admin/cohorts" element={<AdminRoute><AdminCohorts /></AdminRoute>} />
                        <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
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
