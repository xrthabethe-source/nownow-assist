import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

// Pages
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import CustomerHome from "./pages/customer/CustomerHome";
import CustomerHistory from "./pages/customer/CustomerHistory";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerSupport from "./pages/customer/CustomerSupport";
import ServiceRequest from "./pages/customer/ServiceRequest";
import LiveTracking from "./pages/customer/LiveTracking";
import DriverHome from "./pages/driver/DriverHome";
import DriverEarnings from "./pages/driver/DriverEarnings";
import ActiveJob from "./pages/driver/ActiveJob";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminServices from "./pages/admin/AdminServices";
import AdminPricing from "./pages/admin/AdminPricing";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminReports from "./pages/admin/AdminReports";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminActiveJobs from "./pages/admin/AdminActiveJobs";
import AdminCompletedJobs from "./pages/admin/AdminCompletedJobs";
import AdminOnlineDrivers from "./pages/admin/AdminOnlineDrivers";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminSLA from "./pages/admin/AdminSLA";
import AdminLiveMap from "./pages/admin/AdminLiveMap";
import AdminNotifications from "./pages/admin/AdminNotifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/welcome" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Customer Routes - Protected for customers */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <CustomerHome />
              </ProtectedRoute>
            } />
            <Route path="/customer/history" element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <CustomerHistory />
              </ProtectedRoute>
            } />
            <Route path="/customer/profile" element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <CustomerProfile />
              </ProtectedRoute>
            } />
            <Route path="/customer/support" element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <CustomerSupport />
              </ProtectedRoute>
            } />
            <Route path="/customer/request/:serviceId" element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <ServiceRequest />
              </ProtectedRoute>
            } />
            <Route path="/customer/tracking" element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <LiveTracking />
              </ProtectedRoute>
            } />
            
            {/* Driver Routes - Protected for drivers */}
            <Route path="/driver" element={
              <ProtectedRoute allowedRoles={['driver', 'admin']}>
                <DriverHome />
              </ProtectedRoute>
            } />
            <Route path="/driver/earnings" element={
              <ProtectedRoute allowedRoles={['driver', 'admin']}>
                <DriverEarnings />
              </ProtectedRoute>
            } />
            <Route path="/driver/job/active" element={
              <ProtectedRoute allowedRoles={['driver', 'admin']}>
                <ActiveJob />
              </ProtectedRoute>
            } />
            <Route path="/driver/support" element={
              <ProtectedRoute allowedRoles={['driver', 'admin']}>
                <CustomerSupport />
              </ProtectedRoute>
            } />
            <Route path="/driver/profile" element={
              <ProtectedRoute allowedRoles={['driver', 'admin']}>
                <CustomerProfile />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes - Protected for admins only */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/drivers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDrivers />
              </ProtectedRoute>
            } />
            <Route path="/admin/roles" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRoles />
              </ProtectedRoute>
            } />
            <Route path="/admin/services" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminServices />
              </ProtectedRoute>
            } />
            <Route path="/admin/pricing" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPricing />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPayments />
              </ProtectedRoute>
            } />
            <Route path="/admin/disputes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDisputes />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReports />
              </ProtectedRoute>
            } />
            <Route path="/admin/audit" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAudit />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/active-jobs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminActiveJobs />
              </ProtectedRoute>
            } />
            <Route path="/admin/completed-jobs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCompletedJobs />
              </ProtectedRoute>
            } />
            <Route path="/admin/online-drivers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminOnlineDrivers />
              </ProtectedRoute>
            } />
            <Route path="/admin/revenue" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRevenue />
              </ProtectedRoute>
            } />
            <Route path="/admin/sla" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSLA />
              </ProtectedRoute>
            } />
            <Route path="/admin/live-map" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLiveMap />
              </ProtectedRoute>
            } />
            <Route path="/admin/notifications" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminNotifications />
              </ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
