export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
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
          listing_type: "physical" | "service" | "digital";
          condition: "new" | "used" | "refurbished" | null;
          images: string[];
          university_id: string | null;
          location: string | null;
          is_negotiable: boolean;
          delivery_type: "meetup" | "delivery" | "digital" | "both";
          file_url: string | null;
          preview_url: string | null;
          status: "active" | "sold" | "paused" | "deleted";
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
          listing_type: "physical" | "service" | "digital";
          condition?: "new" | "used" | "refurbished" | null;
          images?: string[];
          university_id?: string | null;
          location?: string | null;
          is_negotiable?: boolean;
          delivery_type?: "meetup" | "delivery" | "digital" | "both";
          file_url?: string | null;
          preview_url?: string | null;
          status?: "active" | "sold" | "paused" | "deleted";
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
          listing_type?: "physical" | "service" | "digital";
          condition?: "new" | "used" | "refurbished" | null;
          images?: string[];
          university_id?: string | null;
          location?: string | null;
          is_negotiable?: boolean;
          delivery_type?: "meetup" | "delivery" | "digital" | "both";
          file_url?: string | null;
          preview_url?: string | null;
          status?: "active" | "sold" | "paused" | "deleted";
          views_count?: number;
          created_at?: string;
          updated_at?: string;
        };
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
          escrow_status: "pending" | "funded" | "delivered" | "completed" | "disputed" | "refunded" | "cancelled";
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
          escrow_status?: "pending" | "funded" | "delivered" | "completed" | "disputed" | "refunded" | "cancelled";
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
          escrow_status?: "pending" | "funded" | "delivered" | "completed" | "disputed" | "refunded" | "cancelled";
          paystack_reference?: string | null;
          payment_confirmed_at?: string | null;
          delivered_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          poster_id: string;
          title: string;
          description: string;
          job_type: "gig" | "internship" | "ambassador" | "freelance" | "remote";
          category: string;
          university_id: string | null;
          location: string | null;
          is_remote: boolean;
          budget_type: "fixed" | "hourly" | "negotiable";
          budget_min: number | null;
          budget_max: number | null;
          deadline: string | null;
          requirements: string[];
          skills: string[];
          applications_count: number;
          status: "open" | "closed" | "filled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          poster_id: string;
          title: string;
          description: string;
          job_type: "gig" | "internship" | "ambassador" | "freelance" | "remote";
          category: string;
          university_id?: string | null;
          location?: string | null;
          is_remote?: boolean;
          budget_type?: "fixed" | "hourly" | "negotiable";
          budget_min?: number | null;
          budget_max?: number | null;
          deadline?: string | null;
          requirements?: string[];
          skills?: string[];
          applications_count?: number;
          status?: "open" | "closed" | "filled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          poster_id?: string;
          title?: string;
          description?: string;
          job_type?: "gig" | "internship" | "ambassador" | "freelance" | "remote";
          category?: string;
          university_id?: string | null;
          location?: string | null;
          is_remote?: boolean;
          budget_type?: "fixed" | "hourly" | "negotiable";
          budget_min?: number | null;
          budget_max?: number | null;
          deadline?: string | null;
          requirements?: string[];
          skills?: string[];
          applications_count?: number;
          status?: "open" | "closed" | "filled";
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "transaction_update" | "review_received" | "job_update" | "dispute_update" | "verification_update" | "system";
          title: string;
          message: string | null;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "transaction_update" | "review_received" | "job_update" | "dispute_update" | "verification_update" | "system";
          title: string;
          message?: string | null;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "transaction_update" | "review_received" | "job_update" | "dispute_update" | "verification_update" | "system";
          title?: string;
          message?: string | null;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
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
  };
}
