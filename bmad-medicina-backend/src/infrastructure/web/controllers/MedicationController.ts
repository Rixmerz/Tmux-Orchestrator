import { RouterContext } from "@oak/oak";
import { MedicationRepository } from "../../repositories/MedicationRepository.ts";
import {
  CreateMedicationRequest,
  InteractionSeverity,
  MedicationResponse,
} from "../../../domain/entities/Medication.ts";
import { logger } from "../../logging/logger.ts";

export class MedicationController {
  private medicationRepo: MedicationRepository;

  constructor() {
    this.medicationRepo = new MedicationRepository();
  }

  async create(ctx: RouterContext<any>): Promise<void> {
    try {
      const body = await ctx.request.body.json();

      // Validate required fields
      if (
        !body.code || !body.name || !body.genericName || !body.activeIngredient
      ) {
        ctx.response.status = 400;
        ctx.response.body = {
          error:
            "Missing required fields: code, name, genericName, activeIngredient",
        };
        return;
      }

      // Check if medication code already exists
      const existing = await this.medicationRepo.findByCode(body.code);
      if (existing) {
        ctx.response.status = 409;
        ctx.response.body = {
          error: "Medication with this code already exists",
        };
        return;
      }

      const medication = await this.medicationRepo.create(
        body as CreateMedicationRequest,
      );

      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        data: this.toResponse(medication),
      };
    } catch (error) {
      logger.error("Error creating medication", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  async getById(ctx: RouterContext<any>): Promise<void> {
    try {
      const id = ctx.params.id;
      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Medication ID is required" };
        return;
      }

      const medication = await this.medicationRepo.findById(id);
      if (!medication) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Medication not found" };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: this.toResponse(medication),
      };
    } catch (error) {
      logger.error("Error getting medication by ID", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  async getByCode(ctx: RouterContext<any>): Promise<void> {
    try {
      const code = ctx.params.code;
      if (!code) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Medication code is required" };
        return;
      }

      const medication = await this.medicationRepo.findByCode(code);
      if (!medication) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Medication not found" };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: this.toResponse(medication),
      };
    } catch (error) {
      logger.error("Error getting medication by code", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  async search(ctx: RouterContext<any>): Promise<void> {
    try {
      const query = ctx.request.url.searchParams.get("q") || "";
      const category = ctx.request.url.searchParams.get("category") ||
        undefined;
      const prescriptionRequired = ctx.request.url.searchParams.get(
        "prescriptionRequired",
      );
      const limit = parseInt(ctx.request.url.searchParams.get("limit") || "20");

      if (!query.trim()) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Search query is required" };
        return;
      }

      const options = {
        category,
        prescriptionRequired: prescriptionRequired
          ? prescriptionRequired === "true"
          : undefined,
        limit: Math.min(limit, 100), // Max 100 results
      };

      const medications = await this.medicationRepo.search(query, options);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: medications.map((med) => this.toResponse(med)),
        meta: {
          total: medications.length,
          query,
          options,
        },
      };
    } catch (error) {
      logger.error("Error searching medications", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  async list(ctx: RouterContext<any>): Promise<void> {
    try {
      const category = ctx.request.url.searchParams.get("category") ||
        undefined;
      const isActive = ctx.request.url.searchParams.get("isActive");
      const limit = parseInt(ctx.request.url.searchParams.get("limit") || "50");
      const offset = parseInt(
        ctx.request.url.searchParams.get("offset") || "0",
      );

      const options = {
        category,
        isActive: isActive ? isActive === "true" : undefined,
        limit: Math.min(limit, 100),
        offset: Math.max(offset, 0),
      };

      const medications = await this.medicationRepo.list(options);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: medications.map((med) => this.toResponse(med)),
        meta: {
          total: medications.length,
          limit: options.limit,
          offset: options.offset,
        },
      };
    } catch (error) {
      logger.error("Error listing medications", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  async update(ctx: RouterContext<any>): Promise<void> {
    try {
      const id = ctx.params.id;
      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Medication ID is required" };
        return;
      }

      const body = await ctx.request.body.json();

      const medication = await this.medicationRepo.update(id, body);
      if (!medication) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Medication not found" };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: this.toResponse(medication),
      };
    } catch (error) {
      logger.error("Error updating medication", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  async delete(ctx: RouterContext<any>): Promise<void> {
    try {
      const id = ctx.params.id;
      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Medication ID is required" };
        return;
      }

      const deleted = await this.medicationRepo.delete(id);
      if (!deleted) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Medication not found" };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Medication deleted successfully",
      };
    } catch (error) {
      logger.error("Error deleting medication", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  async checkInteractions(ctx: RouterContext<any>): Promise<void> {
    try {
      const body = await ctx.request.body.json();

      if (!body.medicationIds || !Array.isArray(body.medicationIds)) {
        ctx.response.status = 400;
        ctx.response.body = { error: "medicationIds array is required" };
        return;
      }

      if (body.medicationIds.length < 2) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: "At least 2 medications are required for interaction check",
        };
        return;
      }

      const result = await this.medicationRepo.checkInteractions(
        body.medicationIds,
      );

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: {
          interactions: result.interactions,
          summary: {
            totalInteractions: result.interactions.length,
            hasContraindicated: result.hasContraindicated,
            hasMajor: result.hasMajor,
            riskLevel: result.hasContraindicated
              ? "critical"
              : result.hasMajor
              ? "high"
              : result.interactions.length > 0
              ? "moderate"
              : "low",
          },
        },
      };
    } catch (error) {
      logger.error("Error checking medication interactions", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  async createInteraction(ctx: RouterContext<any>): Promise<void> {
    try {
      const body = await ctx.request.body.json();

      if (
        !body.medicationId1 || !body.medicationId2 || !body.severity ||
        !body.description
      ) {
        ctx.response.status = 400;
        ctx.response.body = {
          error:
            "Required fields: medicationId1, medicationId2, severity, description",
        };
        return;
      }

      // Validate severity
      if (!Object.values(InteractionSeverity).includes(body.severity)) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: `Invalid severity. Must be one of: ${
            Object.values(InteractionSeverity).join(", ")
          }`,
        };
        return;
      }

      // Check if medications exist
      const med1 = await this.medicationRepo.findById(body.medicationId1);
      const med2 = await this.medicationRepo.findById(body.medicationId2);

      if (!med1 || !med2) {
        ctx.response.status = 404;
        ctx.response.body = { error: "One or both medications not found" };
        return;
      }

      const interaction = await this.medicationRepo.createInteraction(
        body.medicationId1,
        body.medicationId2,
        body.severity,
        body.description,
        body.clinicalEffect || "",
        body.managementRecommendation || "",
      );

      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        data: interaction,
      };
    } catch (error) {
      logger.error("Error creating medication interaction", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }

  private toResponse(medication: any): MedicationResponse {
    return {
      id: medication.id,
      code: medication.code,
      name: medication.name,
      genericName: medication.genericName,
      activeIngredient: medication.activeIngredient,
      concentration: medication.concentration,
      pharmaceuticalForm: medication.pharmaceuticalForm,
      manufacturer: medication.manufacturer,
      category: medication.category,
      prescriptionRequired: medication.prescriptionRequired,
      controlledSubstance: medication.controlledSubstance,
      refrigerationRequired: medication.refrigerationRequired,
      instructions: medication.instructions,
      sideEffects: medication.sideEffects,
      contraindications: medication.contraindications,
      warnings: medication.warnings,
      createdAt: medication.createdAt.toISOString(),
      updatedAt: medication.updatedAt.toISOString(),
      isActive: medication.isActive,
    };
  }
}
