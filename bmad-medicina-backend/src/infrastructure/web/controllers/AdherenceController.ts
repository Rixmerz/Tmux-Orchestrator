import { RouterContext } from "@oak/oak";
import { AdherenceRepository } from "../../repositories/AdherenceRepository.ts";
import {
  CreateScheduleRequest,
  RecordAdherenceRequest,
  MetricsPeriod,
} from "../../../domain/entities/Adherence.ts";
import { logger } from "../../logging/logger.ts";
import { ValidationError, NotFoundError } from "../middleware/errorHandler.ts";

export class AdherenceController {
  private adherenceRepo: AdherenceRepository;

  constructor() {
    this.adherenceRepo = new AdherenceRepository();
  }

  // Schedule Management
  async createSchedule(ctx: RouterContext<any>): Promise<void> {
    try {
      const body = await ctx.request.body.json();
      const userId = ctx.params.userId;

      if (!userId) {
        throw new ValidationError("User ID is required");
      }

      // Validate required fields
      if (!body.medicationId || !body.frequency || !body.scheduledTimes) {
        throw new ValidationError(
          "Missing required fields: medicationId, frequency, scheduledTimes"
        );
      }

      const schedule = await this.adherenceRepo.createSchedule(
        userId,
        body as CreateScheduleRequest
      );

      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        data: {
          id: schedule.id,
          medicationId: schedule.medicationId,
          frequency: schedule.frequency,
          scheduledTimes: schedule.scheduledTimes,
          startDate: schedule.startDate.toISOString(),
          endDate: schedule.endDate?.toISOString(),
          reminderEnabled: schedule.reminderEnabled,
          reminderMethods: schedule.reminderMethods,
          isActive: schedule.isActive,
        },
      };
    } catch (error) {
      logger.error("Error creating adherence schedule", error);
      throw error;
    }
  }

  async getUserSchedules(ctx: RouterContext<any>): Promise<void> {
    try {
      const userId = ctx.params.userId;

      if (!userId) {
        throw new ValidationError("User ID is required");
      }

      const schedules = await this.adherenceRepo.getSchedulesByUser(userId);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: schedules.map(schedule => ({
          id: schedule.id,
          medicationId: schedule.medicationId,
          frequency: schedule.frequency,
          timesPerDay: schedule.timesPerDay,
          scheduledTimes: schedule.scheduledTimes,
          startDate: schedule.startDate.toISOString(),
          endDate: schedule.endDate?.toISOString(),
          isActive: schedule.isActive,
          reminderEnabled: schedule.reminderEnabled,
          notes: schedule.notes,
        })),
        meta: {
          total: schedules.length,
          userId,
        },
      };
    } catch (error) {
      logger.error("Error getting user schedules", error);
      throw error;
    }
  }

  // Adherence Recording
  async recordAdherence(ctx: RouterContext<any>): Promise<void> {
    try {
      const body = await ctx.request.body.json();
      const userId = ctx.params.userId;

      if (!userId) {
        throw new ValidationError("User ID is required");
      }

      if (!body.scheduleId || !body.status) {
        throw new ValidationError("Missing required fields: scheduleId, status");
      }

      const record = await this.adherenceRepo.recordAdherence(
        userId,
        body as RecordAdherenceRequest
      );

      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        data: {
          id: record.id,
          scheduleId: record.scheduleId,
          status: record.status,
          scheduledDateTime: record.scheduledDateTime.toISOString(),
          actualDateTime: record.actualDateTime?.toISOString(),
          notes: record.notes,
          sideEffectsReported: record.sideEffectsReported,
        },
      };
    } catch (error) {
      logger.error("Error recording adherence", error);
      throw error;
    }
  }

  async getAdherenceHistory(ctx: RouterContext<any>): Promise<void> {
    try {
      const userId = ctx.params.userId;
      const medicationId = ctx.params.medicationId;

      if (!userId || !medicationId) {
        throw new ValidationError("User ID and Medication ID are required");
      }

      const fromDate = ctx.request.url.searchParams.get("from")
        ? new Date(ctx.request.url.searchParams.get("from")!)
        : undefined;
      const toDate = ctx.request.url.searchParams.get("to")
        ? new Date(ctx.request.url.searchParams.get("to")!)
        : undefined;

      const records = await this.adherenceRepo.getAdherenceRecords(
        userId,
        medicationId,
        fromDate,
        toDate
      );

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: records.map(record => ({
          id: record.id,
          scheduleId: record.scheduleId,
          status: record.status,
          scheduledDateTime: record.scheduledDateTime.toISOString(),
          actualDateTime: record.actualDateTime?.toISOString(),
          notes: record.notes,
          sideEffectsReported: record.sideEffectsReported,
        })),
        meta: {
          total: records.length,
          userId,
          medicationId,
          dateRange: {
            from: fromDate?.toISOString(),
            to: toDate?.toISOString(),
          },
        },
      };
    } catch (error) {
      logger.error("Error getting adherence history", error);
      throw error;
    }
  }

  // Metrics and Analytics
  async getAdherenceMetrics(ctx: RouterContext<any>): Promise<void> {
    try {
      const userId = ctx.params.userId;
      const medicationId = ctx.params.medicationId;
      const period = (ctx.request.url.searchParams.get("period") as MetricsPeriod) || MetricsPeriod.WEEKLY;

      if (!userId || !medicationId) {
        throw new ValidationError("User ID and Medication ID are required");
      }

      const metrics = await this.adherenceRepo.calculateAdherenceMetrics(
        userId,
        medicationId,
        period
      );

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: {
          userId: metrics.userId,
          medicationId: metrics.medicationId,
          period: metrics.period,
          adherenceRate: metrics.adherenceRate,
          totalScheduled: metrics.totalScheduled,
          totalTaken: metrics.totalTaken,
          totalMissed: metrics.totalMissed,
          averageDelay: metrics.averageDelay,
          longestStreak: metrics.longestStreak,
          currentStreak: metrics.currentStreak,
          calculatedAt: metrics.calculatedAt.toISOString(),
        },
      };
    } catch (error) {
      logger.error("Error calculating adherence metrics", error);
      throw error;
    }
  }

  async deactivateSchedule(ctx: RouterContext<any>): Promise<void> {
    try {
      const userId = ctx.params.userId;
      const medicationId = ctx.params.medicationId;

      if (!userId || !medicationId) {
        throw new ValidationError("User ID and Medication ID are required");
      }

      const success = await this.adherenceRepo.deactivateSchedule(userId, medicationId);

      if (!success) {
        throw new NotFoundError("Schedule not found");
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Schedule deactivated successfully",
      };
    } catch (error) {
      logger.error("Error deactivating schedule", error);
      throw error;
    }
  }
}