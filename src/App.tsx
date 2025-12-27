import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
