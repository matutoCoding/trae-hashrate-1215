import type { Optometrist } from '@/types/optometrist';
import { getTodayDate } from '@/utils';

export const mockOptometrists: Optometrist[] = [
  {
    id: 'opt_001',
    name: '张明远',
    title: '高级验光师',
    avatar: 'https://picsum.photos/id/64/200/200',
    experience: 12,
    specialty: ['综合验光', '近视防控', '角膜塑形镜'],
    rating: 4.9,
    todayAppointments: 3,
    workStartTime: '09:00',
    workEndTime: '18:00',
    status: 'available'
  },
  {
    id: 'opt_002',
    name: '李慧琳',
    title: '主任验光师',
    avatar: 'https://picsum.photos/id/91/200/200',
    experience: 18,
    specialty: ['疑难验光', '渐进多焦点', '低视力康复'],
    rating: 5.0,
    todayAppointments: 5,
    workStartTime: '08:30',
    workEndTime: '17:30',
    status: 'busy'
  },
  {
    id: 'opt_003',
    name: '王建国',
    title: '验光技师',
    avatar: 'https://picsum.photos/id/177/200/200',
    experience: 8,
    specialty: ['常规验光', '隐形眼镜验配'],
    rating: 4.7,
    todayAppointments: 2,
    workStartTime: '09:00',
    workEndTime: '18:00',
    status: 'available'
  },
  {
    id: 'opt_004',
    name: '陈晓燕',
    title: '儿童验光专家',
    avatar: 'https://picsum.photos/id/338/200/200',
    experience: 10,
    specialty: ['儿童视光', '斜视弱视', '近视防控'],
    rating: 4.8,
    todayAppointments: 1,
    workStartTime: '09:30',
    workEndTime: '18:30',
    status: 'available'
  },
  {
    id: 'opt_005',
    name: '刘志强',
    title: '高级验光师',
    avatar: 'https://picsum.photos/id/1027/200/200',
    experience: 15,
    specialty: ['综合验光', '白内障术后', '屈光手术术前'],
    rating: 4.9,
    todayAppointments: 4,
    workStartTime: '08:00',
    workEndTime: '17:00',
    status: 'busy'
  },
  {
    id: 'opt_006',
    name: '赵雅婷',
    title: '验光技师',
    avatar: 'https://picsum.photos/id/659/200/200',
    experience: 5,
    specialty: ['常规验光', '隐形眼镜验配'],
    rating: 4.6,
    todayAppointments: 0,
    workStartTime: '10:00',
    workEndTime: '19:00',
    status: 'available'
  }
];

export const mockTimeSlots = [
  { id: 'slot_1', startTime: '09:00', endTime: '09:30', available: true },
  { id: 'slot_2', startTime: '09:30', endTime: '10:00', available: true },
  { id: 'slot_3', startTime: '10:00', endTime: '10:30', available: false },
  { id: 'slot_4', startTime: '10:30', endTime: '11:00', available: true },
  { id: 'slot_5', startTime: '11:00', endTime: '11:30', available: true },
  { id: 'slot_6', startTime: '14:00', endTime: '14:30', available: true },
  { id: 'slot_7', startTime: '14:30', endTime: '15:00', available: true },
  { id: 'slot_8', startTime: '15:00', endTime: '15:30', available: false },
  { id: 'slot_9', startTime: '15:30', endTime: '16:00', available: true },
  { id: 'slot_10', startTime: '16:00', endTime: '16:30', available: true },
  { id: 'slot_11', startTime: '16:30', endTime: '17:00', available: true },
  { id: 'slot_12', startTime: '17:00', endTime: '17:30', available: true }
];

export const optometristStatusLabels: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: '空闲', color: '#10B981', bg: '#D1FAE5' },
  busy: { label: '忙碌', color: '#F59E0B', bg: '#FEF3C7' },
  offline: { label: '离线', color: '#94A3B8', bg: '#F1F5F9' }
};

export const today = getTodayDate();

export default mockOptometrists;
