export interface Medication {
  id: string;
  code: string; // ISP Chile medication code
  name: string;
  genericName: string;
  activeIngredient: string;
  concentration: string;
  pharmaceuticalForm: PharmaceuticalForm;
  manufacturer: string;
  category: MedicationCategory;
  prescriptionRequired: boolean;
  controlledSubstance: boolean;
  refrigerationRequired: boolean;
  instructions: string;
  sideEffects: string[];
  contraindications: string[];
  warnings: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export enum PharmaceuticalForm {
  TABLET = "tablet",
  CAPSULE = "capsule",
  SYRUP = "syrup",
  INJECTION = "injection",
  CREAM = "cream",
  DROPS = "drops",
  INHALER = "inhaler",
  PATCH = "patch",
  SUPPOSITORY = "suppository",
}

export enum MedicationCategory {
  CARDIOVASCULAR = "cardiovascular",
  DIABETES = "diabetes",
  HYPERTENSION = "hypertension",
  ANTIBIOTIC = "antibiotic",
  ANALGESIC = "analgesic",
  ANTIHISTAMINE = "antihistamine",
  ANTIDEPRESSANT = "antidepressant",
  ANTICOAGULANT = "anticoagulant",
  RESPIRATORY = "respiratory",
  GASTROINTESTINAL = "gastrointestinal",
  OTHER = "other",
}

export interface MedicationInteraction {
  id: string;
  medicationId1: string;
  medicationId2: string;
  severity: InteractionSeverity;
  description: string;
  clinicalEffect: string;
  managementRecommendation: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum InteractionSeverity {
  MINOR = "minor",
  MODERATE = "moderate",
  MAJOR = "major",
  CONTRAINDICATED = "contraindicated",
}

export interface CreateMedicationRequest {
  code: string;
  name: string;
  genericName: string;
  activeIngredient: string;
  concentration: string;
  pharmaceuticalForm: PharmaceuticalForm;
  manufacturer: string;
  category: MedicationCategory;
  prescriptionRequired: boolean;
  controlledSubstance: boolean;
  refrigerationRequired: boolean;
  instructions: string;
  sideEffects: string[];
  contraindications: string[];
  warnings: string[];
}

export interface MedicationResponse {
  id: string;
  code: string;
  name: string;
  genericName: string;
  activeIngredient: string;
  concentration: string;
  pharmaceuticalForm: PharmaceuticalForm;
  manufacturer: string;
  category: MedicationCategory;
  prescriptionRequired: boolean;
  controlledSubstance: boolean;
  refrigerationRequired: boolean;
  instructions: string;
  sideEffects: string[];
  contraindications: string[];
  warnings: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
