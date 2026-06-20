import Taro from '@tarojs/taro';
import type { Optometrist } from '@/types/optometrist';
import type { Appointment } from '@/types/appointment';
import type { LensBatch, SplitRecord } from '@/types/lens';
import type { DeliveryRecord } from '@/types/delivery';

const STORAGE_KEYS = {
  OPTOMETRISTS: 'eye_optometrists',
  APPOINTMENTS: 'eye_appointments',
  LENS_BATCHES: 'eye_lens_batches',
  SPLIT_RECORDS: 'eye_split_records',
  DELIVERIES: 'eye_deliveries'
};

export const storage = {
  setOptometrists(data: Optometrist[]): void {
    try {
      Taro.setStorageSync(STORAGE_KEYS.OPTOMETRISTS, data);
    } catch (e) {
      console.error('[Storage] setOptometrists error:', e);
    }
  },

  getOptometrists(): Optometrist[] {
    try {
      return Taro.getStorageSync(STORAGE_KEYS.OPTOMETRISTS) || [];
    } catch (e) {
      console.error('[Storage] getOptometrists error:', e);
      return [];
    }
  },

  setAppointments(data: Appointment[]): void {
    try {
      Taro.setStorageSync(STORAGE_KEYS.APPOINTMENTS, data);
    } catch (e) {
      console.error('[Storage] setAppointments error:', e);
    }
  },

  getAppointments(): Appointment[] {
    try {
      return Taro.getStorageSync(STORAGE_KEYS.APPOINTMENTS) || [];
    } catch (e) {
      console.error('[Storage] getAppointments error:', e);
      return [];
    }
  },

  setLensBatches(data: LensBatch[]): void {
    try {
      Taro.setStorageSync(STORAGE_KEYS.LENS_BATCHES, data);
    } catch (e) {
      console.error('[Storage] setLensBatches error:', e);
    }
  },

  getLensBatches(): LensBatch[] {
    try {
      return Taro.getStorageSync(STORAGE_KEYS.LENS_BATCHES) || [];
    } catch (e) {
      console.error('[Storage] getLensBatches error:', e);
      return [];
    }
  },

  setSplitRecords(data: SplitRecord[]): void {
    try {
      Taro.setStorageSync(STORAGE_KEYS.SPLIT_RECORDS, data);
    } catch (e) {
      console.error('[Storage] setSplitRecords error:', e);
    }
  },

  getSplitRecords(): SplitRecord[] {
    try {
      return Taro.getStorageSync(STORAGE_KEYS.SPLIT_RECORDS) || [];
    } catch (e) {
      console.error('[Storage] getSplitRecords error:', e);
      return [];
    }
  },

  setDeliveries(data: DeliveryRecord[]): void {
    try {
      Taro.setStorageSync(STORAGE_KEYS.DELIVERIES, data);
    } catch (e) {
      console.error('[Storage] setDeliveries error:', e);
    }
  },

  getDeliveries(): DeliveryRecord[] {
    try {
      return Taro.getStorageSync(STORAGE_KEYS.DELIVERIES) || [];
    } catch (e) {
      console.error('[Storage] getDeliveries error:', e);
      return [];
    }
  }
};

export default storage;
