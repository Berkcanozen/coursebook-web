// src/lib/database.types.ts
//
// TypeScript definitions for the Supabase schema (public schema only).
// This file is the source of truth the typed `supabase` client checks every
// table name, column name, and payload against — so a column rename in the DB
// breaks the build here instead of failing silently at runtime.
//
// It is kept in sync with the live schema by .github/workflows/update-types.yml
// (which runs `supabase gen types ...`). You can also regenerate it manually.
// The hand-written version below matches supabase/01_schema.sql.

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
      profiles: {
        Row: {
          id: string;
          family_name: string;
          currency: string;
          created_at: string;
        };
        Insert: {
          id: string;
          family_name?: string;
          currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_name?: string;
          currency?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      children: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          user_id: string;
          child_id: string;
          name: string;
          instructor: string;
          location: string;
          schedule: string;
          fee: number;
          fee_type: string;
          icon: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          child_id: string;
          name: string;
          instructor?: string;
          location?: string;
          schedule?: string;
          fee?: number;
          fee_type?: string;
          icon?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          child_id?: string;
          name?: string;
          instructor?: string;
          location?: string;
          schedule?: string;
          fee?: number;
          fee_type?: string;
          icon?: string;
          created_at?: string;
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
          id: string;
          user_id: string;
          course_id: string;
          date: string;
          amount: number;
          paid: boolean;
          note: string;
          attendance: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          course_id: string;
          date: string;
          amount?: number;
          paid?: boolean;
          note?: string;
          attendance?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          date?: string;
          amount?: number;
          paid?: boolean;
          note?: string;
          attendance?: string;
          created_at?: string;
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
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience aliases used by the data layer.
type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
