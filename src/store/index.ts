import { create } from 'zustand';
import type { Optometrist } from '@/types/optometrist';
import type { Appointment } from '@/types/appointment';
import type { LensBatch, SplitRecord } from '@/types/lens';
import type { DeliveryRecord } from '@/types/delivery';
import { mockOptometrists } from '@/data/optometrist';
import { mockAppointments } from '@/data/appointment';
import { mockLensBatches, mockSplitRecords } from '@/data/lens';
import { mockDeliveries } from '@/data/delivery';
import storage from '@/services/storage';
import { generateId, getTodayDate } from '@/utils';

interface AppState {
  optometrists: Optometrist[];
  appointments: Appointment[];
  lensBatches: LensBatch[];
  splitRecords: SplitRecord[];
  deliveries: DeliveryRecord[];
  selectedDate: string;
  selectedTimeSlot: { startTime: string; endTime: string } | null;

  initData: () => void;
  setSelectedDate: (date: string) => void;
  setSelectedTimeSlot: (slot: { startTime: string; endTime: string } | null) => void;

  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;

  addOptometrist: (optometrist: Omit<Optometrist, 'id'>) => void;
  updateOptometrist: (id: string, data: Partial<Optometrist>) => void;

  splitLensBatch: (batchId: string, quantity: number, operator: string, remark?: string) => boolean;
  addLensBatch: (batch: Omit<LensBatch, 'id'>) => void;

  addDelivery: (delivery: Omit<DeliveryRecord, 'id' | 'createdAt'>) => void;
  updateDeliveryStatus: (id: string, status: DeliveryRecord['status']) => void;

  createDeliveryWithStock: (params: {
    delivery: Omit<DeliveryRecord, 'id' | 'createdAt' | 'items' | 'totalAmount'>;
    items: Array<{ batchId: string; quantity: number; eye: 'left' | 'right' | 'both' }>;
  }) => { success: boolean; message?: string; data?: any };

  previewDeliveryWithStock: (params: {
    items: Array<{ batchId: string; quantity: number; eye: 'left' | 'right' | 'both' }>;
  }) => {
    success: boolean;
    message?: string;
    preview?: {
      items: Array<{
        batchId: string;
        brand: string;
        model: string;
        lensType: string;
        originalQty: number;
        totalActualQty: number;
        remainingBefore: number;
        remainingAfter: number;
        unitPrice: number;
        subtotal: number;
        eyeDesc: string;
        rowCount: number;
        rows: Array<{ originalQty: number; eye: 'left' | 'right' | 'both' }>;
      }>;
      totalAmount: number;
      totalPieces: number;
    };
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  optometrists: [],
  appointments: [],
  lensBatches: [],
  splitRecords: [],
  deliveries: [],
  selectedDate: getTodayDate(),
  selectedTimeSlot: null,

  initData: () => {
    const storedOptometrists = storage.getOptometrists();
    const storedAppointments = storage.getAppointments();
    const storedLensBatches = storage.getLensBatches();
    const storedSplitRecords = storage.getSplitRecords();
    const storedDeliveries = storage.getDeliveries();

    const optometrists = storedOptometrists.length > 0 ? storedOptometrists : mockOptometrists;
    const appointments = storedAppointments.length > 0 ? storedAppointments : mockAppointments;
    const lensBatches = storedLensBatches.length > 0 ? storedLensBatches : mockLensBatches;
    const splitRecords = storedSplitRecords.length > 0 ? storedSplitRecords : mockSplitRecords;
    const deliveries = storedDeliveries.length > 0 ? storedDeliveries : mockDeliveries;

    if (storedOptometrists.length === 0) storage.setOptometrists(optometrists);
    if (storedAppointments.length === 0) storage.setAppointments(appointments);
    if (storedLensBatches.length === 0) storage.setLensBatches(lensBatches);
    if (storedSplitRecords.length === 0) storage.setSplitRecords(splitRecords);
    if (storedDeliveries.length === 0) storage.setDeliveries(deliveries);

    console.log('[Store] 数据初始化完成');
    set({ optometrists, appointments, lensBatches, splitRecords, deliveries });
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedTimeSlot: (slot) => set({ selectedTimeSlot: slot }),

  addAppointment: (appointment) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: generateId('apt_'),
      createdAt: new Date().toISOString()
    };
    const appointments = [...get().appointments, newAppointment];
    storage.setAppointments(appointments);
    set({ appointments });
    console.log('[Store] 新增预约:', newAppointment.id);
  },

  updateAppointmentStatus: (id, status) => {
    const appointments = get().appointments.map((a) =>
      a.id === id ? { ...a, status } : a
    );
    storage.setAppointments(appointments);
    set({ appointments });
    console.log('[Store] 更新预约状态:', id, status);
  },

  addOptometrist: (optometrist) => {
    const newOpt: Optometrist = {
      ...optometrist,
      id: generateId('opt_')
    };
    const optometrists = [...get().optometrists, newOpt];
    storage.setOptometrists(optometrists);
    set({ optometrists });
    console.log('[Store] 新增验光师:', newOpt.name);
  },

  updateOptometrist: (id, data) => {
    const optometrists = get().optometrists.map((o) =>
      o.id === id ? { ...o, ...data } : o
    );
    storage.setOptometrists(optometrists);
    set({ optometrists });
    console.log('[Store] 更新验光师:', id);
  },

  splitLensBatch: (batchId, quantity, operator, remark) => {
    const batch = get().lensBatches.find((b) => b.id === batchId);
    if (!batch || batch.remainingQuantity < quantity) {
      console.error('[Store] 拆分失败：库存不足');
      return false;
    }

    const remainingAfterSplit = batch.remainingQuantity - quantity;
    const status: LensBatch['status'] =
      remainingAfterSplit === 0 ? 'out-of-stock' : remainingAfterSplit <= 5 ? 'low-stock' : 'in-stock';

    const lensBatches = get().lensBatches.map((b) =>
      b.id === batchId ? { ...b, remainingQuantity: remainingAfterSplit, status } : b
    );

    const splitRecord: SplitRecord = {
      id: generateId('split_'),
      batchId,
      splitDate: getTodayDate(),
      splitQuantity: quantity,
      remainingAfterSplit,
      operator,
      remark
    };
    const splitRecords = [...get().splitRecords, splitRecord];

    storage.setLensBatches(lensBatches);
    storage.setSplitRecords(splitRecords);
    set({ lensBatches, splitRecords });
    console.log('[Store] 镜片拆分成功:', batchId, `-${quantity}, 剩${remainingAfterSplit}`);
    return true;
  },

  addLensBatch: (batch) => {
    const newBatch: LensBatch = {
      ...batch,
      id: generateId('batch_')
    };
    const lensBatches = [...get().lensBatches, newBatch];
    storage.setLensBatches(lensBatches);
    set({ lensBatches });
    console.log('[Store] 新增镜片批次:', newBatch.batchNo);
  },

  addDelivery: (delivery) => {
    const newDelivery: DeliveryRecord = {
      ...delivery,
      id: generateId('del_'),
      createdAt: new Date().toISOString()
    };
    const deliveries = [...get().deliveries, newDelivery];
    storage.setDeliveries(deliveries);
    set({ deliveries });
    console.log('[Store] 新增出库记录:', newDelivery.deliveryNo);
  },

  updateDeliveryStatus: (id, status) => {
    const deliveries = get().deliveries.map((d) =>
      d.id === id ? { ...d, status } : d
    );
    storage.setDeliveries(deliveries);
    set({ deliveries });
    console.log('[Store] 更新出库状态:', id, status);
  },

  previewDeliveryWithStock: ({ items }) => {
    console.log('[Store] 预览出库...');

    // 按批次聚合：计算每个批次实际需要扣减的片数（双眼x2，单眼x1）
    const batchAggregate: Record<
      string,
      {
        totalActualQty: number;
        rows: Array<{ originalQty: number; eye: 'left' | 'right' | 'both' }>;
      }
    > = {};

    items.forEach((item) => {
      const actualQty = item.eye === 'both' ? item.quantity * 2 : item.quantity;
      if (!batchAggregate[item.batchId]) {
        batchAggregate[item.batchId] = { totalActualQty: 0, rows: [] };
      }
      batchAggregate[item.batchId].totalActualQty += actualQty;
      batchAggregate[item.batchId].rows.push({ originalQty: item.quantity, eye: item.eye });
    });

    // 预校验库存
    const { lensBatches: currentBatches } = get();
    for (const [batchId, agg] of Object.entries(batchAggregate)) {
      const batch = currentBatches.find((b) => b.id === batchId);
      if (!batch) {
        return { success: false, message: `批次不存在: ${batchId}` };
      }
      if (batch.remainingQuantity < agg.totalActualQty) {
        return {
          success: false,
          message: `库存不足：${batch.brand} ${batch.model} 需要${agg.totalActualQty}片，仅剩${batch.remainingQuantity}片`
        };
      }
    }

    // 生成按批次合并的预览明细
    const previewItems = Object.entries(batchAggregate).map(([batchId, agg]) => {
      const batch = currentBatches.find((b) => b.id === batchId)!;
      const remainingAfter = batch.remainingQuantity - agg.totalActualQty;
      // 关键修复：字段名是 retailPrice，不是 unitPrice
      const unitPrice = Number(batch.retailPrice) || 0;
      const subtotal = agg.totalActualQty * unitPrice;

      // 构造眼别描述
      const eyeDesc = agg.rows
        .map((r) => {
          const eyeLabel = r.eye === 'both' ? '双眼' : r.eye === 'left' ? '左眼' : '右眼';
          return `${r.originalQty}副(${eyeLabel})`;
        })
        .join(' + ');

      return {
        batchId,
        brand: batch.brand,
        model: batch.model,
        lensType: batch.lensType,
        rowCount: agg.rows.length,
        totalActualQty: agg.totalActualQty,
        originalQty: agg.rows.reduce((s, r) => s + r.originalQty, 0),
        eyeDesc,
        rows: agg.rows,
        remainingBefore: batch.remainingQuantity,
        remainingAfter,
        unitPrice,
        subtotal
      };
    });

    const totalAmount = previewItems.reduce((sum, i) => sum + i.subtotal, 0);
    const totalPieces = previewItems.reduce((sum, i) => sum + i.totalActualQty, 0);

    console.log('[Store] 出库预览完成，总金额:', totalAmount, '总片数:', totalPieces);

    return {
      success: true,
      preview: {
        items: previewItems,
        totalAmount,
        totalPieces
      }
    };
  },

  createDeliveryWithStock: ({ delivery, items }) => {
    console.log('[Store] 开始事务性出库...');

    // Step 1: 计算每个批次实际需要扣减的片数（双眼x2，单眼x1）
    const batchQtyMap: Record<string, number> = {};
    items.forEach((item) => {
      const actualQty = item.eye === 'both' ? item.quantity * 2 : item.quantity;
      batchQtyMap[item.batchId] = (batchQtyMap[item.batchId] || 0) + actualQty;
    });

    // Step 2: 预校验 - 所有批次库存必须充足，一个不够就整体失败
    const { lensBatches: currentBatches } = get();
    for (const [batchId, needQty] of Object.entries(batchQtyMap)) {
      const batch = currentBatches.find((b) => b.id === batchId);
      if (!batch) {
        return { success: false, message: `批次不存在: ${batchId}` };
      }
      if (batch.remainingQuantity < needQty) {
        return {
          success: false,
          message: `库存不足：${batch.brand} ${batch.model} 需要${needQty}片，仅剩${batch.remainingQuantity}片`
        };
      }
    }
    console.log('[Store] 库存预校验通过，批次数量:', Object.keys(batchQtyMap).length);

    // Step 3: 开始扣减库存（此时所有校验已通过，不会再失败）
    let updatedBatches = [...get().lensBatches];
    const newSplitRecords = [...get().splitRecords];

    for (const [batchId, needQty] of Object.entries(batchQtyMap)) {
      const batchIdx = updatedBatches.findIndex((b) => b.id === batchId);
      const batch = updatedBatches[batchIdx];
      const remainingAfterSplit = batch.remainingQuantity - needQty;
      const newStatus: LensBatch['status'] =
        remainingAfterSplit === 0
          ? 'out-of-stock'
          : remainingAfterSplit <= 5
            ? 'low-stock'
            : 'in-stock';

      updatedBatches[batchIdx] = {
        ...batch,
        remainingQuantity: remainingAfterSplit,
        status: newStatus
      };

      newSplitRecords.push({
        id: generateId('split_'),
        batchId,
        splitDate: getTodayDate(),
        splitQuantity: needQty,
        remainingAfterSplit,
        operator: '管理员',
        remark: `配镜出库: ${delivery.customerName}`
      });

      console.log(
        `[Store] 扣减 ${batch.brand} ${batch.model}: -${needQty}片, 剩${remainingAfterSplit}片`
      );
    }

    // Step 4: 组装出库单 items（使用扣减后的正确数量）
    const { lensBatches: _batches } = get();
    const deliveryItems = items.map((item) => {
      const batch = _batches.find((b) => b.id === item.batchId)!;
      const actualQty = item.eye === 'both' ? item.quantity * 2 : item.quantity;
      return {
        id: generateId('item_'),
        batchId: item.batchId,
        batchNo: batch.batchNo,
        brand: batch.brand,
        model: batch.model,
        lensType: batch.lensType,
        quantity: actualQty,
        unitPrice: batch.retailPrice,
        eye: item.eye
      };
    });

    const totalAmount = deliveryItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    // Step 5: 保存所有变更
    const newDelivery: DeliveryRecord = {
      ...delivery,
      items: deliveryItems,
      totalAmount,
      id: generateId('del_'),
      createdAt: new Date().toISOString()
    };

    const updatedDeliveries = [...get().deliveries, newDelivery];

    storage.setLensBatches(updatedBatches);
    storage.setSplitRecords(newSplitRecords);
    storage.setDeliveries(updatedDeliveries);

    set({
      lensBatches: updatedBatches,
      splitRecords: newSplitRecords,
      deliveries: updatedDeliveries
    });

    console.log('[Store] 事务性出库成功，出库单号:', newDelivery.deliveryNo);
    return { success: true };
  }
}));

export default useAppStore;
