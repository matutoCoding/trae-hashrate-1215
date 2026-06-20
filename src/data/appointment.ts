import type { Appointment } from '@/types/appointment';
import { getTodayDate } from '@/utils';

const today = getTodayDate();

export const mockAppointments: Appointment[] = [
  {
    id: 'apt_001',
    customerName: '周小明',
    customerPhone: '138****1234',
    date: today,
    startTime: '09:00',
    endTime: '09:30',
    optometristId: 'opt_001',
    optometristName: '张明远',
    status: 'completed',
    type: 'comprehensive',
    notes: '首次验光，需要详细检查',
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt_002',
    customerName: '吴小芳',
    customerPhone: '139****5678',
    date: today,
    startTime: '10:00',
    endTime: '10:30',
    optometristId: 'opt_002',
    optometristName: '李慧琳',
    status: 'confirmed',
    type: 'progressive',
    notes: '需要配渐进多焦点镜片',
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt_003',
    customerName: '孙伟',
    customerPhone: '137****9012',
    date: today,
    startTime: '14:00',
    endTime: '14:30',
    optometristId: 'opt_001',
    optometristName: '张明远',
    status: 'confirmed',
    type: 'routine',
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt_004',
    customerName: '郑小红',
    customerPhone: '136****3456',
    date: today,
    startTime: '15:00',
    endTime: '15:30',
    optometristId: 'opt_003',
    optometristName: '王建国',
    status: 'pending',
    type: 'contact-lens',
    notes: '隐形眼镜验配复查',
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt_005',
    customerName: '李晨',
    customerPhone: '135****7890',
    date: today,
    startTime: '11:00',
    endTime: '11:30',
    optometristId: 'opt_004',
    optometristName: '陈晓燕',
    status: 'confirmed',
    type: 'children',
    notes: '8岁儿童，近视防控检查',
    createdAt: new Date().toISOString()
  },
  {
    id: 'apt_006',
    customerName: '王志远',
    customerPhone: '134****2345',
    date: today,
    startTime: '10:30',
    endTime: '11:00',
    optometristId: 'opt_005',
    optometristName: '刘志强',
    status: 'in-progress',
    type: 'comprehensive',
    createdAt: new Date().toISOString()
  } as any
];

export const appointmentStatusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待确认', color: '#F59E0B', bg: '#FEF3C7' },
  confirmed: { label: '已确认', color: '#0EA5E9', bg: '#E0F2FE' },
  'in-progress': { label: '进行中', color: '#8B5CF6', bg: '#EDE9FE' },
  completed: { label: '已完成', color: '#10B981', bg: '#D1FAE5' },
  cancelled: { label: '已取消', color: '#EF4444', bg: '#FEE2E2' }
};

export const appointmentTypeLabels: Record<string, string> = {
  comprehensive: '综合验光',
  routine: '常规验光',
  'contact-lens': '隐形眼镜',
  children: '儿童视光',
  progressive: '渐进多焦点'
};

export default mockAppointments;
