export type EnrollmentStatus = 'active' | 'expired' | 'cancelled' | 'refunded';

export interface Enrollment {
  id:                  string;
  siswa_id:            string;
  program_id:          string;
  order_id:            string;
  status:              EnrollmentStatus;
  enrolled_at:         string;
  expires_at:          string | null;
  is_first_enrollment: boolean;
  created_at:          string;
  updated_at:          string;
}

export interface EnrollmentCreateInput {
  siswa_id:            string;
  program_id:          string;
  order_id:            string;
  expires_at:          string | null;
  is_first_enrollment: boolean;
}
