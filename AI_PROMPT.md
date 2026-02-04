# NowNow Assist - Complete AI Design Prompt

## Brand Identity

**Name:** NowNow Assist  
**Tagline:** "Help is on the Way"  
**Industry:** Roadside Assistance Service  
**Location:** South Africa  
**Contact:** support@nownowassist.co.za

---

## Brand Colors & Design System

### Primary Colors
- **Deep Trust Blue** (`#1a365d` / HSL: 216, 57%, 23%) - Primary brand color representing reliability and trust
- **Safety Orange** (`#f97316`) - Accent color for CTAs and urgent actions
- **Success Green** - For confirmations and positive states
- **Alert Red** - For errors and urgent warnings

### Design Philosophy
- **Clean, Modern, Professional** - Trustworthy appearance for emergency situations
- **Mobile-First** - Optimized for users stranded on the roadside
- **High Contrast** - Easy to read in bright daylight or at night
- **Accessible** - Large touch targets, clear typography

### Typography
- Clean, readable fonts
- Hierarchical sizing for quick scanning
- High contrast for outdoor visibility

---

## Application Overview

NowNow Assist is a comprehensive roadside assistance platform connecting stranded motorists with verified service providers (drivers/responders). The app features three distinct user portals:

1. **Customer Portal** - For motorists requesting assistance
2. **Driver Portal** - For service providers/responders
3. **Admin Portal** - For platform management

---

## User Roles & Permissions

### Customer Role
- Request roadside assistance services
- Track responder location in real-time
- Manage saved locations and vehicles
- View service history
- Rate and review completed services
- Access AI-powered support chat
- Secure in-app messaging with drivers
- Manage payment methods

### Driver Role
- Accept/decline job requests
- Navigate to customer locations
- Update job status (en route, arrived, in progress, completed)
- View earnings and request payouts
- Manage availability (online/offline toggle)
- Secure communication with customers
- View job history and ratings

### Admin Role
- Full dashboard with analytics
- User management (customers & drivers)
- Driver verification and document review
- Service and pricing management
- Dispute resolution
- Payment oversight
- Live map of all active jobs
- SLA monitoring
- Audit logs
- System settings

---

## Services Offered

1. **Flat Tyre Change** - Professional tyre replacement
2. **Battery Jump Start** - Dead battery assistance
3. **Fuel Delivery** - Emergency fuel delivery
4. **Towing** - Vehicle towing services
5. **Locksmith Services** - Vehicle lockout assistance
6. **Mechanical Assistance** - On-site mechanical help

### Service Attributes
- Base price per service
- Price per kilometer (distance-based pricing)
- Estimated arrival time (ETA)
- Surge multiplier for high-demand periods
- Service availability toggle

---

## Customer Portal Features

### Home Screen
- Quick service selection grid with icons
- Location selector (GPS or saved locations)
- Active job status card (if applicable)
- Recent activity summary

### Service Request Flow
1. Select service type
2. Confirm/adjust pickup location
3. Add vehicle details (optional)
4. Add notes for responder
5. View price estimate
6. Confirm request
7. Wait for driver acceptance

### Live Tracking
- Real-time map showing responder location
- ETA countdown
- Driver details (name, photo, vehicle, rating)
- Secure call button (Twilio integration)
- Secure chat button
- Job status updates
- Cancel option (before arrival)

### Profile Management
- Personal information editing
- Profile photo upload
- Saved locations (Home, Work, custom)
- Vehicle management (make, model, registration, color)
- Payment methods (credit/debit cards)
- Privacy & security settings
- Legal documents access

### History
- List of past service requests
- Job details and pricing
- Rating and review capability
- Receipt access

### Support
- AI-powered chat assistant (Lovable AI integration)
- FAQ section with 12+ detailed entries
- Email support option
- Report an issue functionality

---

## Driver Portal Features

### Home Screen
- Online/Offline toggle (prominent)
- Today's earnings summary
- Weekly earnings overview
- Pending payments indicator
- Active job card (if applicable)
- New job alerts with accept/decline

### Job Management
- Accept incoming job requests (time-limited)
- Navigation to pickup location
- Status updates:
  - Accepted → En Route
  - En Route → Arrived
  - Arrived → In Progress
  - In Progress → Completed
- Customer communication (secure chat/call)
- Job notes and photos

### Earnings
- Daily earnings breakdown
- Weekly summary with charts
- Pending payouts
- Payout request functionality
- Commission/payout percentage display
- Transaction history

### Profile
- Document management:
  - Profile photo
  - ID document
  - Driver's license
  - Vehicle registration
- Vehicle details
- Verification status
- Rating display

---

## Admin Portal Features

### Dashboard
- Key metrics overview:
  - Active jobs count
  - Online drivers count
  - Completed jobs (today/week)
  - Revenue metrics
- Real-time activity feed
- Quick action buttons

### User Management
- Customer list with search/filter
- Driver list with verification status
- User details and activity history
- Account actions (suspend, verify, etc.)

### Driver Verification
- Document review interface
- Approve/reject with notes
- Background check status
- License verification

### Jobs Management
- Active jobs list
- Completed jobs history
- Job details and timeline
- Dispute handling

### Payments
- Transaction overview
- Driver payouts management
- Refund processing
- Revenue reports

### Services & Pricing
- Service configuration
- Base price management
- Distance pricing rules
- Surge pricing controls

### Live Map
- Real-time view of all active jobs
- Driver locations (online drivers)
- Customer pickup points
- Job status indicators

### Reports & Analytics
- Revenue reports
- Service usage statistics
- Driver performance metrics
- Customer satisfaction scores
- SLA compliance

### Audit Logs
- System activity tracking
- User actions logging
- Security events
- Admin actions history

### Settings
- Platform configuration
- Notification settings
- Integration settings
- System preferences

---

## Technical Architecture

### Frontend
- **Framework:** React 18 with TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS with custom design tokens
- **UI Components:** shadcn/ui (Radix primitives)
- **State Management:** TanStack Query (React Query)
- **Maps:** Leaflet with React-Leaflet
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Forms:** React Hook Form with Zod validation

### Backend (Lovable Cloud/Supabase)
- **Database:** PostgreSQL
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime subscriptions
- **Storage:** Supabase Storage (for documents/photos)
- **Edge Functions:** Deno-based serverless functions

### Key Edge Functions
- `support-chat` - AI-powered customer support (Lovable AI)
- `secure-message` - Encrypted in-app messaging
- `secure-call` - Twilio voice call initiation
- `twilio-token` - Twilio client token generation
- `report-abuse` - Abuse reporting system
- `reverse-geocode` - Address lookup from coordinates
- `create-user` - User creation with role assignment
- `reset-user-password` - Password reset functionality
- `auth-guard` - Authentication middleware

### Database Tables
- `profiles` - User profile information
- `user_roles` - Role assignments (admin, driver, customer)
- `drivers` - Driver-specific data and documents
- `vehicles` - Customer vehicle information
- `services` - Available service types
- `jobs` - Service requests and job tracking
- `job_messages` - In-job communication
- `payments` - Payment transactions
- `payment_methods` - Saved payment methods
- `saved_locations` - Customer saved addresses
- `disputes` - Dispute records
- `abuse_reports` - Abuse report records
- `admin_notifications` - Admin alert system
- `audit_logs` - System audit trail
- `app_settings` - Platform configuration
- `support_tickets` - Support ticket system
- `call_logs` - Voice call records
- `message_blocks` - Blocked user relationships
- `communication_rate_limits` - Rate limiting for comms
- `login_attempts` - Security login tracking

### Security Features
- Row Level Security (RLS) on all tables
- Role-based access control
- Rate limiting on communications
- Secure messaging with encryption
- Document verification workflow
- Audit logging for admin actions
- Login attempt tracking
- Account lockout protection

---

## AI Integration

### Customer Support Chat
- Powered by Lovable AI Gateway
- Model: google/gemini-3-flash-preview
- Streaming responses for real-time feel
- Context-aware responses about NowNow Assist services
- Fallback to email support for complex issues

### AI System Prompt Context
```
You are a helpful customer support assistant for NowNow Assist, a roadside assistance service in South Africa.

About NowNow Assist:
- We provide 24/7 roadside assistance including flat tyre change, battery jump start, fuel delivery, towing, locksmith services, and mechanical assistance
- Average response time is 15-25 minutes depending on location and traffic
- We accept all major credit/debit cards, instant EFT, and mobile payments like SnapScan
- All our responders undergo background checks, license verification, and skills assessment
- Customers can track their responder in real-time through our app
- Cancellation is free before the responder arrives, a small fee may apply after dispatch

Key policies:
- Service requests can be cancelled anytime before the responder arrives
- Payments are processed securely after service completion
- Rating and feedback help us maintain quality service
- All communication is via email at support@nownowassist.co.za

If you cannot answer a question or if the customer needs further assistance, suggest they send an email through the app.

Be helpful, friendly, and concise. If asked about specific pricing, explain that prices vary based on location and service type, and they can see estimates in the app.
```

---

## Communication Features

### Secure Messaging
- In-app chat between customer and driver
- Message encryption
- Rate limiting (prevents spam)
- Block/report functionality
- Message expiration after job completion

### Secure Calling
- Twilio-powered voice calls
- Number masking for privacy
- Call logging for disputes
- In-app call UI

---

## Key User Flows

### Customer: Request Assistance
1. Open app → Home screen
2. Select service type
3. Confirm location (GPS auto-detect or manual)
4. Select vehicle (optional)
5. Add notes (optional)
6. View price estimate
7. Tap "Request Assistance"
8. Wait for driver acceptance
9. Track driver in real-time
10. Communicate via chat/call
11. Service completed
12. Rate and review

### Driver: Complete a Job
1. Go online
2. Receive job notification
3. Review job details
4. Accept within time limit
5. Navigate to customer
6. Update status: En Route
7. Arrive → Update: Arrived
8. Perform service → Update: In Progress
9. Complete → Update: Completed
10. Receive payment credit

### Admin: Verify a Driver
1. View pending verifications
2. Open driver profile
3. Review each document
4. Approve or reject with notes
5. Driver notified of status
6. Approved drivers can go online

---

## Responsive Design

### Mobile (Primary)
- Bottom navigation for main sections
- Full-screen maps
- Large touch targets
- Swipe gestures for actions

### Tablet
- Optimized layouts
- Side-by-side views where appropriate

### Desktop
- Admin portal optimized for desktop
- Sidebar navigation
- Data tables with sorting/filtering
- Dashboard with multiple widgets

---

## Notifications

### Customer Notifications
- Job accepted
- Driver en route
- Driver arrived
- Job completed
- Payment processed
- Promotional offers

### Driver Notifications
- New job available
- Job cancelled by customer
- Payment received
- Document status update
- Rating received

### Admin Notifications
- New driver registration
- Document pending review
- Dispute filed
- SLA breach
- System alerts

---

## Error Handling

- Graceful error messages
- Retry mechanisms
- Offline state handling
- Form validation with clear feedback
- Toast notifications for actions

---

## Future Considerations

- Push notifications (mobile)
- SMS notifications
- Multiple language support
- Insurance integration
- Fleet management for businesses
- Subscription plans
- Loyalty/rewards program
- Advanced analytics dashboard
- Machine learning for ETA prediction
- Automated driver dispatch

---

## Logo & Branding

- **Logo:** Custom NowNow Assist logo (located in src/assets/logo-new.png)
- **Logo Sizes:** sm, md, lg, xl, 2xl, hero variants
- **Header:** Sticky with backdrop blur, deep trust blue background
- **Footer:** Consistent branding with social links

---

## Contact Information

- **Email:** support@nownowassist.co.za
- **App Store:** [Placeholder for future]
- **Google Play:** [Placeholder for future]

---

*This prompt represents the complete design specification for NowNow Assist as of the current build. Use this as a reference for maintaining consistency across all development and design decisions.*
