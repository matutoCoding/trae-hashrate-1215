import type { LensBatch, SplitRecord } from '@/types/lens';

export const mockLensBatches: LensBatch[] = [
  {
    id: 'batch_001',
    batchNo: 'L202606001',
    brand: '依视路',
    model: '钻晶A4',
    lensType: 'spherical',
    sphere: '-2.00',
    totalQuantity: 50,
    remainingQuantity: 32,
    unit: '片',
    purchaseDate: '2026-06-01',
    expiryDate: '2028-06-01',
    supplier: '依视路光学',
    costPerUnit: 280,
    retailPrice: 680,
    status: 'in-stock',
    location: 'A区-01-03'
  },
  {
    id: 'batch_002',
    batchNo: 'L202606002',
    brand: '蔡司',
    model: '新清锐',
    lensType: 'spherical',
    sphere: '-3.50',
    totalQuantity: 30,
    remainingQuantity: 5,
    unit: '片',
    purchaseDate: '2026-06-05',
    expiryDate: '2028-06-05',
    supplier: '蔡司光学',
    costPerUnit: 450,
    retailPrice: 980,
    status: 'low-stock',
    location: 'A区-02-01'
  },
  {
    id: 'batch_003',
    batchNo: 'L202606003',
    brand: '豪雅',
    model: '唯频',
    lensType: 'astigmatic',
    sphere: '-2.50',
    cylinder: '-1.00',
    axis: '180',
    totalQuantity: 20,
    remainingQuantity: 0,
    unit: '片',
    purchaseDate: '2026-05-20',
    expiryDate: '2028-05-20',
    supplier: '豪雅光学',
    costPerUnit: 520,
    retailPrice: 1180,
    status: 'out-of-stock',
    location: 'A区-03-02'
  },
  {
    id: 'batch_004',
    batchNo: 'L202606004',
    brand: '依视路',
    model: '万里路X系列',
    lensType: 'progressive',
    sphere: '-1.50',
    addPower: '+2.00',
    totalQuantity: 15,
    remainingQuantity: 12,
    unit: '片',
    purchaseDate: '2026-06-10',
    expiryDate: '2028-06-10',
    supplier: '依视路光学',
    costPerUnit: 1200,
    retailPrice: 2680,
    status: 'in-stock',
    location: 'B区-01-01'
  },
  {
    id: 'batch_005',
    batchNo: 'L202606005',
    brand: '蔡司',
    model: '睐光D',
    lensType: 'progressive',
    sphere: '-3.00',
    addPower: '+2.50',
    totalQuantity: 10,
    remainingQuantity: 8,
    unit: '片',
    purchaseDate: '2026-06-08',
    expiryDate: '2028-06-08',
    supplier: '蔡司光学',
    costPerUnit: 1500,
    retailPrice: 3280,
    status: 'in-stock',
    location: 'B区-01-02'
  },
  {
    id: 'batch_006',
    batchNo: 'L202606006',
    brand: '明月',
    model: 'PMC超亮',
    lensType: 'spherical',
    sphere: '-4.00',
    totalQuantity: 100,
    remainingQuantity: 87,
    unit: '片',
    purchaseDate: '2026-06-12',
    expiryDate: '2029-06-12',
    supplier: '明月镜片',
    costPerUnit: 95,
    retailPrice: 298,
    status: 'in-stock',
    location: 'C区-02-05'
  },
  {
    id: 'batch_007',
    batchNo: 'L202606007',
    brand: '依视路',
    model: '爱赞',
    lensType: 'bifocal',
    sphere: '-2.00',
    addPower: '+1.50',
    totalQuantity: 25,
    remainingQuantity: 3,
    unit: '片',
    purchaseDate: '2026-05-15',
    expiryDate: '2028-05-15',
    supplier: '依视路光学',
    costPerUnit: 680,
    retailPrice: 1480,
    status: 'low-stock',
    location: 'B区-02-03'
  },
  {
    id: 'batch_008',
    batchNo: 'L202606008',
    brand: '蔡司',
    model: '防蓝光',
    lensType: 'spherical',
    sphere: '-5.00',
    totalQuantity: 40,
    remainingQuantity: 28,
    unit: '片',
    purchaseDate: '2026-06-15',
    expiryDate: '2028-06-15',
    supplier: '蔡司光学',
    costPerUnit: 320,
    retailPrice: 780,
    status: 'in-stock',
    location: 'A区-02-04'
  }
];

export const mockSplitRecords: SplitRecord[] = [
  {
    id: 'split_001',
    batchId: 'batch_001',
    splitDate: '2026-06-18',
    splitQuantity: 6,
    remainingAfterSplit: 38,
    operator: '管理员',
    remark: '日常出库'
  },
  {
    id: 'split_002',
    batchId: 'batch_001',
    splitDate: '2026-06-19',
    splitQuantity: 4,
    remainingAfterSplit: 34,
    operator: '管理员',
    remark: '配镜订单'
  },
  {
    id: 'split_003',
    batchId: 'batch_001',
    splitDate: '2026-06-20',
    splitQuantity: 2,
    remainingAfterSplit: 32,
    operator: '张明远',
    remark: '周小明配镜'
  },
  {
    id: 'split_004',
    batchId: 'batch_002',
    splitDate: '2026-06-17',
    splitQuantity: 10,
    remainingAfterSplit: 20,
    operator: '管理员'
  },
  {
    id: 'split_005',
    batchId: 'batch_002',
    splitDate: '2026-06-19',
    splitQuantity: 8,
    remainingAfterSplit: 12,
    operator: '李慧琳'
  },
  {
    id: 'split_006',
    batchId: 'batch_002',
    splitDate: '2026-06-20',
    splitQuantity: 7,
    remainingAfterSplit: 5,
    operator: '王建国'
  }
];

export const lensStatusLabels: Record<string, { label: string; color: string; bg: string }> = {
  'in-stock': { label: '充足', color: '#10B981', bg: '#D1FAE5' },
  'low-stock': { label: '库存低', color: '#F59E0B', bg: '#FEF3C7' },
  'out-of-stock': { label: '缺货', color: '#EF4444', bg: '#FEE2E2' }
};

export const lensTypeLabels: Record<string, string> = {
  spherical: '球面镜片',
  astigmatic: '散光镜片',
  progressive: '渐进多焦点',
  bifocal: '双光镜片'
};

export default mockLensBatches;
