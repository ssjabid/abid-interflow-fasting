import type { FastingSchedule } from "../types";

// Simple type for auto-started fast data (without id)
interface AutoStartFastData {
  startTime: Date;
  endTime: null;
  status: "active";
  duration: number;
  protocol: string;
  notes: string;
  targetDuration: number;
  isScheduled: boolean;
}

/**
 * Check if a scheduled fast should be auto-started
 * Returns true if:
 * 1. Schedule is enabled
 * 2. Current date is on or after the schedule start date
 * 3. Current time is past the eating window end time
 * 4. A fast hasn't already been auto-started today
 */
export const shouldAutoStartFast = (
  schedule: FastingSchedule | undefined,
  activeFast: unknown
): boolean => {
  if (!schedule?.enabled || activeFast) {
    return false;
  }

  // Check if we have a start date and if today is on or after it
  if (schedule.startDate) {
    const startDate = new Date(schedule.startDate);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today < startDate) {
      // Schedule hasn't started yet
      return false;
    }
  }

  // Check if we already auto-started a fast today
  if (schedule.lastAutoStartDate) {
    const lastStart = new Date(schedule.lastAutoStartDate);
    const today = new Date();
    if (
      lastStart.getDate() === today.getDate() &&
      lastStart.getMonth() === today.getMonth() &&
      lastStart.getFullYear() === today.getFullYear()
    ) {
      // Already started a fast today
      return false;
    }
  }

  // Check if current time is past the eating window end time
  const now = new Date();
  const [endHour, endMin] = schedule.eatingWindowEnd.split(":").map(Number);
  const endTime = new Date();
  endTime.setHours(endHour, endMin, 0, 0);

  // Only auto-start if we're past the eating window end AND within a reasonable window (2 hours)
  const twoHoursAfterEnd = new Date(endTime);
  twoHoursAfterEnd.setHours(twoHoursAfterEnd.getHours() + 2);

  return now >= endTime && now <= twoHoursAfterEnd;
};

/**
 * Get the time until the next scheduled fast start
 */
export const getTimeUntilNextFast = (
  schedule: FastingSchedule | undefined
): { hours: number; minutes: number } | null => {
  if (!schedule?.enabled) return null;

  const now = new Date();
  const [endHour, endMin] = schedule.eatingWindowEnd.split(":").map(Number);

  let nextFastTime = new Date();
  nextFastTime.setHours(endHour, endMin, 0, 0);

  // If we're past today's fast time, calculate for tomorrow
  if (now > nextFastTime) {
    nextFastTime.setDate(nextFastTime.getDate() + 1);
  }

  // Check if schedule has a start date that's in the future
  if (schedule.startDate) {
    const startDate = new Date(schedule.startDate);
    startDate.setHours(endHour, endMin, 0, 0);

    if (startDate > nextFastTime) {
      nextFastTime = startDate;
    }
  }

  const diffMs = nextFastTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  return {
    hours: Math.floor(diffMins / 60),
    minutes: diffMins % 60,
  };
};

/**
 * Create an auto-started fast object
 */
export const createAutoStartedFast = (
  schedule: FastingSchedule
): AutoStartFastData => {
  const now = new Date();

  // Calculate expected duration based on eating window
  const [startHour] = schedule.eatingWindowStart.split(":").map(Number);
  const [endHour] = schedule.eatingWindowEnd.split(":").map(Number);

  // Calculate fasting hours (time from eating window end to next eating window start)
  let fastingHours = startHour - endHour;
  if (fastingHours <= 0) fastingHours += 24;

  return {
    startTime: now,
    endTime: null,
    status: "active",
    duration: 0,
    protocol: "custom",
    notes: "Auto-started by schedule",
    targetDuration: fastingHours * 60,
    isScheduled: true,
  };
};

/**
 * Format time for display (e.g., "20:00" -> "8:00 PM")
 */
export const formatScheduleTime = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};
