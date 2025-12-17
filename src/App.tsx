import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import LandingPage from "./pages/LandingPage";
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
        <Routes>
          {/* Customer Routes - Home is default */}
          <Route path="/" element={<CustomerHome />} />
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/customer/history" element={<CustomerHistory />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/support" element={<CustomerSupport />} />
          <Route path="/customer/request/:serviceId" element={<ServiceRequest />} />
          <Route path="/customer/tracking" element={<LiveTracking />} />
          
          {/* Driver Routes */}
          <Route path="/driver" element={<DriverHome />} />
          <Route path="/driver/earnings" element={<DriverEarnings />} />
          <Route path="/driver/job/active" element={<ActiveJob />} />
          <Route path="/driver/support" element={<CustomerSupport />} />
          <Route path="/driver/profile" element={<CustomerProfile />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
