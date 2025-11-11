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
          title: string;
          query: string;
          status: 'queued' | 'running' | 'done' | 'error';
          depth: 'quick' | 'standard' | 'deep';
          created_at: string | null;
          task_graph: Json | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          query: string;
          status?: 'queued' | 'running' | 'done' | 'error';
          depth?: 'quick' | 'standard' | 'deep';
          created_at?: string | null;
          task_graph?: Json | null;
        };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
        Relationships: [];
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
