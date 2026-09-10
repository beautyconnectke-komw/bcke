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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: Database["public"]["Enums"]["profile_role"] | null;
          display_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["profile_role"] | null;
          display_name?: string | null;
          phone?: string | null;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          display_order?: number;
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
          address_line: string | null;
          latitude: number | null;
          longitude: number | null;
          profile_image_path: string | null;
          salon_info: Json;
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
          address_line?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          profile_image_path?: string | null;
          salon_info?: Json;
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
          address_line?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          profile_image_path?: string | null;
          salon_info?: Json;
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
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
          read_at?: string | null;
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
          address_line: string | null;
          profile_image_path: string | null;
          salon_info: Json;
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
          p_address_line?: string | null;
          p_latitude?: number | null;
          p_longitude?: number | null;
          p_profile_image_path?: string | null;
          p_salon_info?: Json;
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
      bc_record_worker_profile_view: {
        Args: { p_worker_profile_id: string };
        Returns: boolean;
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
      bc_set_featured_workers: {
        Args: { p_worker_profile_ids: string[] };
        Returns: undefined;
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
      notification_type:
        | "application_submitted"
        | "application_approved"
        | "application_rejected"
        | "employer_request_received"
        | "request_accepted"
        | "request_considered"
        | "request_declined"
        | "handshake_completed";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
