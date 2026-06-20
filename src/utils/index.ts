export const formatDate = (date: Date | string, format = 'YYYY-MM-DD'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm');
};

export const generateId = (prefix = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
};

export const getTodayDate = (): string => {
  return formatDate(new Date());
};

export const getWeekDates = (): { date: string; weekday: string; day: string }[] => {
  const dates = [];
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      date: formatDate(d),
      weekday: weekdays[d.getDay()],
      day: String(d.getDate())
    });
  }

  return dates;
};

export const generateTimeSlots = (
  startHour = 9,
  endHour = 18,
  intervalMinutes = 30
): { id: string; startTime: string; endTime: string }[] => {
  const slots = [];
  let currentHour = startHour;
  let currentMinute = 0;

  while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
    const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    currentMinute += intervalMinutes;
    let endHourVal = currentHour;
    let endMinuteVal = currentMinute;

    if (endMinuteVal >= 60) {
      endHourVal += Math.floor(endMinuteVal / 60);
      endMinuteVal = endMinuteVal % 60;
    }

    const endTime = `${String(endHourVal).padStart(2, '0')}:${String(endMinuteVal).padStart(2, '0')}`;
    slots.push({
      id: `slot_${startTime.replace(':', '')}`,
      startTime,
      endTime
    });

    currentHour = endHourVal;
    currentMinute = endMinuteVal;
  }

  return slots;
};
