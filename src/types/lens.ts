export interface LensBatch {
  id: string;
  batchNo: string;
  brand: string;
  model: string;
  lensType: 'spherical' | 'astigmatic' | 'progressive' | 'bifocal';
  sphere: string;
  cylinder?: string;
  axis?: string;
  addPower?: string;
  totalQuantity: number;
  remainingQuantity: number;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  supplier: string;
  costPerUnit: number;
  retailPrice: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  location: string;
}

export interface SplitRecord {
  id: string;
  batchId: string;
  splitDate: string;
  splitQuantity: number;
  remainingAfterSplit: number;
  operator: string;
  remark?: string;
}

export type LensType = 'spherical' | 'astigmatic' | 'progressive' | 'bifocal';
export type LensStatus = 'in-stock' | 'low-stock' | 'out-of-stock';
