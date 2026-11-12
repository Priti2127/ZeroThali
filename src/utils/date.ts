import { format, parseISO, isBefore, isAfter, addDays, startOfDay } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy hh:mm a');
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const formatMealType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export const isCutoffPassed = (mealDate: string, cutoffTime: string): boolean => {
  const now = new Date();
  const [hours, minutes] = cutoffTime.split(':');
  const cutoff = new Date(mealDate);
  cutoff.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return isAfter(now, cutoff);
};

export const getTimeUntilCutoff = (mealDate: string, cutoffTime: string): string => {
  const now = new Date();
  const [hours, minutes] = cutoffTime.split(':');
  const cutoff = new Date(mealDate);
  cutoff.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (isBefore(cutoff, now)) {
    return 'Cutoff passed';
  }
  
  const diff = cutoff.getTime() - now.getTime();
  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hoursLeft > 0) {
    return `${hoursLeft}h ${minutesLeft}m left`;
  } else {
    return `${minutesLeft}m left`;
  }
};

export const getTodayDate = (): string => {
  return formatDate(new Date());
};

export const getWeekday = (date: string): string => {
  const d = parseISO(date);
  return format(d, 'EEEE');
};

export const getNextNDays = (n: number): string[] => {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    dates.push(formatDate(addDays(new Date(), i)));
  }
  return dates;
};

export const isToday = (date: string): boolean => {
  return formatDate(new Date()) === date;
};

export const isFuture = (date: string): boolean => {
  return isAfter(parseISO(date), startOfDay(new Date()));
};
