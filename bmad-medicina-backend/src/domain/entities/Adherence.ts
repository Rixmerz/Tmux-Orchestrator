export interface AdherenceSchedule {
  id: string;
  userId: string;
  medicationId: string;
  prescriptionId?: string;
  dosage: string;
  frequency: AdherenceFrequency;
  timesPerDay: number;
  scheduledTimes: string[]; // HH:MM format
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Compliance settings
  reminderEnabled: boolean;
  reminderMethods: ReminderMethod[];
  reminderAdvanceMinutes: number;
}

export enum AdherenceFrequency {
  DAILY = "daily",
  EVERY_OTHER_DAY = "every_other_day",
  WEEKLY = "weekly",
  AS_NEEDED = "as_needed",
}

export enum ReminderMethod {
  SMS = "sms",
  EMAIL = "email",
  PUSH_NOTIFICATION = "push_notification",
  PHONE_CALL = "phone_call",
}

export interface AdherenceRecord {
  id: string;
  userId: string;
  medicationId: string;
  scheduleId: string;
  scheduledDateTime: Date;
  actualDateTime?: Date;
  status: AdherenceStatus;
  notes?: string;
  sideEffectsReported?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum AdherenceStatus {
  TAKEN = "taken",
  MISSED = "missed",
  DELAYED = "delayed",
  SKIPPED_INTENTIONALLY = "skipped_intentionally",
  PENDING = "pending",
}

export interface AdherenceMetrics {
  userId: string;
  medicationId: string;
  period: MetricsPeriod;
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  adherenceRate: number; // percentage
  averageDelay: number; // minutes
  longestStreak: number; // days
  currentStreak: number; // days
  calculatedAt: Date;
}

export enum MetricsPeriod {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
}

export interface CreateScheduleRequest {
  medicationId: string;
  dosage: string;
  frequency: AdherenceFrequency;
  timesPerDay: number;
  scheduledTimes: string[];
  startDate: string; // ISO date
  endDate?: string; // ISO date
  notes?: string;
  reminderEnabled: boolean;
  reminderMethods: ReminderMethod[];
  reminderAdvanceMinutes: number;
}

export interface RecordAdherenceRequest {
  scheduleId: string;
  status: AdherenceStatus;
  actualDateTime?: string; // ISO datetime
  notes?: string;
  sideEffectsReported?: string[];
}

export interface AdherenceResponse {
  schedule: {
    id: string;
    medicationId: string;
    medicationName: string;
    dosage: string;
    frequency: AdherenceFrequency;
    timesPerDay: number;
    scheduledTimes: string[];
    startDate: string;
    endDate?: string;
    isActive: boolean;
    reminderEnabled: boolean;
    reminderMethods: ReminderMethod[];
  };
  recentRecords: {
    id: string;
    scheduledDateTime: string;
    actualDateTime?: string;
    status: AdherenceStatus;
    notes?: string;
  }[];
  metrics: {
    adherenceRate: number;
    currentStreak: number;
    totalTaken: number;
    totalMissed: number;
  };
}
