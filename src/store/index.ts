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

  splitLensBatch: (batchId: string, quantity: number, operator: string, remark?: string) => boolean;
  addLensBatch: (batch: Omit<LensBatch, 'id'>) => void;

  addDelivery: (delivery: Omit<DeliveryRecord, 'id' | 'createdAt'>) => void;
  updateDeliveryStatus: (id: string, status: DeliveryRecord['status']) => void;
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
  }
}));

export default useAppStore;
