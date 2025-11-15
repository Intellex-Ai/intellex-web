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
      projects: {
        Row: {
          id: string;
          user_id: string | null;
          profile_id: string | null;
          title: string;
          query: string;
          status: 'queued' | 'running' | 'done' | 'error';
          depth: 'quick' | 'standard' | 'deep';
          created_at: string | null;
          task_graph: Json | null;
          verifier_summary: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          profile_id?: string | null;
          title: string;
          query: string;
          status?: 'queued' | 'running' | 'done' | 'error';
          depth?: 'quick' | 'standard' | 'deep';
          created_at?: string | null;
          task_graph?: Json | null;
          verifier_summary?: string | null;
        };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'projects_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      sources: {
        Row: {
          id: string;
          project_id: string;
          url: string;
          domain: string | null;
          title: string | null;
          published_at: string | null;
          content: string | null;
          html: string | null;
          status: string | null;
          attempt_count: number;
          fetch_strategy: string | null;
          error_code: string | null;
          last_error: string | null;
          proxy_used: boolean;
          source_type: string | null;
          relevance_score: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          url: string;
          domain?: string | null;
          title?: string | null;
          published_at?: string | null;
          content?: string | null;
          html?: string | null;
          status?: string | null;
          attempt_count?: number;
          fetch_strategy?: string | null;
          error_code?: string | null;
          last_error?: string | null;
          proxy_used?: boolean;
          source_type?: string | null;
          relevance_score?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sources']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'sources_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      facts: {
        Row: {
          id: string;
          project_id: string;
          source_id: string | null;
          fact_type: string | null;
          content: string;
          snippet: string | null;
          confidence: number | null;
          verified: boolean;
          verification_notes: string | null;
          verified_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          source_id?: string | null;
          fact_type?: string | null;
          content: string;
          snippet?: string | null;
          confidence?: number | null;
          verified?: boolean;
          verification_notes?: string | null;
          verified_at?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['facts']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'facts_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'facts_source_id_fkey';
            columns: ['source_id'];
            referencedRelation: 'sources';
            referencedColumns: ['id'];
          }
        ];
      };
      reports: {
        Row: {
          id: string;
          project_id: string;
          markdown: string;
          json_outline: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          markdown: string;
          json_outline?: Json | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'reports_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      source_chunks: {
        Row: {
          id: string;
          project_id: string;
          source_id: string;
          idx: number;
          text: string;
          embedding: number[] | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          source_id: string;
          idx: number;
          text: string;
          embedding?: number[] | null;
        };
        Update: Partial<Database['public']['Tables']['source_chunks']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'source_chunks_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'source_chunks_source_id_fkey';
            columns: ['source_id'];
            referencedRelation: 'sources';
            referencedColumns: ['id'];
          }
        ];
      };
      model_sources: {
        Row: {
          id: string;
          vendor: string;
          model_name: string;
          primary_url: string;
          rss_url: string | null;
          keywords: string[] | null;
          fallback_queries: string[] | null;
          mirrors: string[] | null;
          mirrored_assets: string[] | null;
          press_pdfs: string[] | null;
          docs_url: string | null;
          api_ref: string | null;
          freshness_interval_hours: number | null;
          needs_proxy: boolean | null;
          priority: number | null;
          last_verified_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          vendor: string;
          model_name: string;
          primary_url: string;
          rss_url?: string | null;
          keywords?: string[] | null;
          fallback_queries?: string[] | null;
          mirrors?: string[] | null;
          mirrored_assets?: string[] | null;
          press_pdfs?: string[] | null;
          docs_url?: string | null;
          api_ref?: string | null;
          freshness_interval_hours?: number | null;
          needs_proxy?: boolean | null;
          priority?: number | null;
          last_verified_at?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['model_sources']['Insert']>;
        Relationships: [];
      };
      model_releases: {
        Row: {
          id: string;
          model_source_id: string;
          version: string | null;
          release_date: string | null;
          payload: Json | null;
          summary: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          model_source_id: string;
          version?: string | null;
          release_date?: string | null;
          payload?: Json | null;
          summary?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['model_releases']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'model_releases_model_source_id_fkey';
            columns: ['model_source_id'];
            referencedRelation: 'model_sources';
            referencedColumns: ['id'];
          }
        ];
      };
      scrape_events: {
        Row: {
          id: string;
          project_id: string;
          source_id: string;
          url: string;
          attempt: number;
          strategy: string;
          status: string | null;
          error: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          source_id: string;
          url: string;
          attempt: number;
          strategy: string;
          status?: string | null;
          error?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['scrape_events']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'scrape_events_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scrape_events_source_id_fkey';
            columns: ['source_id'];
            referencedRelation: 'sources';
            referencedColumns: ['id'];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string | null;
          display_name: string | null;
          openai_api_key: string | null;
          anthropic_api_key: string | null;
          gemini_api_key: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          display_name?: string | null;
          openai_api_key?: string | null;
          anthropic_api_key?: string | null;
          gemini_api_key?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'profiles_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
