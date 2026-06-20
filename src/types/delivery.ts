export interface DeliveryRecord {
  id: string;
  deliveryNo: string;
  customerName: string;
  customerPhone: string;
  deliveryDate: string;
  items: DeliveryItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'returned';
  optometristName?: string;
  prescription: Prescription;
  paymentMethod: string;
  createdAt: string;
  remark?: string;
}

export interface DeliveryItem {
  id: string;
  batchId: string;
  batchNo: string;
  brand: string;
  model: string;
  lensType: string;
  quantity: number;
  unitPrice: number;
  eye: 'left' | 'right' | 'both';
}

export interface Prescription {
  leftEye: EyeParams;
  rightEye: EyeParams;
  pd: number;
  pdLeft?: number;
  pdRight?: number;
  height?: number;
}

export interface EyeParams {
  sphere: string;
  cylinder?: string;
  axis?: string;
  addPower?: string;
  visualAcuity?: string;
}

export type DeliveryStatus = 'pending' | 'processing' | 'completed' | 'returned';
