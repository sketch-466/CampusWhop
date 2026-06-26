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
      universities: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          state: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          short_name: string;
          state: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          short_name?: string;
          state?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          username: string | null;
          bio: string | null;
          avatar_url: string | null;
          phone: string | null;
          university_id: string | null;
          department: string | null;
          level: string | null;
          matric_number: string | null;
          user_type: string;
          reputation_score: number;
          total_sales: number;
          total_purchases: number;
          total_jobs_completed: number;
          total_reviews: number;
          avg_rating: number;
          is_verified: boolean;
          is_admin: boolean;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          university_id?: string | null;
          department?: string | null;
          level?: string | null;
          matric_number?: string | null;
          user_type?: string;
          reputation_score?: number;
          total_sales?: number;
          total_purchases?: number;
          total_jobs_completed?: number;
          total_reviews?: number;
          avg_rating?: number;
          is_verified?: boolean;
          is_admin?: boolean;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          university_id?: string | null;
          department?: string | null;
          level?: string | null;
          matric_number?: string | null;
          user_type?: string;
          reputation_score?: number;
          total_sales?: number;
          total_purchases?: number;
          total_jobs_completed?: number;
          total_reviews?: number;
          avg_rating?: number;
          is_verified?: boolean;
          is_admin?: boolean;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey";
            columns: ["university_id"];
            referencedRelation: "universities";
            referencedColumns: ["id"];
          }
        ];
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string | null;
          price: number;
          original_price: number | null;
          category: string;
          listing_type: string;
          condition: string | null;
          images: string[];
          university_id: string | null;
          location: string | null;
          is_negotiable: boolean;
          delivery_type: string;
          file_url: string | null;
          preview_url: string | null;
          status: string;
          views_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description?: string | null;
          price: number;
          original_price?: number | null;
          category: string;
          listing_type: string;
          condition?: string | null;
          images?: string[];
          university_id?: string | null;
          location?: string | null;
          is_negotiable?: boolean;
          delivery_type?: string;
          file_url?: string | null;
          preview_url?: string | null;
          status?: string;
          views_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          title?: string;
          description?: string | null;
          price?: number;
          original_price?: number | null;
          category?: string;
          listing_type?: string;
          condition?: string | null;
          images?: string[];
          university_id?: string | null;
          location?: string | null;
          is_negotiable?: boolean;
          delivery_type?: string;
          file_url?: string | null;
          preview_url?: string | null;
          status?: string;
          views_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey";
            columns: ["seller_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_university_id_fkey";
            columns: ["university_id"];
            referencedRelation: "universities";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          platform_fee: number;
          seller_payout: number;
          escrow_status: string;
          paystack_reference: string | null;
          payment_confirmed_at: string | null;
          delivered_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          platform_fee?: number;
          seller_payout?: number;
          escrow_status?: string;
          paystack_reference?: string | null;
          payment_confirmed_at?: string | null;
          delivered_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          buyer_id?: string;
          seller_id?: string;
          amount?: number;
          platform_fee?: number;
          seller_payout?: number;
          escrow_status?: string;
          paystack_reference?: string | null;
          payment_confirmed_at?: string | null;
          delivered_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_buyer_id_fkey";
            columns: ["buyer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_seller_id_fkey";
            columns: ["seller_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      disputes: {
        Row: {
          id: string;
          transaction_id: string;
          raised_by: string;
          reason: string;
          evidence_urls: string[];
          status: string;
          admin_notes: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          raised_by: string;
          reason: string;
          evidence_urls?: string[];
          status?: string;
          admin_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          raised_by?: string;
          reason?: string;
          evidence_urls?: string[];
          status?: string;
          admin_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "disputes_transaction_id_fkey";
            columns: ["transaction_id"];
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "disputes_raised_by_fkey";
            columns: ["raised_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          transaction_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          review_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment?: string | null;
          review_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          rating?: number;
          comment?: string | null;
          review_type?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_transaction_id_fkey";
            columns: ["transaction_id"];
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey";
            columns: ["reviewee_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      reputation_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          points: number;
          description: string | null;
          related_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          points: number;
          description?: string | null;
          related_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          points?: number;
          description?: string | null;
          related_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reputation_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      jobs: {
        Row: {
          id: string;
          poster_id: string;
          title: string;
          description: string;
          job_type: string;
          category: string;
          university_id: string | null;
          location: string | null;
          is_remote: boolean;
          budget_type: string;
          budget_min: number | null;
          budget_max: number | null;
          deadline: string | null;
          requirements: string[];
          skills: string[];
          applications_count: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          poster_id: string;
          title: string;
          description: string;
          job_type: string;
          category: string;
          university_id?: string | null;
          location?: string | null;
          is_remote?: boolean;
          budget_type?: string;
          budget_min?: number | null;
          budget_max?: number | null;
          deadline?: string | null;
          requirements?: string[];
          skills?: string[];
          applications_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          poster_id?: string;
          title?: string;
          description?: string;
          job_type?: string;
          category?: string;
          university_id?: string | null;
          location?: string | null;
          is_remote?: boolean;
          budget_type?: string;
          budget_min?: number | null;
          budget_max?: number | null;
          deadline?: string | null;
          requirements?: string[];
          skills?: string[];
          applications_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_poster_id_fkey";
            columns: ["poster_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_university_id_fkey";
            columns: ["university_id"];
            referencedRelation: "universities";
            referencedColumns: ["id"];
          }
        ];
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_id: string;
          cover_letter: string | null;
          resume_url: string | null;
          portfolio_url: string | null;
          status: string;
          employer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          applicant_id: string;
          cover_letter?: string | null;
          resume_url?: string | null;
          portfolio_url?: string | null;
          status?: string;
          employer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          applicant_id?: string;
          cover_letter?: string | null;
          resume_url?: string | null;
          portfolio_url?: string | null;
          status?: string;
          employer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_applications_applicant_id_fkey";
            columns: ["applicant_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      verification_requests: {
        Row: {
          id: string;
          user_id: string;
          request_type: string;
          status: string;
          documents: Json;
          reviewed_by: string | null;
          reviewed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          request_type: string;
          status?: string;
          documents?: Json;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          request_type?: string;
          status?: string;
          documents?: Json;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "verification_requests_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
