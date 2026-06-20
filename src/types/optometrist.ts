export interface Optometrist {
  id: string;
  name: string;
  title: string;
  avatar: string;
  experience: number;
  specialty: string[];
  rating: number;
  todayAppointments: number;
  workStartTime: string;
  workEndTime: string;
  status: 'available' | 'busy' | 'offline';
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
  optometristId?: string;
}

export type OptometristStatus = 'available' | 'busy' | 'offline';
