import {
  AdherenceRecord,
  AdherenceSchedule,
  CreateScheduleRequest,
  RecordAdherenceRequest,
  AdherenceStatus,
  AdherenceMetrics,
  MetricsPeriod,
} from "../../domain/entities/Adherence.ts";
import {
  getKV,
  KV_KEYS,
  kvSet,
  kvGet,
  kvDelete,
  kvList,
} from "../database/kv.ts";
import { logger } from "../logging/logger.ts";

export class AdherenceRepository {
  // Schedule Management
  async createSchedule(
    userId: string,
    scheduleData: CreateScheduleRequest,
  ): Promise<AdherenceSchedule> {
    const id = crypto.randomUUID();

    const schedule: AdherenceSchedule = {
      id,
      userId,
      medicationId: scheduleData.medicationId,
      dosage: scheduleData.dosage,
      frequency: scheduleData.frequency,
      timesPerDay: scheduleData.timesPerDay,
      scheduledTimes: scheduleData.scheduledTimes,
      startDate: new Date(scheduleData.startDate),
      endDate: scheduleData.endDate ? new Date(scheduleData.endDate) : undefined,
      isActive: true,
      notes: scheduleData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      reminderEnabled: scheduleData.reminderEnabled,
      reminderMethods: scheduleData.reminderMethods,
      reminderAdvanceMinutes: scheduleData.reminderAdvanceMinutes,
    };

    await kvSet(KV_KEYS.ADHERENCE_SCHEDULE(userId, scheduleData.medicationId), schedule);
    
    logger.logMedicalEvent("ADHERENCE_SCHEDULE_CREATED", userId, {
      medicationId: scheduleData.medicationId,
      frequency: scheduleData.frequency,
    });

    return schedule;
  }

  async getSchedulesByUser(userId: string): Promise<AdherenceSchedule[]> {
    const schedules = await kvList<AdherenceSchedule>(["adherence_schedules", userId]);
    return schedules.filter(schedule => schedule.isActive);
  }

  async getSchedule(
    userId: string,
    medicationId: string,
  ): Promise<AdherenceSchedule | null> {
    return await kvGet<AdherenceSchedule>(
      KV_KEYS.ADHERENCE_SCHEDULE(userId, medicationId),
    );
  }

  // Adherence Recording
  async recordAdherence(
    userId: string,
    recordData: RecordAdherenceRequest,
  ): Promise<AdherenceRecord> {
    const id = crypto.randomUUID();
    const now = new Date();

    // Get schedule to extract medication info
    const schedule = await kvGet<AdherenceSchedule>(["adherence_schedules", userId, recordData.scheduleId]);
    if (!schedule) {
      throw new Error("Schedule not found");
    }

    const record: AdherenceRecord = {
      id,
      userId,
      medicationId: schedule.medicationId,
      scheduleId: recordData.scheduleId,
      scheduledDateTime: now, // This should come from the scheduled time
      actualDateTime: recordData.actualDateTime ? new Date(recordData.actualDateTime) : now,
      status: recordData.status,
      notes: recordData.notes,
      sideEffectsReported: recordData.sideEffectsReported,
      createdAt: now,
      updatedAt: now,
    };

    const dateKey = record.scheduledDateTime.toISOString().split('T')[0];
    await kvSet(
      KV_KEYS.ADHERENCE_RECORD(userId, schedule.medicationId, dateKey),
      record,
    );

    logger.logMedicalEvent("ADHERENCE_RECORDED", userId, {
      medicationId: schedule.medicationId,
      status: recordData.status,
      onTime: record.status === AdherenceStatus.TAKEN,
    });

    return record;
  }

  async getAdherenceRecords(
    userId: string,
    medicationId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<AdherenceRecord[]> {
    const records = await kvList<AdherenceRecord>(
      ["adherence_records", userId, medicationId],
    );

    let filteredRecords = records;

    if (fromDate) {
      filteredRecords = filteredRecords.filter(
        record => record.scheduledDateTime >= fromDate,
      );
    }

    if (toDate) {
      filteredRecords = filteredRecords.filter(
        record => record.scheduledDateTime <= toDate,
      );
    }

    return filteredRecords.sort(
      (a, b) => b.scheduledDateTime.getTime() - a.scheduledDateTime.getTime(),
    );
  }

  // Metrics Calculation
  async calculateAdherenceMetrics(
    userId: string,
    medicationId: string,
    period: MetricsPeriod,
  ): Promise<AdherenceMetrics> {
    const now = new Date();
    let fromDate: Date;

    switch (period) {
      case MetricsPeriod.DAILY:
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case MetricsPeriod.WEEKLY:
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case MetricsPeriod.MONTHLY:
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case MetricsPeriod.QUARTERLY:
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    const records = await this.getAdherenceRecords(userId, medicationId, fromDate);
    
    const totalScheduled = records.length;
    const totalTaken = records.filter(r => r.status === AdherenceStatus.TAKEN).length;
    const totalMissed = records.filter(r => r.status === AdherenceStatus.MISSED).length;
    
    const adherenceRate = totalScheduled > 0 ? (totalTaken / totalScheduled) * 100 : 0;
    
    // Calculate average delay
    const takenRecords = records.filter(r => r.status === AdherenceStatus.TAKEN && r.actualDateTime);
    const delays = takenRecords.map(r => {
      if (r.actualDateTime) {
        return Math.abs(r.actualDateTime.getTime() - r.scheduledDateTime.getTime()) / (1000 * 60);
      }
      return 0;
    });
    const averageDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;

    // Calculate streaks
    const { longestStreak, currentStreak } = this.calculateStreaks(records);

    return {
      userId,
      medicationId,
      period,
      totalScheduled,
      totalTaken,
      totalMissed,
      adherenceRate,
      averageDelay,
      longestStreak,
      currentStreak,
      calculatedAt: now,
    };
  }

  private calculateStreaks(records: AdherenceRecord[]): {
    longestStreak: number;
    currentStreak: number;
  } {
    const sortedRecords = records.sort(
      (a, b) => a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime(),
    );

    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;

    for (const record of sortedRecords) {
      if (record.status === AdherenceStatus.TAKEN) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak from the end
    for (let i = sortedRecords.length - 1; i >= 0; i--) {
      if (sortedRecords[i].status === AdherenceStatus.TAKEN) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { longestStreak, currentStreak };
  }

  async deactivateSchedule(userId: string, medicationId: string): Promise<boolean> {
    const schedule = await this.getSchedule(userId, medicationId);
    if (!schedule) return false;

    const updatedSchedule = {
      ...schedule,
      isActive: false,
      updatedAt: new Date(),
    };

    await kvSet(KV_KEYS.ADHERENCE_SCHEDULE(userId, medicationId), updatedSchedule);
    
    logger.logMedicalEvent("ADHERENCE_SCHEDULE_DEACTIVATED", userId, {
      medicationId,
    });

    return true;
  }
}