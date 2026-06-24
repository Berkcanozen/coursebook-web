export type FeeType = 'session' | 'month' | 'term';
export type Attendance = 'unknown' | 'present' | 'absent' | 'cancelled';

export interface Session { id: string; date: string; amount: number; paid: boolean; note: string; attendance: Attendance; }
export interface Course {
  id: string; name: string; instructor: string; location: string;
  schedule: string; fee: number; feeType: FeeType; icon: string; sessions: Session[];
}
export interface Child { id: string; name: string; color: string; courses: Course[]; }
export interface FamilyState { family: string; currency: string; children: Child[]; }

export interface AuthResponse { token: string; family: string; currency: string; }
export interface CourseInput {
  name: string; instructor: string; location: string; schedule: string;
  fee: number; feeType: FeeType; icon: string;
}
export interface SessionInput { date: string; amount: number; paid: boolean; note: string; attendance?: Attendance; }
