/**
 * Generated Supabase Database types — hand-curated to match the DDL in
 * PROJECT_BLUEPRINT.md §4. Regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StudentStatus =
  | 'active'
  | 'repeated'
  | 'transferred'
  | 'leave'
  | 'frozen'
  | 'suspended'
  | 'withdrawn'
  | 'dismissed';

export type SemesterStatus = 'completed' | 'partial' | 'upcoming';

export type CourseGradeNote =
  | 'NONE'
  | 'Sup'
  | 'Sub'
  | 'Cro'
  | 'Inc'
  | 'Rtk'
  | 'Rst';

export type AcademicRemark =
  | 'Pas'
  | 'Prm'
  | 'Rpt'
  | 'Rdo'
  | 'Frz'
  | 'Sus'
  | 'Wdr'
  | 'Dsc'
  | 'Dsm'
  | 'Rad'
  | 'Rrg'
  | 'Crg'
  | 'Rej'
  | 'PND';

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          student_id: string;
          name_ar: string;
          name_en: string;
          origin_tag: string;
          status: StudentStatus;
          current_year_level: number;
          is_claimed: boolean;
          is_approved: boolean;
          auth_user_id: string | null;
          is_name_visible: boolean;
          registration_blocked: boolean;
          leaderboard_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          student_id: string;
          name_ar: string;
          name_en: string;
          origin_tag: string;
          status?: StudentStatus;
          current_year_level?: number;
          is_claimed?: boolean;
          is_approved?: boolean;
          auth_user_id?: string | null;
          is_name_visible?: boolean;
          registration_blocked?: boolean;
          leaderboard_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['students']['Insert']>;
        Relationships: [{ foreignKeyName: 'students_auth_user_id_fkey', columns: ['auth_user_id'], referencedRelation: 'users', referencedColumns: ['id'] }];
      };
      semesters: {
        Row: {
          semester_id: string;
          academic_year: string;
          year_level: number;
          semester_num: number;
          title_ar: string;
          title_en: string;
          status: SemesterStatus;
        };
        Insert: {
          semester_id: string;
          academic_year: string;
          year_level: number;
          semester_num: number;
          title_ar: string;
          title_en: string;
          status?: SemesterStatus;
        };
        Update: Partial<Database['public']['Tables']['semesters']['Insert']>;
        Relationships: [];
      };
      courses: {
        Row: {
          course_code: string;
          semester_id: string | null;
          name_ar: string;
          name_en: string;
          credit_hours: number;
        };
        Insert: {
          course_code: string;
          semester_id?: string | null;
          name_ar: string;
          name_en: string;
          credit_hours: number;
        };
        Update: Partial<Database['public']['Tables']['courses']['Insert']>;
        Relationships: [{ foreignKeyName: 'courses_semester_id_fkey', columns: ['semester_id'], referencedRelation: 'semesters', referencedColumns: ['semester_id'] }];
      };
      grade_scale: {
        Row: {
          grade_letter: string;
          min_score: number;
          max_score: number;
          points: number;
        };
        Insert: {
          grade_letter: string;
          min_score: number;
          max_score: number;
          points: number;
        };
        Update: Partial<Database['public']['Tables']['grade_scale']['Insert']>;
        Relationships: [];
      };
      student_grades: {
        Row: {
          id: number;
          student_id: string;
          course_code: string;
          semester_id: string;
          grade_letter: string | null;
          numeric_score: number | null;
          note: CourseGradeNote;
          is_supplementary: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          student_id: string;
          course_code: string;
          semester_id: string;
          grade_letter?: string | null;
          numeric_score?: number | null;
          note?: CourseGradeNote;
          is_supplementary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['student_grades']['Insert']>;
        Relationships: [
          { foreignKeyName: 'student_grades_student_id_fkey', columns: ['student_id'], referencedRelation: 'students', referencedColumns: ['student_id'] },
          { foreignKeyName: 'student_grades_course_code_fkey', columns: ['course_code'], referencedRelation: 'courses', referencedColumns: ['course_code'] },
          { foreignKeyName: 'student_grades_semester_id_fkey', columns: ['semester_id'], referencedRelation: 'semesters', referencedColumns: ['semester_id'] },
        ];
      };
student_gpa_history: {
        Row: {
          id: number;
          student_id: string;
          semester_id: string;
          year_level: number;
          semester_gpa: number | null;
          year_gpa: number | null;
          cumulative_gpa: number;
          rank_overall: number | null;
          rank_origin_cohort: number | null;
          remark: AcademicRemark;
          updated_at: string;
        };
        Insert: {
          id?: number;
          student_id: string;
          semester_id: string;
          year_level: number;
          semester_gpa?: number | null;
          year_gpa?: number | null;
          cumulative_gpa: number;
          rank_overall?: number | null;
          rank_origin_cohort?: number | null;
          remark?: AcademicRemark;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['student_gpa_history']['Insert']>;
        Relationships: [{ foreignKeyName: 'student_gpa_history_student_id_fkey', columns: ['student_id'], referencedRelation: 'students', referencedColumns: ['student_id'] }];
      };
      platform_config: {
        Row: { key: string; value: Json; updated_at: string };
        Insert: { key: string; value: Json; updated_at?: string };
        Update: Partial<Database['public']['Tables']['platform_config']['Insert']>;
        Relationships: [];
      };
      guest_registration_requests: {
        Row: {
          id: string;
          full_name_ar: string;
          full_name_en: string;
          email: string;
          reason: string | null;
          status: 'pending' | 'approved' | 'rejected';
          admin_note: string | null;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          full_name_ar: string;
          full_name_en: string;
          email: string;
          reason?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          admin_note?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['guest_registration_requests']['Insert']>;
        Relationships: [];
      };
      admin_users: {
        Row: {
          email: string;
          display_name: string;
          permissions: {
            manage_students: boolean;
            upload_grades: boolean;
            manage_settings: boolean;
            manage_admins: boolean;
          };
          added_at: string;
          added_by: string | null;
        };
        Insert: {
          email: string;
          display_name: string;
          permissions?: {
            manage_students: boolean;
            upload_grades: boolean;
            manage_settings: boolean;
            manage_admins: boolean;
          };
          added_at?: string;
          added_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      vw_public_leaderboard: {
        Row: {
          student_id: string;
          masked_id: string;
          display_name_ar: string | null;
          display_name_en: string | null;
          origin_tag: string;
          status: StudentStatus;
          semester_id: string;
          year_level: number;
          semester_gpa: number | null;
          year_gpa: number | null;
          cumulative_gpa: number | null;
          rank_overall: number | null;
          rank_origin_cohort: number | null;
          remark: AcademicRemark | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      student_status: StudentStatus;
      semester_status: SemesterStatus;
      course_grade_note: CourseGradeNote;
      academic_remark: AcademicRemark;
    };
    CompositeTypes: Record<string, never>;
  };
}