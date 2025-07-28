import {
  CreateMedicationRequest,
  InteractionSeverity,
  Medication,
  MedicationInteraction,
} from "../../domain/entities/Medication.ts";
import {
  getKV,
  KV_KEYS,
  kvDelete,
  kvGet,
  kvList,
  kvSet,
} from "../database/kv.ts";
import { logger } from "../logging/logger.ts";

export class MedicationRepository {
  async create(medicationData: CreateMedicationRequest): Promise<Medication> {
    const id = crypto.randomUUID();

    const medication: Medication = {
      id,
      ...medicationData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    // Store medication with atomic transaction
    const kv = getKV();
    const transaction = kv.atomic()
      .set(KV_KEYS.MEDICATION(id), medication)
      .set(KV_KEYS.MEDICATION_BY_CODE(medication.code), id);

    const result = await transaction.commit();
    if (!result.ok) {
      throw new Error("Failed to create medication: transaction failed");
    }

    logger.info(`Medication created: ${medication.name} (${medication.code})`);
    return medication;
  }

  async findById(id: string): Promise<Medication | null> {
    return await kvGet<Medication>(KV_KEYS.MEDICATION(id));
  }

  async findByCode(code: string): Promise<Medication | null> {
    const medicationId = await kvGet<string>(KV_KEYS.MEDICATION_BY_CODE(code));
    if (!medicationId) return null;
    return this.findById(medicationId);
  }

  async search(query: string, options?: {
    category?: string;
    prescriptionRequired?: boolean;
    limit?: number;
  }): Promise<Medication[]> {
    const allMedications = await kvList<Medication>(["medications"]);
    const searchTerm = query.toLowerCase();

    let filteredMedications = allMedications.filter((med) =>
      med.isActive && (
        med.name.toLowerCase().includes(searchTerm) ||
        med.genericName.toLowerCase().includes(searchTerm) ||
        med.activeIngredient.toLowerCase().includes(searchTerm) ||
        med.code.toLowerCase().includes(searchTerm)
      )
    );

    if (options?.category) {
      filteredMedications = filteredMedications.filter(
        (med) => med.category === options.category,
      );
    }

    if (options?.prescriptionRequired !== undefined) {
      filteredMedications = filteredMedications.filter(
        (med) => med.prescriptionRequired === options.prescriptionRequired,
      );
    }

    if (options?.limit) {
      filteredMedications = filteredMedications.slice(0, options.limit);
    }

    return filteredMedications.sort((a, b) => a.name.localeCompare(b.name));
  }

  async update(
    id: string,
    updates: Partial<CreateMedicationRequest>,
  ): Promise<Medication | null> {
    const existingMedication = await this.findById(id);
    if (!existingMedication) return null;

    const updatedMedication: Medication = {
      ...existingMedication,
      ...updates,
      updatedAt: new Date(),
    };

    // Handle code update
    if (updates.code && updates.code !== existingMedication.code) {
      const kv = getKV();
      const transaction = kv.atomic()
        .set(KV_KEYS.MEDICATION(id), updatedMedication)
        .delete(KV_KEYS.MEDICATION_BY_CODE(existingMedication.code))
        .set(KV_KEYS.MEDICATION_BY_CODE(updates.code), id);

      const result = await transaction.commit();
      if (!result.ok) {
        throw new Error("Failed to update medication: code transaction failed");
      }
    } else {
      await kvSet(KV_KEYS.MEDICATION(id), updatedMedication);
    }

    logger.info(`Medication updated: ${updatedMedication.name} (${id})`);
    return updatedMedication;
  }

  async delete(id: string): Promise<boolean> {
    const medication = await this.findById(id);
    if (!medication) return false;

    const kv = getKV();
    const transaction = kv.atomic()
      .delete(KV_KEYS.MEDICATION(id))
      .delete(KV_KEYS.MEDICATION_BY_CODE(medication.code));

    const result = await transaction.commit();

    if (result.ok) {
      logger.info(`Medication deleted: ${medication.name} (${id})`);
      return true;
    }
    return false;
  }

  async list(options?: {
    category?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Medication[]> {
    let medications = await kvList<Medication>(["medications"]);

    if (options?.category) {
      medications = medications.filter((med) =>
        med.category === options.category
      );
    }

    if (options?.isActive !== undefined) {
      medications = medications.filter((med) =>
        med.isActive === options.isActive
      );
    }

    // Sort by name
    medications.sort((a, b) => a.name.localeCompare(b.name));

    if (options?.offset) {
      medications = medications.slice(options.offset);
    }

    if (options?.limit) {
      medications = medications.slice(0, options.limit);
    }

    return medications;
  }

  // Medication Interactions
  async createInteraction(
    medicationId1: string,
    medicationId2: string,
    severity: InteractionSeverity,
    description: string,
    clinicalEffect: string,
    managementRecommendation: string,
  ): Promise<MedicationInteraction> {
    const id = crypto.randomUUID();

    const interaction: MedicationInteraction = {
      id,
      medicationId1,
      medicationId2,
      severity,
      description,
      clinicalEffect,
      managementRecommendation,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await kvSet(KV_KEYS.MEDICATION_INTERACTIONS(medicationId1), interaction);
    // Also store reverse interaction for bidirectional lookup
    await kvSet(KV_KEYS.MEDICATION_INTERACTIONS(medicationId2), interaction);

    logger.info(
      `Medication interaction created: ${medicationId1} <-> ${medicationId2} (${severity})`,
    );
    return interaction;
  }

  async getInteractions(
    medicationId: string,
  ): Promise<MedicationInteraction[]> {
    return await kvList<MedicationInteraction>(
      KV_KEYS.MEDICATION_INTERACTIONS(medicationId),
    );
  }

  async checkInteractions(medicationIds: string[]): Promise<{
    interactions: MedicationInteraction[];
    hasContraindicated: boolean;
    hasMajor: boolean;
  }> {
    const interactions: MedicationInteraction[] = [];
    let hasContraindicated = false;
    let hasMajor = false;

    for (let i = 0; i < medicationIds.length; i++) {
      for (let j = i + 1; j < medicationIds.length; j++) {
        const med1Interactions = await this.getInteractions(medicationIds[i]);
        const relevantInteractions = med1Interactions.filter(
          (interaction) =>
            interaction.medicationId2 === medicationIds[j] ||
            interaction.medicationId1 === medicationIds[j],
        );

        interactions.push(...relevantInteractions);

        for (const interaction of relevantInteractions) {
          if (interaction.severity === InteractionSeverity.CONTRAINDICATED) {
            hasContraindicated = true;
          } else if (interaction.severity === InteractionSeverity.MAJOR) {
            hasMajor = true;
          }
        }
      }
    }

    // Remove duplicates
    const uniqueInteractions = interactions.filter((interaction, index, self) =>
      index === self.findIndex((i) => i.id === interaction.id)
    );

    logger.info(
      `Interaction check completed for ${medicationIds.length} medications: ${uniqueInteractions.length} interactions found`,
    );

    return {
      interactions: uniqueInteractions,
      hasContraindicated,
      hasMajor,
    };
  }

  async deactivate(id: string): Promise<boolean> {
    const medication = await this.findById(id);
    if (!medication) return false;

    const updatedMedication = {
      ...medication,
      isActive: false,
      updatedAt: new Date(),
    };

    await kvSet(KV_KEYS.MEDICATION(id), updatedMedication);
    logger.info(`Medication deactivated: ${medication.name} (${id})`);
    return true;
  }

  async activate(id: string): Promise<boolean> {
    const medication = await this.findById(id);
    if (!medication) return false;

    const updatedMedication = {
      ...medication,
      isActive: true,
      updatedAt: new Date(),
    };

    await kvSet(KV_KEYS.MEDICATION(id), updatedMedication);
    logger.info(`Medication activated: ${medication.name} (${id})`);
    return true;
  }
}
