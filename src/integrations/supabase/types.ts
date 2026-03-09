export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          created_at: string | null
          description: string | null
          evidence_urls: string[] | null
          id: string
          job_id: string | null
          report_type: string
          reported_id: string
          reported_type: string
          reporter_id: string
          reporter_type: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          job_id?: string | null
          report_type: string
          reported_id: string
          reported_type: string
          reporter_id: string
          reporter_type: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          job_id?: string | null
          report_type?: string
          reported_id?: string
          reported_type?: string
          reporter_id?: string
          reporter_type?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abuse_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          severity: string
          status: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          severity?: string
          status?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          severity?: string
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      applicant_communications: {
        Row: {
          admin_id: string
          channel: string
          created_at: string
          delivery_error: string | null
          delivery_status: string
          driver_id: string
          id: string
          message_content: string
          phone_number: string | null
          template_used: string | null
          updated_at: string
        }
        Insert: {
          admin_id: string
          channel?: string
          created_at?: string
          delivery_error?: string | null
          delivery_status?: string
          driver_id: string
          id?: string
          message_content: string
          phone_number?: string | null
          template_used?: string | null
          updated_at?: string
        }
        Update: {
          admin_id?: string
          channel?: string
          created_at?: string
          delivery_error?: string | null
          delivery_status?: string
          driver_id?: string
          id?: string
          message_content?: string
          phone_number?: string | null
          template_used?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_communications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_category: string
          event_type: string
          id: string
          ip_address: unknown
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          severity: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_category: string
          event_type: string
          id?: string
          ip_address?: unknown
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_category?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          answered_at: string | null
          call_sid: string | null
          caller_id: string
          caller_type: string
          created_at: string | null
          duration_seconds: number | null
          end_reason: string | null
          ended_at: string | null
          id: string
          initiated_at: string | null
          is_recorded: boolean | null
          job_id: string | null
          metadata: Json | null
          receiver_id: string
          receiver_type: string
          recording_url: string | null
          status: string | null
        }
        Insert: {
          answered_at?: string | null
          call_sid?: string | null
          caller_id: string
          caller_type: string
          created_at?: string | null
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          initiated_at?: string | null
          is_recorded?: boolean | null
          job_id?: string | null
          metadata?: Json | null
          receiver_id: string
          receiver_type: string
          recording_url?: string | null
          status?: string | null
        }
        Update: {
          answered_at?: string | null
          call_sid?: string | null
          caller_id?: string
          caller_type?: string
          created_at?: string | null
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          initiated_at?: string | null
          is_recorded?: boolean | null
          job_id?: string | null
          metadata?: Json | null
          receiver_id?: string
          receiver_type?: string
          recording_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_rate_limits: {
        Row: {
          action_type: string
          count: number | null
          created_at: string | null
          id: string
          user_id: string
          window_start: string | null
        }
        Insert: {
          action_type: string
          count?: number | null
          created_at?: string | null
          id?: string
          user_id: string
          window_start?: string | null
        }
        Update: {
          action_type?: string
          count?: number | null
          created_at?: string | null
          id?: string
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          assigned_admin_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          job_id: string | null
          refund_amount: number | null
          refund_issued: boolean | null
          reporter_id: string | null
          reporter_type: string | null
          resolution: string | null
          resolved_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          job_id?: string | null
          refund_amount?: number | null
          refund_issued?: boolean | null
          reporter_id?: string | null
          reporter_type?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          job_id?: string | null
          refund_amount?: number | null
          refund_issued?: boolean | null
          reporter_id?: string | null
          reporter_type?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_otp_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          max_attempts: number | null
          otp_code: string
          otp_type: string
          phone: string | null
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          max_attempts?: number | null
          otp_code: string
          otp_type: string
          phone?: string | null
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          max_attempts?: number | null
          otp_code?: string
          otp_type?: string
          phone?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      driver_verifications: {
        Row: {
          approved_at: string | null
          audit_log: Json | null
          background_check_file_hash: string | null
          background_check_rejection_reason: string | null
          background_check_status: string
          background_check_upload_count: number
          background_check_url: string | null
          bg_consent_given: boolean | null
          bg_date_of_birth: string | null
          bg_full_name: string | null
          bg_id_number: string | null
          created_at: string
          driver_id: string
          fraud_flags: string[] | null
          fraud_risk_score: number
          id: string
          id_doc_file_hash: string | null
          id_doc_file_url: string | null
          id_doc_rejection_reason: string | null
          id_doc_status: string
          id_doc_type: string | null
          id_doc_upload_count: number
          license_file_hash: string | null
          license_file_url: string | null
          license_rejection_reason: string | null
          license_status: string
          license_upload_count: number
          profile_photo_file_hash: string | null
          profile_photo_rejection_reason: string | null
          profile_photo_status: string
          profile_photo_upload_count: number
          profile_photo_url: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          verified_at: string | null
          verified_badge_active: boolean
        }
        Insert: {
          approved_at?: string | null
          audit_log?: Json | null
          background_check_file_hash?: string | null
          background_check_rejection_reason?: string | null
          background_check_status?: string
          background_check_upload_count?: number
          background_check_url?: string | null
          bg_consent_given?: boolean | null
          bg_date_of_birth?: string | null
          bg_full_name?: string | null
          bg_id_number?: string | null
          created_at?: string
          driver_id: string
          fraud_flags?: string[] | null
          fraud_risk_score?: number
          id?: string
          id_doc_file_hash?: string | null
          id_doc_file_url?: string | null
          id_doc_rejection_reason?: string | null
          id_doc_status?: string
          id_doc_type?: string | null
          id_doc_upload_count?: number
          license_file_hash?: string | null
          license_file_url?: string | null
          license_rejection_reason?: string | null
          license_status?: string
          license_upload_count?: number
          profile_photo_file_hash?: string | null
          profile_photo_rejection_reason?: string | null
          profile_photo_status?: string
          profile_photo_upload_count?: number
          profile_photo_url?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_badge_active?: boolean
        }
        Update: {
          approved_at?: string | null
          audit_log?: Json | null
          background_check_file_hash?: string | null
          background_check_rejection_reason?: string | null
          background_check_status?: string
          background_check_upload_count?: number
          background_check_url?: string | null
          bg_consent_given?: boolean | null
          bg_date_of_birth?: string | null
          bg_full_name?: string | null
          bg_id_number?: string | null
          created_at?: string
          driver_id?: string
          fraud_flags?: string[] | null
          fraud_risk_score?: number
          id?: string
          id_doc_file_hash?: string | null
          id_doc_file_url?: string | null
          id_doc_rejection_reason?: string | null
          id_doc_status?: string
          id_doc_type?: string | null
          id_doc_upload_count?: number
          license_file_hash?: string | null
          license_file_url?: string | null
          license_rejection_reason?: string | null
          license_status?: string
          license_upload_count?: number
          profile_photo_file_hash?: string | null
          profile_photo_rejection_reason?: string | null
          profile_photo_status?: string
          profile_photo_upload_count?: number
          profile_photo_url?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_badge_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "driver_verifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          current_location_lat: number | null
          current_location_lng: number | null
          documents_submitted_at: string | null
          email_verified: boolean | null
          id: string
          id_document_note: string | null
          id_document_status: string | null
          id_document_url: string | null
          is_online: boolean | null
          is_verified: boolean | null
          license_document_note: string | null
          license_document_status: string | null
          license_document_url: string | null
          license_number: string | null
          payout_percentage: number | null
          phone_verified: boolean | null
          profile_photo_note: string | null
          profile_photo_status: string | null
          profile_photo_url: string | null
          rating: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          total_jobs: number | null
          updated_at: string
          user_id: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_registration_note: string | null
          vehicle_registration_status: string | null
          vehicle_registration_url: string | null
          vehicle_type: string | null
          vehicle_year: number | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          current_location_lat?: number | null
          current_location_lng?: number | null
          documents_submitted_at?: string | null
          email_verified?: boolean | null
          id?: string
          id_document_note?: string | null
          id_document_status?: string | null
          id_document_url?: string | null
          is_online?: boolean | null
          is_verified?: boolean | null
          license_document_note?: string | null
          license_document_status?: string | null
          license_document_url?: string | null
          license_number?: string | null
          payout_percentage?: number | null
          phone_verified?: boolean | null
          profile_photo_note?: string | null
          profile_photo_status?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          total_jobs?: number | null
          updated_at?: string
          user_id: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_registration_note?: string | null
          vehicle_registration_status?: string | null
          vehicle_registration_url?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          current_location_lat?: number | null
          current_location_lng?: number | null
          documents_submitted_at?: string | null
          email_verified?: boolean | null
          id?: string
          id_document_note?: string | null
          id_document_status?: string | null
          id_document_url?: string | null
          is_online?: boolean | null
          is_verified?: boolean | null
          license_document_note?: string | null
          license_document_status?: string | null
          license_document_url?: string | null
          license_number?: string | null
          payout_percentage?: number | null
          phone_verified?: boolean | null
          profile_photo_note?: string | null
          profile_photo_status?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          total_jobs?: number | null
          updated_at?: string
          user_id?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_registration_note?: string | null
          vehicle_registration_status?: string | null
          vehicle_registration_url?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      job_messages: {
        Row: {
          created_at: string
          delivered_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          is_system_message: boolean | null
          job_id: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          sender_id: string
          sender_type: string
          status: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          is_system_message?: boolean | null
          job_id?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
          sender_type: string
          status?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          is_system_message?: boolean | null
          job_id?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          accepted_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          created_offline: boolean | null
          customer_id: string | null
          dispatched_at: string | null
          driver_id: string | null
          estimated_price: number | null
          eta_minutes: number | null
          final_price: number | null
          id: string
          job_number: string
          notes: string | null
          offline_draft_id: string | null
          pickup_address: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          rating: number | null
          review: string | null
          service_id: string | null
          started_at: string | null
          status: string | null
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_offline?: boolean | null
          customer_id?: string | null
          dispatched_at?: string | null
          driver_id?: string | null
          estimated_price?: number | null
          eta_minutes?: number | null
          final_price?: number | null
          id?: string
          job_number: string
          notes?: string | null
          offline_draft_id?: string | null
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          rating?: number | null
          review?: string | null
          service_id?: string | null
          started_at?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_offline?: boolean | null
          customer_id?: string | null
          dispatched_at?: string | null
          driver_id?: string | null
          estimated_price?: number | null
          eta_minutes?: number | null
          final_price?: number | null
          id?: string
          job_number?: string
          notes?: string | null
          offline_draft_id?: string | null
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          rating?: number | null
          review?: string | null
          service_id?: string | null
          started_at?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      message_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_last_four: string
          cardholder_name: string | null
          created_at: string
          expiry_month: number
          expiry_year: number
          id: string
          is_default: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_last_four: string
          cardholder_name?: string | null
          created_at?: string
          expiry_month: number
          expiry_year: number
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_last_four?: string
          cardholder_name?: string | null
          created_at?: string
          expiry_month?: number
          expiry_year?: number
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          driver_id: string | null
          driver_payout: number | null
          failure_reason: string | null
          id: string
          job_id: string | null
          payment_method: string | null
          platform_fee: number | null
          refund_amount: number | null
          refunded_at: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          driver_id?: string | null
          driver_payout?: number | null
          failure_reason?: string | null
          id?: string
          job_id?: string | null
          payment_method?: string | null
          platform_fee?: number | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          driver_id?: string | null
          driver_payout?: number | null
          failure_reason?: string | null
          id?: string
          job_id?: string | null
          payment_method?: string | null
          platform_fee?: number | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_locations: {
        Row: {
          address: string
          created_at: string
          id: string
          is_default: boolean | null
          latitude: number
          longitude: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          latitude: number
          longitude: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          base_price: number
          created_at: string
          description: string | null
          eta_minutes: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          price_per_km: number | null
          surge_multiplier: number | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          description?: string | null
          eta_minutes?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_per_km?: number | null
          surge_multiplier?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          description?: string | null
          eta_minutes?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_per_km?: number | null
          surge_multiplier?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_default: boolean | null
          make: string
          model: string | null
          registration_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          make: string
          model?: string | null
          registration_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          make?: string
          model?: string | null
          registration_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_message_rate_limit: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: boolean
      }
      get_failed_attempt_count: {
        Args: { check_email: string; check_ip: unknown }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_account_locked: { Args: { check_email: string }; Returns: boolean }
      is_user_blocked: {
        Args: { p_receiver_id: string; p_sender_id: string }
        Returns: boolean
      }
      log_audit_event:
        | {
            Args: {
              p_details?: Json
              p_event_category: string
              p_event_type: string
              p_resource_id?: string
              p_resource_type?: string
              p_severity?: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_details?: Json
              p_event_category: string
              p_event_type: string
              p_resource_id?: string
              p_resource_type?: string
              p_severity?: string
              p_user_id: string
            }
            Returns: string
          }
    }
    Enums: {
      app_role: "admin" | "driver" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "driver", "customer"],
    },
  },
} as const
