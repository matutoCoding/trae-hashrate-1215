export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  optometristId: string;
  optometristName: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  type: 'comprehensive' | 'routine' | 'contact-lens' | 'children' | 'progressive';
  notes?: string;
  createdAt: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
export type AppointmentType = 'comprehensive' | 'routine' | 'contact-lens' | 'children' | 'progressive';
