export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          preferences: Json | null
          communication_style: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          preferences?: Json | null
          communication_style?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          preferences?: Json | null
          communication_style?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          narrative_prose: string | null
          chapter: string | null
          tags: string[] | null
          sentiment_score: number | null
          audio_url: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          narrative_prose?: string | null
          chapter?: string | null
          tags?: string[] | null
          sentiment_score?: number | null
          audio_url?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          narrative_prose?: string | null
          chapter?: string | null
          tags?: string[] | null
          sentiment_score?: number | null
          audio_url?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          story_id: string | null
          messages: Json
          chapter: string | null
          persona: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_id?: string | null
          messages?: Json
          chapter?: string | null
          persona?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string | null
          messages?: Json
          chapter?: string | null
          persona?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      family_groups: {
        Row: {
          id: string
          name: string
          owner_id: string
          settings: Json | null
          invite_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_group_id: string
          user_id: string | null
          email: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          relationship: string | null
          status: 'pending' | 'active' | 'inactive'
          joined_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_group_id: string
          user_id?: string | null
          email: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          relationship?: string | null
          status?: 'pending' | 'active' | 'inactive'
          joined_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_group_id?: string
          user_id?: string | null
          email?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          relationship?: string | null
          status?: 'pending' | 'active' | 'inactive'
          joined_at?: string | null
          created_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          user_id: string
          story_id: string | null
          storage_path: string
          filename: string
          analysis: Json | null
          extracted_date: string | null
          extracted_location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_id?: string | null
          storage_path: string
          filename: string
          analysis?: Json | null
          extracted_date?: string | null
          extracted_location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string | null
          storage_path?: string
          filename?: string
          analysis?: Json | null
          extracted_date?: string | null
          extracted_location?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Story = Database['public']['Tables']['stories']['Row']
export type StoryInsert = Database['public']['Tables']['stories']['Insert']
export type StoryUpdate = Database['public']['Tables']['stories']['Update']

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

export type FamilyGroup = Database['public']['Tables']['family_groups']['Row']
export type FamilyGroupInsert = Database['public']['Tables']['family_groups']['Insert']
export type FamilyGroupUpdate = Database['public']['Tables']['family_groups']['Update']

export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert']
export type FamilyMemberUpdate = Database['public']['Tables']['family_members']['Update']

export type Photo = Database['public']['Tables']['photos']['Row']
export type PhotoInsert = Database['public']['Tables']['photos']['Insert']
export type PhotoUpdate = Database['public']['Tables']['photos']['Update']
