import jsPDF from 'jspdf';

export const exportAIPromptPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const addPage = () => {
    doc.addPage();
    yPos = margin;
  };

  const checkPageBreak = (height: number) => {
    if (yPos + height > pageHeight - margin) {
      addPage();
    }
  };

  const addTitle = (text: string, size: number = 24) => {
    checkPageBreak(size + 10);
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93); // Deep Trust Blue
    doc.text(text, margin, yPos);
    yPos += size * 0.5 + 5;
  };

  const addSubtitle = (text: string, size: number = 16) => {
    checkPageBreak(size + 8);
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text(text, margin, yPos);
    yPos += size * 0.4 + 4;
  };

  const addText = (text: string, size: number = 10) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      checkPageBreak(size * 0.5);
      doc.text(line, margin, yPos);
      yPos += size * 0.5;
    });
    yPos += 3;
  };

  const addBullet = (text: string, size: number = 10) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, contentWidth - 10);
    lines.forEach((line: string, index: number) => {
      checkPageBreak(size * 0.5);
      if (index === 0) {
        doc.text('•', margin, yPos);
      }
      doc.text(line, margin + 8, yPos);
      yPos += size * 0.5;
    });
  };

  const addSpacer = (height: number = 5) => {
    yPos += height;
  };

  const addDivider = () => {
    checkPageBreak(10);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  };

  // Cover Page
  doc.setFillColor(26, 54, 93);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('NowNow Assist', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text('Complete AI Design Prompt', pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('"Help is on the Way"', pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

  // Brand Identity
  addPage();
  addTitle('Brand Identity');
  addDivider();
  addText('Name: NowNow Assist');
  addText('Tagline: "Help is on the Way"');
  addText('Industry: Roadside Assistance Service');
  addText('Location: South Africa');
  addText('Contact: support@nownowassist.co.za');
  addSpacer(10);

  addSubtitle('Brand Colors & Design System');
  addBullet('Deep Trust Blue (#1a365d) - Primary brand color representing reliability and trust');
  addBullet('Safety Orange (#f97316) - Accent color for CTAs and urgent actions');
  addBullet('Success Green - For confirmations and positive states');
  addBullet('Alert Red - For errors and urgent warnings');
  addSpacer(5);

  addSubtitle('Design Philosophy');
  addBullet('Clean, Modern, Professional - Trustworthy appearance for emergency situations');
  addBullet('Mobile-First - Optimized for users stranded on the roadside');
  addBullet('High Contrast - Easy to read in bright daylight or at night');
  addBullet('Accessible - Large touch targets, clear typography');
  addSpacer(10);

  // Application Overview
  addTitle('Application Overview');
  addDivider();
  addText('NowNow Assist is a comprehensive roadside assistance platform connecting stranded motorists with verified service providers (drivers/responders). The app features three distinct user portals:');
  addSpacer(5);
  addBullet('Customer Portal - For motorists requesting assistance');
  addBullet('Driver Portal - For service providers/responders');
  addBullet('Admin Portal - For platform management');
  addSpacer(10);

  // User Roles
  addTitle('User Roles & Permissions');
  addDivider();
  
  addSubtitle('Customer Role');
  addBullet('Request roadside assistance services');
  addBullet('Track responder location in real-time');
  addBullet('Manage saved locations and vehicles');
  addBullet('View service history');
  addBullet('Rate and review completed services');
  addBullet('Access AI-powered support chat');
  addBullet('Secure in-app messaging with drivers');
  addBullet('Manage payment methods');
  addSpacer(5);

  addSubtitle('Driver Role');
  addBullet('Accept/decline job requests');
  addBullet('Navigate to customer locations');
  addBullet('Update job status (en route, arrived, in progress, completed)');
  addBullet('View earnings and request payouts');
  addBullet('Manage availability (online/offline toggle)');
  addBullet('Secure communication with customers');
  addBullet('View job history and ratings');
  addSpacer(5);

  addSubtitle('Admin Role');
  addBullet('Full dashboard with analytics');
  addBullet('User management (customers & drivers)');
  addBullet('Driver verification and document review');
  addBullet('Service and pricing management');
  addBullet('Dispute resolution');
  addBullet('Payment oversight');
  addBullet('Live map of all active jobs');
  addBullet('SLA monitoring and audit logs');
  addSpacer(10);

  // Services
  addPage();
  addTitle('Services Offered');
  addDivider();
  addBullet('Jump Start - Battery jump start assistance');
  addBullet('Tyre Change - Flat tyre replacement');
  addBullet('Fuel Delivery - Emergency fuel delivery');
  addBullet('Tyre Inflate - Tyre inflation assistance');
  addBullet('Minor Roadside Assistance - On-site minor mechanical help');
  addSpacer(5);

  addSubtitle('Service Attributes');
  addBullet('Base price per service');
  addBullet('Price per kilometer (distance-based pricing)');
  addBullet('Estimated arrival time (ETA)');
  addBullet('Surge multiplier for high-demand periods');
  addBullet('Service availability toggle');
  addSpacer(10);

  // Customer Portal
  addTitle('Customer Portal Features');
  addDivider();
  
  addSubtitle('Home Screen');
  addBullet('Quick service selection grid with icons');
  addBullet('Location selector (GPS or saved locations)');
  addBullet('Active job status card (if applicable)');
  addBullet('Recent activity summary');
  addSpacer(5);

  addSubtitle('Service Request Flow');
  addText('1. Select service type → 2. Confirm/adjust pickup location → 3. Add vehicle details (optional) → 4. Add notes for responder → 5. View price estimate → 6. Confirm request → 7. Wait for driver acceptance');
  addSpacer(5);

  addSubtitle('Live Tracking');
  addBullet('Real-time map showing responder location');
  addBullet('ETA countdown');
  addBullet('Driver details (name, photo, vehicle, rating)');
  addBullet('Secure call and chat buttons');
  addBullet('Job status updates and cancel option');
  addSpacer(5);

  addSubtitle('Profile Management');
  addBullet('Personal information and profile photo');
  addBullet('Saved locations (Home, Work, custom)');
  addBullet('Vehicle management');
  addBullet('Payment methods');
  addBullet('Privacy & security settings');
  addSpacer(5);

  addSubtitle('Support');
  addBullet('AI-powered chat assistant (Lovable AI integration)');
  addBullet('FAQ section with 12+ detailed entries');
  addBullet('Email support option');
  addBullet('Report an issue functionality');
  addSpacer(10);

  // Driver Portal
  addPage();
  addTitle('Driver Portal Features');
  addDivider();

  addSubtitle('Home Screen');
  addBullet('Online/Offline toggle (prominent)');
  addBullet('Today\'s and weekly earnings summary');
  addBullet('Pending payments indicator');
  addBullet('Active job card and new job alerts');
  addSpacer(5);

  addSubtitle('Job Management');
  addBullet('Accept incoming job requests (time-limited)');
  addBullet('Navigation to pickup location');
  addBullet('Status updates: Accepted → En Route → Arrived → In Progress → Completed');
  addBullet('Customer communication (secure chat/call)');
  addSpacer(5);

  addSubtitle('Earnings');
  addBullet('Daily and weekly earnings breakdown');
  addBullet('Pending payouts and payout requests');
  addBullet('Commission/payout percentage display');
  addBullet('Transaction history');
  addSpacer(10);

  // Admin Portal
  addTitle('Admin Portal Features');
  addDivider();

  addSubtitle('Dashboard');
  addBullet('Key metrics: Active jobs, online drivers, completed jobs, revenue');
  addBullet('Real-time activity feed');
  addBullet('Quick action buttons');
  addSpacer(5);

  addSubtitle('Management Features');
  addBullet('Customer and driver user management');
  addBullet('Driver document verification workflow');
  addBullet('Jobs management and dispute handling');
  addBullet('Payments and refund processing');
  addBullet('Services and pricing configuration');
  addBullet('Live map with all active jobs');
  addBullet('Reports, analytics, and SLA monitoring');
  addBullet('Audit logs and system settings');
  addSpacer(10);

  // Technical Architecture
  addPage();
  addTitle('Technical Architecture');
  addDivider();

  addSubtitle('Frontend Stack');
  addBullet('React 18 with TypeScript');
  addBullet('React Router v6 for routing');
  addBullet('Tailwind CSS with custom design tokens');
  addBullet('shadcn/ui components (Radix primitives)');
  addBullet('TanStack Query for state management');
  addBullet('Leaflet/React-Leaflet for maps');
  addBullet('Recharts for data visualization');
  addBullet('Framer Motion for animations');
  addBullet('React Hook Form with Zod validation');
  addSpacer(5);

  addSubtitle('Backend (Lovable Cloud)');
  addBullet('PostgreSQL database');
  addBullet('Authentication system');
  addBullet('Real-time subscriptions');
  addBullet('File storage for documents/photos');
  addBullet('Deno-based serverless edge functions');
  addSpacer(5);

  addSubtitle('Key Edge Functions');
  addBullet('support-chat - AI-powered customer support');
  addBullet('secure-message - Encrypted in-app messaging');
  addBullet('secure-call - Twilio voice call initiation');
  addBullet('report-abuse - Abuse reporting system');
  addBullet('reverse-geocode - Address lookup from coordinates');
  addBullet('create-user / reset-user-password - User management');
  addSpacer(10);

  // Database Tables
  addSubtitle('Database Tables');
  addText('profiles, user_roles, drivers, vehicles, services, jobs, job_messages, payments, payment_methods, saved_locations, disputes, abuse_reports, admin_notifications, audit_logs, app_settings, support_tickets, call_logs, message_blocks, communication_rate_limits, login_attempts');
  addSpacer(10);

  // Security
  addTitle('Security Features');
  addDivider();
  addBullet('Row Level Security (RLS) on all tables');
  addBullet('Role-based access control');
  addBullet('Rate limiting on communications');
  addBullet('Secure messaging with encryption');
  addBullet('Document verification workflow');
  addBullet('Audit logging for admin actions');
  addBullet('Login attempt tracking');
  addBullet('Account lockout protection');
  addSpacer(10);

  // AI Integration
  addPage();
  addTitle('AI Integration');
  addDivider();
  addText('The customer support chat is powered by Lovable AI Gateway using the google/gemini-3-flash-preview model with streaming responses for a real-time conversational feel.');
  addSpacer(5);

  addSubtitle('AI System Prompt Context');
  addText('The AI assistant is configured with comprehensive knowledge about NowNow Assist services, pricing policies, response times (15-25 minutes average), payment methods accepted, driver verification process, and cancellation policies. It provides helpful, friendly, and concise responses, directing complex issues to email support.');
  addSpacer(10);

  // Communication Features
  addTitle('Communication Features');
  addDivider();
  
  addSubtitle('Secure Messaging');
  addBullet('In-app chat between customer and driver');
  addBullet('Message encryption and rate limiting');
  addBullet('Block/report functionality');
  addBullet('Message expiration after job completion');
  addSpacer(5);

  addSubtitle('Secure Calling');
  addBullet('Twilio-powered voice calls');
  addBullet('Number masking for privacy');
  addBullet('Call logging for disputes');
  addSpacer(10);

  // Key User Flows
  addTitle('Key User Flows');
  addDivider();

  addSubtitle('Customer: Request Assistance');
  addText('Open app → Select service → Confirm location → Select vehicle (optional) → Add notes → View estimate → Request → Wait for acceptance → Track driver → Communicate → Service completed → Rate and review');
  addSpacer(5);

  addSubtitle('Driver: Complete a Job');
  addText('Go online → Receive notification → Review details → Accept → Navigate → Update: En Route → Arrive → Update: Arrived → Perform service → Update: Completed → Receive payment');
  addSpacer(5);

  addSubtitle('Admin: Verify a Driver');
  addText('View pending verifications → Open driver profile → Review documents → Approve/reject with notes → Driver notified → Approved drivers can go online');
  addSpacer(10);

  // Responsive Design
  addPage();
  addTitle('Responsive Design');
  addDivider();
  
  addSubtitle('Mobile (Primary)');
  addBullet('Bottom navigation for main sections');
  addBullet('Full-screen maps');
  addBullet('Large touch targets');
  addBullet('Swipe gestures for actions');
  addSpacer(5);

  addSubtitle('Desktop');
  addBullet('Admin portal optimized for desktop');
  addBullet('Sidebar navigation');
  addBullet('Data tables with sorting/filtering');
  addBullet('Dashboard with multiple widgets');
  addSpacer(10);

  // Future Considerations
  addTitle('Future Considerations');
  addDivider();
  addBullet('Push and SMS notifications');
  addBullet('Multiple language support');
  addBullet('Insurance integration');
  addBullet('Fleet management for businesses');
  addBullet('Subscription and loyalty programs');
  addBullet('Advanced analytics dashboard');
  addBullet('Machine learning for ETA prediction');
  addBullet('Automated driver dispatch');
  addSpacer(20);

  // Footer
  addDivider();
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('This document represents the complete design specification for NowNow Assist.', margin, yPos);
  yPos += 5;
  doc.text('Use this as a reference for maintaining consistency across all development and design decisions.', margin, yPos);

  // Save
  doc.save('NowNow_Assist_AI_Prompt.pdf');
};
