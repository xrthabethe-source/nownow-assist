
-- ============================================
-- FIX 1: Convert all RESTRICTIVE policies to PERMISSIVE
-- We need to drop and recreate them as PERMISSIVE (default)
-- ============================================

-- PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- USER_ROLES
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- DRIVERS
DROP POLICY IF EXISTS "Admins can manage all drivers" ON public.drivers;
DROP POLICY IF EXISTS "Authenticated users can create driver profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update their own profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view their own profile" ON public.drivers;

CREATE POLICY "Admins can manage all drivers" ON public.drivers FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create driver profile" ON public.drivers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Drivers can view their own profile" ON public.drivers FOR SELECT USING (auth.uid() = user_id);
-- FIX 3: Restrict driver self-updates to only safe columns via trigger
CREATE POLICY "Drivers can update their own profile" ON public.drivers FOR UPDATE USING (auth.uid() = user_id);

-- DRIVER_VERIFICATIONS
DROP POLICY IF EXISTS "Admins can manage all verifications" ON public.driver_verifications;
DROP POLICY IF EXISTS "Drivers can insert their own verification" ON public.driver_verifications;
DROP POLICY IF EXISTS "Drivers can update their own verification" ON public.driver_verifications;
DROP POLICY IF EXISTS "Drivers can view their own verification" ON public.driver_verifications;

CREATE POLICY "Admins can manage all verifications" ON public.driver_verifications FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Drivers can insert their own verification" ON public.driver_verifications FOR INSERT WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));
CREATE POLICY "Drivers can view their own verification" ON public.driver_verifications FOR SELECT USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));
CREATE POLICY "Drivers can update their own verification" ON public.driver_verifications FOR UPDATE USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- JOBS
DROP POLICY IF EXISTS "Admins can manage all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Drivers can update assigned jobs" ON public.jobs;
DROP POLICY IF EXISTS "Drivers can view assigned jobs" ON public.jobs;
DROP POLICY IF EXISTS "Drivers can view pending jobs" ON public.jobs;

CREATE POLICY "Admins can manage all jobs" ON public.jobs FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can view their own jobs" ON public.jobs FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Drivers can update assigned jobs" ON public.jobs FOR UPDATE USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));
CREATE POLICY "Drivers can view assigned jobs" ON public.jobs FOR SELECT USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));
CREATE POLICY "Drivers can view pending jobs" ON public.jobs FOR SELECT USING (status = 'pending' AND driver_id IS NULL AND EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid() AND status = 'approved' AND is_online = true));

-- PAYMENTS
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Customers can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Drivers can view their payouts" ON public.payments;

CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Drivers can view their payouts" ON public.payments FOR SELECT USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- SERVICES
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;

CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (is_active = true);

-- DISPUTES
DROP POLICY IF EXISTS "Admins can manage disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can create disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can view their own disputes" ON public.disputes;

CREATE POLICY "Admins can manage disputes" ON public.disputes FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create disputes" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own disputes" ON public.disputes FOR SELECT USING (auth.uid() = reporter_id);

-- ABUSE_REPORTS
DROP POLICY IF EXISTS "Admins can update abuse reports" ON public.abuse_reports;
DROP POLICY IF EXISTS "Admins can view all abuse reports" ON public.abuse_reports;
DROP POLICY IF EXISTS "Users can create abuse reports" ON public.abuse_reports;
DROP POLICY IF EXISTS "Users can view their own abuse reports" ON public.abuse_reports;

CREATE POLICY "Admins can update abuse reports" ON public.abuse_reports FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all abuse reports" ON public.abuse_reports FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create abuse reports" ON public.abuse_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own abuse reports" ON public.abuse_reports FOR SELECT USING (auth.uid() = reporter_id);

-- ADMIN_NOTIFICATIONS - FIX 2: Restrict INSERT to admins only
DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admins can view notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.admin_notifications;

CREATE POLICY "Admins can update notifications" ON public.admin_notifications FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view notifications" ON public.admin_notifications FOR SELECT USING (has_role(auth.uid(), 'admin'));
-- Allow service role / triggers to insert, but not arbitrary users
CREATE POLICY "Admins can insert notifications" ON public.admin_notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- MESSAGES
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their sent messages" ON public.messages;

CREATE POLICY "Admins can manage all messages" ON public.messages FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users can view their sent messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id);

-- SUPPORT_TICKETS
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;

CREATE POLICY "Admins can update all tickets" ON public.support_tickets FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);

-- PAYMENT_METHODS
DROP POLICY IF EXISTS "Users can create their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;

CREATE POLICY "Users can create their own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own payment methods" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);

-- SAVED_LOCATIONS
DROP POLICY IF EXISTS "Users can create their own locations" ON public.saved_locations;
DROP POLICY IF EXISTS "Users can delete their own locations" ON public.saved_locations;
DROP POLICY IF EXISTS "Users can update their own locations" ON public.saved_locations;
DROP POLICY IF EXISTS "Users can view their own locations" ON public.saved_locations;

CREATE POLICY "Users can create their own locations" ON public.saved_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own locations" ON public.saved_locations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own locations" ON public.saved_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own locations" ON public.saved_locations FOR SELECT USING (auth.uid() = user_id);

-- VEHICLES
DROP POLICY IF EXISTS "Users can create their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can view their own vehicles" ON public.vehicles;

CREATE POLICY "Users can create their own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- LOGIN_ATTEMPTS
DROP POLICY IF EXISTS "Admins can view login attempts" ON public.login_attempts;

CREATE POLICY "Admins can view login attempts" ON public.login_attempts FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- APP_SETTINGS
DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can view app settings" ON public.app_settings;

CREATE POLICY "Admins can manage app settings" ON public.app_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view app settings" ON public.app_settings FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- CALL_LOGS
DROP POLICY IF EXISTS "Authenticated users can create call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Call participants can update call status" ON public.call_logs;
DROP POLICY IF EXISTS "Users can view their own call logs" ON public.call_logs;

CREATE POLICY "Authenticated users can create call logs" ON public.call_logs FOR INSERT WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Call participants can update call status" ON public.call_logs FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can view their own call logs" ON public.call_logs FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- COMMUNICATION_RATE_LIMITS
DROP POLICY IF EXISTS "System can manage rate limits" ON public.communication_rate_limits;
DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.communication_rate_limits;

CREATE POLICY "System can manage rate limits" ON public.communication_rate_limits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own rate limits" ON public.communication_rate_limits FOR SELECT USING (auth.uid() = user_id);

-- JOB_MESSAGES
DROP POLICY IF EXISTS "Customers can mark job messages as read" ON public.job_messages;
DROP POLICY IF EXISTS "Customers can read messages for their jobs" ON public.job_messages;
DROP POLICY IF EXISTS "Customers can send messages for their jobs" ON public.job_messages;
DROP POLICY IF EXISTS "Drivers can mark job messages as read" ON public.job_messages;
DROP POLICY IF EXISTS "Drivers can read messages for their jobs" ON public.job_messages;
DROP POLICY IF EXISTS "Drivers can send messages for their jobs" ON public.job_messages;

CREATE POLICY "Customers can mark job messages as read" ON public.job_messages FOR UPDATE USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_messages.job_id AND jobs.customer_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_messages.job_id AND jobs.customer_id = auth.uid()));
CREATE POLICY "Customers can read messages for their jobs" ON public.job_messages FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_messages.job_id AND jobs.customer_id = auth.uid()));
CREATE POLICY "Customers can send messages for their jobs" ON public.job_messages FOR INSERT WITH CHECK (sender_id = auth.uid() AND sender_type = 'customer' AND EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_messages.job_id AND jobs.customer_id = auth.uid()));
CREATE POLICY "Drivers can mark job messages as read" ON public.job_messages FOR UPDATE USING (EXISTS (SELECT 1 FROM jobs j JOIN drivers d ON j.driver_id = d.id WHERE j.id = job_messages.job_id AND d.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM jobs j JOIN drivers d ON j.driver_id = d.id WHERE j.id = job_messages.job_id AND d.user_id = auth.uid()));
CREATE POLICY "Drivers can read messages for their jobs" ON public.job_messages FOR SELECT USING (EXISTS (SELECT 1 FROM jobs j JOIN drivers d ON j.driver_id = d.id WHERE j.id = job_messages.job_id AND d.user_id = auth.uid()));
CREATE POLICY "Drivers can send messages for their jobs" ON public.job_messages FOR INSERT WITH CHECK (sender_type = 'driver' AND EXISTS (SELECT 1 FROM jobs j JOIN drivers d ON j.driver_id = d.id WHERE j.id = job_messages.job_id AND d.user_id = auth.uid()));

-- MESSAGE_BLOCKS
DROP POLICY IF EXISTS "Users can create blocks" ON public.message_blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.message_blocks;
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.message_blocks;

CREATE POLICY "Users can create blocks" ON public.message_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can delete their own blocks" ON public.message_blocks FOR DELETE USING (auth.uid() = blocker_id);
CREATE POLICY "Users can view their own blocks" ON public.message_blocks FOR SELECT USING (auth.uid() = blocker_id);

-- ============================================
-- FIX 3: Add triggers to protect admin-only columns on drivers and driver_verifications
-- ============================================

-- Protect admin-only columns on drivers table
CREATE OR REPLACE FUNCTION public.protect_driver_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If the updater is NOT an admin, block changes to admin-only fields
  IF NOT has_role(auth.uid(), 'admin') THEN
    NEW.payout_percentage := OLD.payout_percentage;
    NEW.is_verified := OLD.is_verified;
    NEW.status := OLD.status;
    NEW.rating := OLD.rating;
    NEW.total_jobs := OLD.total_jobs;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.license_document_status := OLD.license_document_status;
    NEW.license_document_note := OLD.license_document_note;
    NEW.vehicle_registration_status := OLD.vehicle_registration_status;
    NEW.vehicle_registration_note := OLD.vehicle_registration_note;
    NEW.profile_photo_status := OLD.profile_photo_status;
    NEW.profile_photo_note := OLD.profile_photo_note;
    NEW.id_document_status := OLD.id_document_status;
    NEW.id_document_note := OLD.id_document_note;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_driver_admin_fields_trigger
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_driver_admin_fields();

-- Protect admin-only columns on driver_verifications table
CREATE OR REPLACE FUNCTION public.protect_verification_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.verified_badge_active := OLD.verified_badge_active;
    NEW.verified_at := OLD.verified_at;
    NEW.approved_at := OLD.approved_at;
    NEW.fraud_risk_score := OLD.fraud_risk_score;
    NEW.fraud_flags := OLD.fraud_flags;
    NEW.reviewer_id := OLD.reviewer_id;
    NEW.reviewer_notes := OLD.reviewer_notes;
    NEW.id_doc_status := OLD.id_doc_status;
    NEW.id_doc_rejection_reason := OLD.id_doc_rejection_reason;
    NEW.license_status := OLD.license_status;
    NEW.license_rejection_reason := OLD.license_rejection_reason;
    NEW.profile_photo_status := OLD.profile_photo_status;
    NEW.profile_photo_rejection_reason := OLD.profile_photo_rejection_reason;
    NEW.background_check_status := OLD.background_check_status;
    NEW.background_check_rejection_reason := OLD.background_check_rejection_reason;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_verification_admin_fields_trigger
  BEFORE UPDATE ON public.driver_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_verification_admin_fields();
