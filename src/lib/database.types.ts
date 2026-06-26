// Generated-style types for the Coursebook Supabase schema.
// Mirrors the output of `supabase gen types typescript`. If you later regenerate
// from the live database, replace this file wholesale.

export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; family_name: string; currency: string; created_at: string };
        Insert: { id: string; family_name?: string; currency?: string; created_at?: string };
        Update: { id?: string; family_name?: string; currency?: string; created_at?: string };
        Relationships: [];
      };
      children: {
        Row: { id: string; user_id: string; name: string; color: string; created_at: string };
        Insert: { id?: string; user_id?: string; name: string; color?: string; created_at?: string };
        Update: { id?: string; user_id?: string; name?: string; color?: string; created_at?: string };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string; user_id: string; child_id: string; name: string;
          instructor: string; location: string; schedule: string;
          fee: number; fee_type: string; icon: string; created_at: string;
        };
        Insert: {
          id?: string; user_id?: string; child_id: string; name: string;
          instructor?: string; location?: string; schedule?: string;
          fee?: number; fee_type?: string; icon?: string; created_at?: string;
        };
        Update: {
          id?: string; user_id?: string; child_id?: string; name?: string;
          instructor?: string; location?: string; schedule?: string;
          fee?: number; fee_type?: string; icon?: string; created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_child_id_fkey';
            columns: ['child_id'];
            isOneToOne: false;
            referencedRelation: 'children';
            referencedColumns: ['id'];
          },
        ];
      };
      sessions: {
        Row: {
          id: string; user_id: string; course_id: string; date: string;
          amount: number; paid: boolean; note: string; created_at: string;
        };
        Insert: {
          id?: string; user_id?: string; course_id: string; date: string;
          amount?: number; paid?: boolean; note?: string; created_at?: string;
        };
        Update: {
          id?: string; user_id?: string; course_id?: string; date?: string;
          amount?: number; paid?: boolean; note?: string; created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
