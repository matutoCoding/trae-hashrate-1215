import type { Optometrist, TimeSlot } from '@/types/optometrist';
import type { Appointment } from '@/types/appointment';

export interface AssignmentResult {
  optometrist: Optometrist;
  score: number;
  reason: string;
  details: {
    loadScore: number;
    loadReason: string;
    ratingScore: number;
    expScore: number;
    fragmentScore: number;
    fragmentReason: string;
    workTimeMatch: boolean;
    workTimeReason: string;
  };
}

export interface CandidateResult extends AssignmentResult {
  rank: number;
}

export const assignmentService = {
  findBestOptometrist(
    optometrists: Optometrist[],
    appointments: Appointment[],
    date: string,
    startTime: string,
    endTime: string
  ): AssignmentResult | null {
    const candidates = assignmentService.getCandidateList(optometrists, appointments, date, startTime, endTime);
    return candidates.length > 0 ? candidates[0] : null;
  },

  getCandidateList(
    optometrists: Optometrist[],
    appointments: Appointment[],
    date: string,
    startTime: string,
    endTime: string
  ): CandidateResult[] {
    console.log('[Assignment] 获取候选验光师列表:', { date, startTime, endTime });

    const slotStart = parseInt(startTime.replace(':', ''), 10);
    const slotEnd = parseInt(endTime.replace(':', ''), 10);

    const candidates: Array<Omit<CandidateResult, 'rank'>> = [];

    for (const opt of optometrists) {
      if (opt.status !== 'available') {
        continue;
      }

      const workStart = parseInt(opt.workStartTime.replace(':', ''), 10);
      const workEnd = parseInt(opt.workEndTime.replace(':', ''), 10);
      const workTimeMatch = slotStart >= workStart && slotEnd <= workEnd;
      const workTimeReason = workTimeMatch
        ? `工作时段 ${opt.workStartTime}-${opt.workEndTime} 匹配`
        : `工作时段 ${opt.workStartTime}-${opt.workEndTime} 不匹配`;

      if (!workTimeMatch) {
        continue;
      }

      const todayAppointments = appointments.filter(
        (a) => a.optometristId === opt.id && a.date === date && a.status !== 'cancelled'
      );

      const hasConflict = todayAppointments.some((a) => {
        const aStart = parseInt(a.startTime.replace(':', ''), 10);
        const aEnd = parseInt(a.endTime.replace(':', ''), 10);
        return !(slotEnd <= aStart || slotStart >= aEnd);
      });

      if (hasConflict) {
        continue;
      }

      const loadScore = Math.max(0, 10 - todayAppointments.length * 2);
      const loadReason = todayAppointments.length === 0
        ? '今日暂无预约，负载最轻'
        : todayAppointments.length <= 2
          ? `今日 ${todayAppointments.length} 单，负载较轻`
          : `今日 ${todayAppointments.length} 单，负载适中`;

      const ratingScore = opt.rating * 2;
      const expScore = Math.min(opt.experience, 15) * 0.5;

      const fragmentScore = calculateFragmentationScore(opt, todayAppointments, startTime, endTime);
      const fragmentReason = fragmentScore >= 8
        ? '可填补两单之间的空闲时段，减少碎片'
        : fragmentScore >= 3
          ? '填补上下班前后的空档'
          : '常规分配';

      const score = loadScore + ratingScore + expScore + fragmentScore;
      const reason = [loadReason, fragmentReason, `评分${opt.rating}`, `经验${opt.experience}年`].join('，');

      candidates.push({
        optometrist: opt,
        score,
        reason,
        details: {
          loadScore,
          loadReason,
          ratingScore,
          expScore,
          fragmentScore,
          fragmentReason,
          workTimeMatch,
          workTimeReason
        }
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    const result = candidates.map((c, i) => ({ ...c, rank: i + 1 }));

    console.log('[Assignment] 候选列表:', result.map((r) => `${r.rank}. ${r.optometrist.name}(${r.score}分)`));
    return result;
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
