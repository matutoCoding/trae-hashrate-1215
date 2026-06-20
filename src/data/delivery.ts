import type { DeliveryRecord } from '@/types/delivery';
import { getTodayDate } from '@/utils';

const today = getTodayDate();

export const mockDeliveries: DeliveryRecord[] = [
  {
    id: 'del_001',
    deliveryNo: 'DL20260620001',
    customerName: '周小明',
    customerPhone: '138****1234',
    deliveryDate: today,
    items: [
      {
        id: 'item_001',
        batchId: 'batch_001',
        batchNo: 'L202606001',
        brand: '依视路',
        model: '钻晶A4',
        lensType: 'spherical',
        quantity: 2,
        unitPrice: 680,
        eye: 'both'
      }
    ],
    totalAmount: 1360,
    status: 'completed',
    optometristName: '张明远',
    prescription: {
      leftEye: { sphere: '-2.00', visualAcuity: '1.0' },
      rightEye: { sphere: '-1.75', visualAcuity: '1.0' },
      pd: 62
    },
    paymentMethod: '微信支付',
    createdAt: new Date().toISOString()
  },
  {
    id: 'del_002',
    deliveryNo: 'DL20260620002',
    customerName: '吴小芳',
    customerPhone: '139****5678',
    deliveryDate: today,
    items: [
      {
        id: 'item_002',
        batchId: 'batch_004',
        batchNo: 'L202606004',
        brand: '依视路',
        model: '万里路X系列',
        lensType: 'progressive',
        quantity: 2,
        unitPrice: 2680,
        eye: 'both'
      }
    ],
    totalAmount: 5360,
    status: 'processing',
    optometristName: '李慧琳',
    prescription: {
      leftEye: { sphere: '-1.50', addPower: '+2.00', visualAcuity: '0.8' },
      rightEye: { sphere: '-1.25', addPower: '+2.00', visualAcuity: '0.8' },
      pd: 64,
      pdLeft: 32,
      pdRight: 32
    },
    paymentMethod: '银行卡',
    createdAt: new Date().toISOString(),
    remark: '老花渐进镜'
  },
  {
    id: 'del_003',
    deliveryNo: 'DL20260619003',
    customerName: '郑小红',
    customerPhone: '136****3456',
    deliveryDate: '2026-06-19',
    items: [
      {
        id: 'item_003',
        batchId: 'batch_006',
        batchNo: 'L202606006',
        brand: '明月',
        model: 'PMC超亮',
        lensType: 'spherical',
        quantity: 2,
        unitPrice: 298,
        eye: 'both'
      }
    ],
    totalAmount: 596,
    status: 'completed',
    optometristName: '王建国',
    prescription: {
      leftEye: { sphere: '-4.00', visualAcuity: '1.0' },
      rightEye: { sphere: '-3.75', cylinder: '-0.50', axis: '90', visualAcuity: '1.0' },
      pd: 60
    },
    paymentMethod: '支付宝',
    createdAt: new Date().toISOString()
  },
  {
    id: 'del_004',
    deliveryNo: 'DL20260619004',
    customerName: '李晨',
    customerPhone: '135****7890',
    deliveryDate: '2026-06-19',
    items: [
      {
        id: 'item_004',
        batchId: 'batch_008',
        batchNo: 'L202606008',
        brand: '蔡司',
        model: '防蓝光',
        lensType: 'spherical',
        quantity: 1,
        unitPrice: 780,
        eye: 'left'
      },
      {
        id: 'item_005',
        batchId: 'batch_002',
        batchNo: 'L202606002',
        brand: '蔡司',
        model: '新清锐',
        lensType: 'spherical',
        quantity: 1,
        unitPrice: 980,
        eye: 'right'
      }
    ],
    totalAmount: 1760,
    status: 'pending',
    optometristName: '陈晓燕',
    prescription: {
      leftEye: { sphere: '-5.00', visualAcuity: '0.8' },
      rightEye: { sphere: '-3.50', visualAcuity: '0.9' },
      pd: 58,
      height: 32
    },
    paymentMethod: '微信支付',
    createdAt: new Date().toISOString(),
    remark: '儿童配镜，双眼度数差异大'
  }
];

export const deliveryStatusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: '#F59E0B', bg: '#FEF3C7' },
  processing: { label: '加工中', color: '#0EA5E9', bg: '#E0F2FE' },
  completed: { label: '已完成', color: '#10B981', bg: '#D1FAE5' },
  returned: { label: '已退货', color: '#EF4444', bg: '#FEE2E2' }
};

export default mockDeliveries;
