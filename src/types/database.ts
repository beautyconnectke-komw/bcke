export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["profile_role"] | null;
          display_name: string | null;
          phone: string | null;
          account_deletion_requested_at: string | null;
          account_deletion_scheduled_for: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: Database["public"]["Enums"]["profile_role"] | null;
          display_name?: string | null;
          phone?: string | null;
          account_deletion_requested_at?: string | null;
          account_deletion_scheduled_for?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["profile_role"] | null;
          display_name?: string | null;
          phone?: string | null;
          account_deletion_requested_at?: string | null;
          account_deletion_scheduled_for?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          display_order: number;
          image_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_active?: boolean;
          display_order?: number;
          image_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          display_order?: number;
          image_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_email_whitelist: {
        Row: {
          email: string;
          created_at: string;
        };
        Insert: {
          email: string;
          created_at?: string;
        };
        Update: {
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      company_settings: {
        Row: {
          id: number;
          phone: string | null;
          email: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          phone?: string | null;
          email?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          phone?: string | null;
          email?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      account_deletion_requests: {
        Row: {
          id: string;
          profile_id: string | null;
          email: string;
          requested_at: string;
          scheduled_for: string;
          status: string;
          cancelled_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          email: string;
          requested_at?: string;
          scheduled_for: string;
          status?: string;
          cancelled_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          email?: string;
          requested_at?: string;
          scheduled_for?: string;
          status?: string;
          cancelled_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      worker_profiles: {
        Row: {
          id: string;
          profile_id: string;
          category_id: string | null;
          full_name: string;
          phone: string | null;
          location: string | null;
          county: string | null;
          town: string | null;
          profile_photo_path: string | null;
          years_experience: number;
          experience_months: number;
          experience_started_at: string | null;
          short_bio: string | null;
          work_experience: string | null;
          skills: string[];
          extra_specialty_ids: string[];
          featured_rank: number | null;
          compensation_model: Database["public"]["Enums"]["compensation_model"];
          salary_expectation: number | null;
          commission_expectation: number | null;
          verification_status: Database["public"]["Enums"]["worker_verification_status"];
          availability_status: Database["public"]["Enums"]["worker_availability_status"];
          is_suspended: boolean;
          public_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          category_id?: string | null;
          full_name: string;
          phone?: string | null;
          location?: string | null;
          county?: string | null;
          town?: string | null;
          profile_photo_path?: string | null;
          years_experience?: number;
          experience_months?: number;
          experience_started_at?: string | null;
          short_bio?: string | null;
          work_experience?: string | null;
          skills?: string[];
          extra_specialty_ids?: string[];
          featured_rank?: number | null;
          compensation_model?: Database["public"]["Enums"]["compensation_model"];
          salary_expectation?: number | null;
          commission_expectation?: number | null;
          verification_status?: Database["public"]["Enums"]["worker_verification_status"];
          availability_status?: Database["public"]["Enums"]["worker_availability_status"];
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          category_id?: string | null;
          full_name?: string;
          phone?: string | null;
          location?: string | null;
          county?: string | null;
          town?: string | null;
          profile_photo_path?: string | null;
          years_experience?: number;
          experience_months?: number;
          experience_started_at?: string | null;
          short_bio?: string | null;
          work_experience?: string | null;
          skills?: string[];
          extra_specialty_ids?: string[];
          featured_rank?: number | null;
          compensation_model?: Database["public"]["Enums"]["compensation_model"];
          salary_expectation?: number | null;
          commission_expectation?: number | null;
          verification_status?: Database["public"]["Enums"]["worker_verification_status"];
          availability_status?: Database["public"]["Enums"]["worker_availability_status"];
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      worker_portfolio: {
        Row: {
          id: string;
          worker_profile_id: string;
          storage_bucket: string;
          storage_path: string;
          display_order: number;
          alt_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worker_profile_id: string;
          storage_bucket?: string;
          storage_path: string;
          display_order: number;
          alt_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          worker_profile_id?: string;
          storage_bucket?: string;
          storage_path?: string;
          display_order?: number;
          alt_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employer_profiles: {
        Row: {
          id: string;
          profile_id: string;
          business_name: string;
          contact_person: string | null;
          phone: string | null;
          business_email: string | null;
          description: string | null;
          location: string | null;
          county: string | null;
          town: string | null;
          address_line: string | null;
          latitude: number | null;
          longitude: number | null;
          profile_image_path: string | null;
          salon_info: Json;
          category_id: string | null;
          extra_specialty_ids: string[];
          is_suspended: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          business_name: string;
          contact_person?: string | null;
          phone?: string | null;
          business_email?: string | null;
          description?: string | null;
          location?: string | null;
          county?: string | null;
          town?: string | null;
          address_line?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          profile_image_path?: string | null;
          salon_info?: Json;
          category_id?: string | null;
          extra_specialty_ids?: string[];
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          business_name?: string;
          contact_person?: string | null;
          phone?: string | null;
          business_email?: string | null;
          description?: string | null;
          location?: string | null;
          county?: string | null;
          town?: string | null;
          address_line?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          profile_image_path?: string | null;
          salon_info?: Json;
          category_id?: string | null;
          extra_specialty_ids?: string[];
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employer_specialty_migration_issues: {
        Row: {
          employer_profile_id: string;
          source_field: string;
          source_value: string;
          unmatched_values: string[];
          created_at: string;
        };
        Insert: {
          employer_profile_id: string;
          source_field?: string;
          source_value: string;
          unmatched_values: string[];
          created_at?: string;
        };
        Update: {
          employer_profile_id?: string;
          source_field?: string;
          source_value?: string;
          unmatched_values?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      employer_location_migration_issues: {
        Row: {
          employer_profile_id: string;
          source_location: string | null;
          source_address_line: string | null;
          reason: string;
          created_at: string;
        };
        Insert: {
          employer_profile_id: string;
          source_location?: string | null;
          source_address_line?: string | null;
          reason: string;
          created_at?: string;
        };
        Update: {
          employer_profile_id?: string;
          source_location?: string | null;
          source_address_line?: string | null;
          reason?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      employer_gallery: {
        Row: {
          id: string;
          employer_profile_id: string;
          storage_bucket: string;
          storage_path: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employer_profile_id: string;
          storage_bucket?: string;
          storage_path: string;
          display_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employer_profile_id?: string;
          storage_bucket?: string;
          storage_path?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      worker_profile_views: {
        Row: {
          id: string;
          worker_profile_id: string;
          employer_profile_id: string;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          worker_profile_id: string;
          employer_profile_id: string;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          worker_profile_id?: string;
          employer_profile_id?: string;
          viewed_at?: string;
        };
        Relationships: [];
      };
      worker_profile_view_cooldowns: {
        Row: {
          worker_profile_id: string;
          employer_profile_id: string;
          last_viewed_at: string;
        };
        Insert: {
          worker_profile_id: string;
          employer_profile_id: string;
          last_viewed_at: string;
        };
        Update: {
          worker_profile_id?: string;
          employer_profile_id?: string;
          last_viewed_at?: string;
        };
        Relationships: [];
      };
      worker_reactivation_requests: {
        Row: {
          id: string;
          worker_profile_id: string;
          reason: string | null;
          status: Database["public"]["Enums"]["reactivation_request_status"];
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worker_profile_id: string;
          reason?: string | null;
          status?: Database["public"]["Enums"]["reactivation_request_status"];
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          worker_profile_id?: string;
          reason?: string | null;
          status?: Database["public"]["Enums"]["reactivation_request_status"];
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      worker_profile_updates: {
        Row: {
          id: string;
          worker_profile_id: string;
          category_id: string;
          profile_photo_path: string | null;
          extra_specialty_ids: string[];
          portfolio_paths: string[] | null;
          status: Database["public"]["Enums"]["worker_profile_update_status"];
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worker_profile_id: string;
          category_id: string;
          profile_photo_path?: string | null;
          extra_specialty_ids?: string[];
          portfolio_paths?: string[] | null;
          status?: Database["public"]["Enums"]["worker_profile_update_status"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          worker_profile_id?: string;
          category_id?: string;
          profile_photo_path?: string | null;
          extra_specialty_ids?: string[];
          portfolio_paths?: string[] | null;
          status?: Database["public"]["Enums"]["worker_profile_update_status"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employer_requests: {
        Row: {
          id: string;
          employer_profile_id: string;
          worker_profile_id: string;
          status: Database["public"]["Enums"]["employer_request_status"];
          message: string | null;
          responded_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employer_profile_id: string;
          worker_profile_id: string;
          status?: Database["public"]["Enums"]["employer_request_status"];
          message?: string | null;
          responded_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employer_profile_id?: string;
          worker_profile_id?: string;
          status?: Database["public"]["Enums"]["employer_request_status"];
          message?: string | null;
          responded_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      handshakes: {
        Row: {
          id: string;
          employer_profile_id: string;
          worker_profile_id: string;
          request_id: string | null;
          status: Database["public"]["Enums"]["handshake_status"];
          matched_at: string;
          completed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employer_profile_id: string;
          worker_profile_id: string;
          request_id?: string | null;
          status?: Database["public"]["Enums"]["handshake_status"];
          matched_at?: string;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employer_profile_id?: string;
          worker_profile_id?: string;
          request_id?: string | null;
          status?: Database["public"]["Enums"]["handshake_status"];
          matched_at?: string;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body: string | null;
          data: Json;
          dedupe_key: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          body?: string | null;
          data?: Json;
          dedupe_key?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          title?: string;
          body?: string | null;
          data?: Json;
          dedupe_key?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_push_subscriptions: {
        Row: {
          id: string;
          profile_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          last_seen_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_deliveries: {
        Row: {
          id: string;
          notification_id: string;
          subscription_id: string;
          channel: Database["public"]["Enums"]["notification_delivery_channel"];
          status: Database["public"]["Enums"]["notification_delivery_status"];
          attempt_count: number;
          last_attempt_at: string;
          sent_at: string | null;
          last_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          notification_id: string;
          subscription_id: string;
          channel: Database["public"]["Enums"]["notification_delivery_channel"];
          status?: Database["public"]["Enums"]["notification_delivery_status"];
          attempt_count?: number;
          last_attempt_at?: string;
          sent_at?: string | null;
          last_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          notification_id?: string;
          subscription_id?: string;
          channel?: Database["public"]["Enums"]["notification_delivery_channel"];
          status?: Database["public"]["Enums"]["notification_delivery_status"];
          attempt_count?: number;
          last_attempt_at?: string;
          sent_at?: string | null;
          last_error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_activity: {
        Row: {
          id: string;
          actor_profile_id: string | null;
          action: string;
          target_table: string;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_profile_id?: string | null;
          action: string;
          target_table: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_profile_id?: string | null;
          action?: string;
          target_table?: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      website_visits: {
        Row: {
          id: string;
          visitor_id: string;
          session_id: string;
          path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          session_id: string;
          path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string;
          session_id?: string;
          path?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      push_campaigns: {
        Row: {
          id: string;
          created_by: string;
          title: string;
          body: string;
          target: Database["public"]["Enums"]["push_campaign_target"];
          campaign_type: Database["public"]["Enums"]["push_campaign_type"];
          status: Database["public"]["Enums"]["push_campaign_status"];
          audience_mode: Database["public"]["Enums"]["push_campaign_audience_mode"];
          audience_percentage: number;
          audience_estimated_count: number;
          audience_selected_count: number;
          campaign_period_days: number;
          sends_per_recipient: number;
          starts_at: string;
          ends_at: string;
          delivery_window_start: string;
          delivery_window_end: string;
          delivery_timezone: string;
          county: string | null;
          specialty_id: string | null;
          specialty_scope: Database["public"]["Enums"]["push_campaign_specialty_scope"];
          promoted_worker_profile_id: string | null;
          worker_destination: string | null;
          employer_destination: string | null;
          recipient_count: number;
          scheduled_delivery_count: number;
          sent_count: number;
          failed_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          title: string;
          body: string;
          target: Database["public"]["Enums"]["push_campaign_target"];
          campaign_type?: Database["public"]["Enums"]["push_campaign_type"];
          status?: Database["public"]["Enums"]["push_campaign_status"];
          audience_mode?: Database["public"]["Enums"]["push_campaign_audience_mode"];
          audience_percentage?: number;
          audience_estimated_count?: number;
          audience_selected_count?: number;
          campaign_period_days: number;
          sends_per_recipient: number;
          starts_at: string;
          ends_at: string;
          delivery_window_start?: string;
          delivery_window_end?: string;
          delivery_timezone?: string;
          county?: string | null;
          specialty_id?: string | null;
          specialty_scope?: Database["public"]["Enums"]["push_campaign_specialty_scope"];
          promoted_worker_profile_id?: string | null;
          worker_destination?: string | null;
          employer_destination?: string | null;
          recipient_count?: number;
          scheduled_delivery_count?: number;
          sent_count?: number;
          failed_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          title?: string;
          body?: string;
          target?: Database["public"]["Enums"]["push_campaign_target"];
          campaign_type?: Database["public"]["Enums"]["push_campaign_type"];
          status?: Database["public"]["Enums"]["push_campaign_status"];
          audience_mode?: Database["public"]["Enums"]["push_campaign_audience_mode"];
          audience_percentage?: number;
          audience_estimated_count?: number;
          audience_selected_count?: number;
          campaign_period_days?: number;
          sends_per_recipient?: number;
          starts_at?: string;
          ends_at?: string;
          delivery_window_start?: string;
          delivery_window_end?: string;
          delivery_timezone?: string;
          county?: string | null;
          specialty_id?: string | null;
          specialty_scope?: Database["public"]["Enums"]["push_campaign_specialty_scope"];
          promoted_worker_profile_id?: string | null;
          worker_destination?: string | null;
          employer_destination?: string | null;
          recipient_count?: number;
          scheduled_delivery_count?: number;
          sent_count?: number;
          failed_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_campaign_recipients: {
        Row: {
          id: string;
          campaign_id: string;
          profile_id: string;
          role: Database["public"]["Enums"]["profile_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          profile_id: string;
          role: Database["public"]["Enums"]["profile_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          profile_id?: string;
          role?: Database["public"]["Enums"]["profile_role"];
          created_at?: string;
        };
        Relationships: [];
      };
      push_campaign_deliveries: {
        Row: {
          id: string;
          campaign_id: string;
          recipient_id: string;
          occurrence_no: number;
          scheduled_for: string;
          status: Database["public"]["Enums"]["push_campaign_delivery_status"];
          attempt_count: number;
          claimed_at: string | null;
          notification_id: string | null;
          sent_at: string | null;
          last_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          recipient_id: string;
          occurrence_no: number;
          scheduled_for: string;
          status?: Database["public"]["Enums"]["push_campaign_delivery_status"];
          attempt_count?: number;
          claimed_at?: string | null;
          notification_id?: string | null;
          sent_at?: string | null;
          last_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          recipient_id?: string;
          occurrence_no?: number;
          scheduled_for?: string;
          status?: Database["public"]["Enums"]["push_campaign_delivery_status"];
          attempt_count?: number;
          claimed_at?: string | null;
          notification_id?: string | null;
          sent_at?: string | null;
          last_error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      push_campaign_profile_visits: {
        Row: {
          id: string;
          campaign_id: string;
          worker_profile_id: string;
          employer_profile_id: string;
          visit_day: string;
          visited_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          worker_profile_id: string;
          employer_profile_id: string;
          visit_day?: string;
          visited_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          worker_profile_id?: string;
          employer_profile_id?: string;
          visit_day?: string;
          visited_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_worker_profiles: {
        Row: {
          id: string;
          full_name: string;
          location: string | null;
          profile_photo_path: string | null;
          category_id: string | null;
          category_name: string | null;
          category_slug: string | null;
          years_experience: number;
          short_bio: string | null;
          work_experience: string | null;
          skills: string[];
          compensation_model: Database["public"]["Enums"]["compensation_model"];
          salary_expectation: number | null;
          commission_expectation: number | null;
          availability_status: Database["public"]["Enums"]["worker_availability_status"];
          created_at: string;
          updated_at: string;
          county: string | null;
          town: string | null;
          experience_months: number;
          extra_specialty_ids: string[];
          extra_specialty_names: string[];
          featured_rank: number | null;
        };
        Relationships: [];
      };
      public_employer_profiles: {
        Row: {
          id: string;
          business_name: string;
          phone: string | null;
          business_email: string | null;
          description: string | null;
          location: string | null;
          county: string | null;
          town: string | null;
          address_line: string | null;
          profile_image_path: string | null;
          salon_info: Json;
          category_id: string | null;
          category_name: string | null;
          category_slug: string | null;
          extra_specialty_ids: string[];
          extra_specialty_names: string[];
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
      };
      public_worker_portfolio: {
        Row: {
          id: string;
          worker_profile_id: string;
          storage_bucket: string;
          storage_path: string;
          display_order: number;
          alt_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      bc_create_worker_application: {
        Args: {
          p_full_name: string;
          p_phone?: string | null;
          p_location?: string | null;
          p_category_id?: string | null;
          p_profile_photo_path?: string | null;
          p_years_experience?: number;
          p_short_bio?: string | null;
          p_work_experience?: string | null;
          p_skills?: string[];
          p_compensation_model?: Database["public"]["Enums"]["compensation_model"];
          p_salary_expectation?: number | null;
          p_commission_expectation?: number | null;
        };
        Returns: string;
      };
      bc_create_employer_profile: {
        Args: {
          p_business_name: string;
          p_contact_person?: string | null;
          p_phone?: string | null;
          p_business_email?: string | null;
          p_description?: string | null;
          p_location?: string | null;
          p_county?: string | null;
          p_town?: string | null;
          p_address_line?: string | null;
          p_latitude?: number | null;
          p_longitude?: number | null;
          p_profile_image_path?: string | null;
          p_salon_info?: Json;
          p_category_id?: string | null;
          p_extra_specialty_ids?: string[];
        };
        Returns: string;
      };
      bc_submit_worker_application: {
        Args: {
          p_full_name: string;
          p_phone?: string | null;
          p_location?: string | null;
          p_category_id?: string | null;
          p_profile_photo_path?: string | null;
          p_years_experience?: number;
          p_short_bio?: string | null;
          p_work_experience?: string | null;
          p_skills?: string[];
          p_compensation_model?: Database["public"]["Enums"]["compensation_model"];
          p_salary_expectation?: number | null;
          p_commission_expectation?: number | null;
          p_county: string;
          p_town: string;
          p_experience_months?: number;
          p_extra_specialty_ids?: string[];
          p_portfolio_paths?: string[];
        };
        Returns: string;
      };
      bc_submit_worker_reviewed_profile: {
        Args: {
          p_worker_profile_id: string;
          p_category_id: string;
          p_profile_photo_path?: string | null;
          p_extra_specialty_ids?: string[];
          p_portfolio_paths?: string[];
        };
        Returns: string;
      };
      bc_approve_worker_profile_update: {
        Args: { p_update_id: string };
        Returns: undefined;
      };
      bc_reject_worker_profile_update: {
        Args: { p_update_id: string; p_reason?: string | null };
        Returns: undefined;
      };
      bc_record_worker_profile_view: {
        Args: { p_worker_profile_id: string };
        Returns: boolean;
      };
      bc_claim_notification_push_delivery: {
        Args: { p_notification_id: string; p_subscription_id: string };
        Returns: string | null;
      };
      bc_get_worker_profile_analytics: {
        Args: { p_worker_profile_id: string };
        Returns: {
          total_profile_views: number;
          weekly_profile_views: number;
          unique_employer_views: number;
        }[];
      };
      bc_approve_worker: {
        Args: { p_worker_profile_id: string };
        Returns: undefined;
      };
      bc_reject_worker: {
        Args: { p_worker_profile_id: string; p_reason?: string | null };
        Returns: undefined;
      };
      bc_suspend_worker: {
        Args: { p_worker_profile_id: string; p_reason?: string | null };
        Returns: undefined;
      };
      bc_restore_worker: {
        Args: { p_worker_profile_id: string };
        Returns: undefined;
      };
      bc_suspend_employer: {
        Args: { p_employer_profile_id: string; p_reason?: string | null };
        Returns: undefined;
      };
      bc_restore_employer: {
        Args: { p_employer_profile_id: string };
        Returns: undefined;
      };
      bc_request_worker: {
        Args: { p_worker_profile_id: string; p_message?: string | null };
        Returns: string;
      };
      bc_respond_to_worker_request: {
        Args: {
          p_request_id: string;
          p_response: Database["public"]["Enums"]["employer_request_status"];
        };
        Returns: string | null;
      };
      bc_complete_handshake: {
        Args: { p_request_id: string };
        Returns: string;
      };
      bc_update_worker_availability: {
        Args: {
          p_availability: Database["public"]["Enums"]["worker_availability_status"];
        };
        Returns: undefined;
      };
      bc_finalize_profile_role: {
        Args: {
          p_role: Database["public"]["Enums"]["profile_role"];
        };
        Returns: undefined;
      };
      bc_add_admin_email_whitelist: {
        Args: { p_email: string };
        Returns: string;
      };
      bc_remove_admin_email_whitelist: {
        Args: { p_email: string };
        Returns: undefined;
      };
      bc_update_company_settings: {
        Args: { p_phone?: string | null; p_email?: string | null };
        Returns: undefined;
      };
      bc_request_account_deletion: {
        Args: Record<string, never>;
        Returns: string;
      };
      bc_cancel_account_deletion: {
        Args: { p_profile_id: string };
        Returns: undefined;
      };
      bc_set_featured_workers: {
        Args: { p_worker_profile_ids: string[] };
        Returns: undefined;
      };
      bc_request_worker_reactivation: {
        Args: { p_reason?: string | null };
        Returns: string;
      };
      bc_approve_worker_reactivation: {
        Args: { p_request_id: string };
        Returns: undefined;
      };
      bc_decline_worker_reactivation: {
        Args: { p_request_id: string; p_reason?: string | null };
        Returns: undefined;
      };
      bc_get_speciality_carousel: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["categories"]["Row"][];
      };
      bc_preview_push_campaign_audience: {
        Args: {
          p_target: Database["public"]["Enums"]["push_campaign_target"];
          p_campaign_type?: Database["public"]["Enums"]["push_campaign_type"];
          p_audience_percentage?: number;
          p_county?: string | null;
          p_specialty_id?: string | null;
          p_specialty_scope?: Database["public"]["Enums"]["push_campaign_specialty_scope"];
          p_promoted_worker_profile_id?: string | null;
        };
        Returns: {
          eligible_count: number;
          selected_count: number;
        }[];
      };
      bc_create_push_campaign: {
        Args: {
          p_title: string;
          p_body: string;
          p_target: Database["public"]["Enums"]["push_campaign_target"];
          p_campaign_type: Database["public"]["Enums"]["push_campaign_type"];
          p_audience_mode: Database["public"]["Enums"]["push_campaign_audience_mode"];
          p_audience_percentage: number;
          p_campaign_period_days: number;
          p_sends_per_recipient: number;
          p_starts_at: string;
          p_ends_at: string;
          p_delivery_window_start: string;
          p_delivery_window_end: string;
          p_delivery_timezone: string;
          p_county?: string | null;
          p_specialty_id?: string | null;
          p_specialty_scope?: Database["public"]["Enums"]["push_campaign_specialty_scope"];
          p_promoted_worker_profile_id?: string | null;
          p_worker_destination?: string | null;
          p_employer_destination?: string | null;
        };
        Returns: string;
      };
      bc_activate_push_campaign: {
        Args: { p_campaign_id: string };
        Returns: Database["public"]["Enums"]["push_campaign_status"];
      };
      bc_record_push_campaign_profile_visit: {
        Args: { p_campaign_id: string; p_worker_profile_id: string };
        Returns: boolean;
      };
      bc_pause_push_campaign: {
        Args: { p_campaign_id: string };
        Returns: Database["public"]["Enums"]["push_campaign_status"];
      };
      bc_resume_push_campaign: {
        Args: { p_campaign_id: string };
        Returns: Database["public"]["Enums"]["push_campaign_status"];
      };
      bc_cancel_push_campaign: {
        Args: { p_campaign_id: string };
        Returns: Database["public"]["Enums"]["push_campaign_status"];
      };
      bc_duplicate_push_campaign: {
        Args: { p_campaign_id: string };
        Returns: string;
      };
      bc_claim_push_campaign_deliveries: {
        Args: { p_limit?: number };
        Returns: {
          delivery_id: string;
          campaign_id: string;
          profile_id: string;
        }[];
      };
      bc_create_push_campaign_notification: {
        Args: { p_delivery_id: string };
        Returns: string | null;
      };
      bc_finalize_push_campaign_delivery: {
        Args: {
          p_delivery_id: string;
          p_status: Database["public"]["Enums"]["push_campaign_delivery_status"];
          p_last_error?: string | null;
        };
        Returns: undefined;
      };
      bc_get_push_campaign_analytics: {
        Args: { p_campaign_id: string };
        Returns: {
          intended_audience: number;
          scheduled_recipients: number;
          sent: number;
          delivered: number;
          failed: number;
          profile_visits: number;
          opened: number;
          clicked: number;
        }[];
      };
    };
    Enums: {
      profile_role: "worker" | "employer" | "admin";
      worker_verification_status:
        "draft" | "pending_review" | "approved" | "rejected";
      worker_availability_status: "available" | "considering" | "matched";
      compensation_model:
        | "salary"
        | "commission"
        | "salary_plus_commission"
        | "hourly"
        | "negotiable";
      employer_request_status:
        | "pending"
        | "accepted"
        | "considering"
        | "declined"
        | "cancelled"
        | "expired";
      handshake_status: "matched" | "completed" | "cancelled";
      reactivation_request_status: "pending" | "approved" | "declined";
      worker_profile_update_status: "pending" | "approved" | "rejected";
      notification_type:
        | "application_submitted"
        | "application_approved"
        | "application_rejected"
        | "employer_request_received"
        | "request_accepted"
        | "request_considered"
        | "request_declined"
        | "handshake_completed"
        | "profile_views_aggregated"
        | "push_campaign";
      notification_delivery_channel: "push";
      notification_delivery_status: "sending" | "sent" | "failed";
      push_campaign_target: "worker" | "employer" | "both";
      push_campaign_type: "general" | "promote_worker";
      push_campaign_status:
        "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled";
      push_campaign_audience_mode: "all" | "percentage";
      push_campaign_specialty_scope: "any" | "main" | "extra";
      push_campaign_delivery_status:
        "pending" | "processing" | "sent" | "failed";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
