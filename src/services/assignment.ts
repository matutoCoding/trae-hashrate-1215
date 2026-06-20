import type { Optometrist, TimeSlot } from '@/types/optometrist';
import type { Appointment } from '@/types/appointment';

export interface AssignmentResult {
  optometrist: Optometrist;
  score: number;
  reason: string;
}

export const assignmentService = {
  findBestOptometrist(
    optometrists: Optometrist[],
    appointments: Appointment[],
    date: string,
    startTime: string,
    endTime: string
  ): AssignmentResult | null {
    console.log('[Assignment] 开始智能分配:', { date, startTime, endTime });

    const availableOptometrists = optometrists.filter((opt) => {
      if (opt.status !== 'available') return false;

      const slotStart = parseInt(startTime.replace(':', ''), 10);
      const slotEnd = parseInt(endTime.replace(':', ''), 10);
      const workStart = parseInt(opt.workStartTime.replace(':', ''), 10);
      const workEnd = parseInt(opt.workEndTime.replace(':', ''), 10);

      if (slotStart < workStart || slotEnd > workEnd) return false;

      const todayAppointments = appointments.filter(
        (a) => a.optometristId === opt.id && a.date === date && a.status !== 'cancelled'
      );

      const hasConflict = todayAppointments.some((a) => {
        const aStart = parseInt(a.startTime.replace(':', ''), 10);
        const aEnd = parseInt(a.endTime.replace(':', ''), 10);
        return !(slotEnd <= aStart || slotStart >= aEnd);
      });

      return !hasConflict;
    });

    if (availableOptometrists.length === 0) {
      console.log('[Assignment] 无可用验光师');
      return null;
    }

    const scored = availableOptometrists.map((opt) => {
      const todayAppointments = appointments.filter(
        (a) => a.optometristId === opt.id && a.date === date && a.status !== 'cancelled'
      );

      let score = 0;
      const reasons: string[] = [];

      const loadScore = Math.max(0, 10 - todayAppointments.length * 2);
      score += loadScore;
      if (todayAppointments.length <= 2) {
        reasons.push('当前负载较轻');
      }

      const ratingScore = opt.rating * 2;
      score += ratingScore;

      const expScore = Math.min(opt.experience, 15) * 0.5;
      score += expScore;

      const fragmentScore = calculateFragmentationScore(opt, todayAppointments, startTime, endTime);
      score += fragmentScore;
      if (fragmentScore > 0) {
        reasons.push('可填补空闲时段');
      }

      return {
        optometrist: opt,
        score,
        reason: reasons.join('，') || '综合评分最优'
      };
    });

    scored.sort((a, b) => b.score - a.score);

    console.log('[Assignment] 分配结果:', scored[0]?.optometrist.name, '评分:', scored[0]?.score);
    return scored[0];
  },

  getOptometristFreeSlots(
    optometrist: Optometrist,
    appointments: Appointment[],
    date: string,
    allSlots: TimeSlot[]
  ): (TimeSlot & { available: boolean })[] {
    const optAppointments = appointments.filter(
      (a) => a.optometristId === optometrist.id && a.date === date && a.status !== 'cancelled'
    );

    return allSlots.map((slot) => {
      const slotStart = parseInt(slot.startTime.replace(':', ''), 10);
      const slotEnd = parseInt(slot.endTime.replace(':', ''), 10);
      const workStart = parseInt(optometrist.workStartTime.replace(':', ''), 10);
      const workEnd = parseInt(optometrist.workEndTime.replace(':', ''), 10);

      let available = slotStart >= workStart && slotEnd <= workEnd;

      if (available) {
        available = !optAppointments.some((a) => {
          const aStart = parseInt(a.startTime.replace(':', ''), 10);
          const aEnd = parseInt(a.endTime.replace(':', ''), 10);
          return !(slotEnd <= aStart || slotStart >= aEnd);
        });
      }

      return { ...slot, available };
    });
  },

  getWorkloadStats(optometrists: Optometrist[], appointments: Appointment[], date: string) {
    return optometrists.map((opt) => {
      const todayCount = appointments.filter(
        (a) => a.optometristId === opt.id && a.date === date && a.status !== 'cancelled'
      ).length;

      const workHours =
        parseInt(opt.workEndTime.split(':')[0], 10) - parseInt(opt.workStartTime.split(':')[0], 10);
      const maxCapacity = workHours * 2;

      return {
        optometrist: opt,
        current: todayCount,
        max: maxCapacity,
        utilization: maxCapacity > 0 ? Math.round((todayCount / maxCapacity) * 100) : 0
      };
    });
  },

  getSlotAvailability(
    optometrists: Optometrist[],
    appointments: Appointment[],
    date: string,
    startTime: string,
    endTime: string
  ): { availableCount: number; totalOnDuty: number; isFullyBooked: boolean } {
    const slotStart = parseInt(startTime.replace(':', ''), 10);
    const slotEnd = parseInt(endTime.replace(':', ''), 10);

    let onDutyCount = 0;
    let availableCount = 0;

    optometrists.forEach((opt) => {
      if (opt.status === 'offline') return;

      const workStart = parseInt(opt.workStartTime.replace(':', ''), 10);
      const workEnd = parseInt(opt.workEndTime.replace(':', ''), 10);
      if (slotStart < workStart || slotEnd > workEnd) return;

      onDutyCount++;

      const hasConflict = appointments.some((a) => {
        if (a.optometristId !== opt.id || a.date !== date || a.status === 'cancelled') return false;
        const aStart = parseInt(a.startTime.replace(':', ''), 10);
        const aEnd = parseInt(a.endTime.replace(':', ''), 10);
        return !(slotEnd <= aStart || slotStart >= aEnd);
      });

      if (!hasConflict) {
        availableCount++;
      }
    });

    return {
      availableCount,
      totalOnDuty: onDutyCount,
      isFullyBooked: onDutyCount > 0 && availableCount === 0
    };
  }
};

function calculateFragmentationScore(
  opt: Optometrist,
  todayAppointments: Appointment[],
  startTime: string,
  _endTime: string
): number {
  if (todayAppointments.length === 0) return 5;

  const sorted = [...todayAppointments].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  const slotMinutes = timeToMinutes(startTime);

  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = timeToMinutes(sorted[i].endTime);
    const gapEnd = timeToMinutes(sorted[i + 1].startTime);
    const gapSize = gapEnd - gapStart;

    if (gapSize > 0 && gapSize <= 60) {
      if (slotMinutes >= gapStart - 15 && slotMinutes <= gapEnd + 15) {
        return 8;
      }
    }
  }

  const firstAppt = timeToMinutes(sorted[0].startTime);
  const workStart = timeToMinutes(opt.workStartTime);
  if (slotMinutes < firstAppt && slotMinutes >= workStart) {
    return 3;
  }

  const lastAppt = timeToMinutes(sorted[sorted.length - 1].endTime);
  const workEnd = timeToMinutes(opt.workEndTime);
  if (slotMinutes > lastAppt && slotMinutes <= workEnd) {
    return 3;
  }

  return 0;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default assignmentService;
