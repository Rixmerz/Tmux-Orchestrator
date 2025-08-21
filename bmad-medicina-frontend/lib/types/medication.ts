/**
 * BMad - Medication Types
 * TypeScript interfaces for medication adherence system
 */

// Medication information from QR code or database
export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  form: MedicationForm;
  manufacturer?: string;
  lotNumber?: string;
  expirationDate?: Date;
  ndc?: string; // National Drug Code
  barcode?: string;
  description?: string;
  sideEffects?: string[];
  instructions?: string;
  warnings?: string[];
}

// Types of medication forms
export type MedicationForm = 
  | 'tablet'
  | 'capsule'
  | 'liquid'
  | 'injection'
  | 'patch'
  | 'inhaler'
  | 'cream'
  | 'drops'
  | 'suppository'
  | 'other';

// Schedule for taking medications
export interface MedicationSchedule {
  id: string;
  medicationId: string;
  patientId: string;
  dosage: string;
  frequency: MedicationFrequency;
  times: string[]; // Array of time strings like ["08:00", "20:00"]
  duration?: number; // Days
  startDate: Date;
  endDate?: Date;
  instructions?: string;
  withFood?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Frequency of medication intake
export interface MedicationFrequency {
  type: 'daily' | 'weekly' | 'monthly' | 'as_needed' | 'custom';
  value: number; // Times per day/week/month
  interval?: number; // Hours between doses
  specificDays?: number[]; // For weekly: [1,3,5] for Mon, Wed, Fri
}

// Individual dose tracking
export interface DoseRecord {
  id: string;
  scheduleId: string;
  medicationId: string;
  patientId: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: DoseStatus;
  notes?: string;
  confirmedBy?: string; // User ID who confirmed
  method?: ConfirmationMethod;
  createdAt: Date;
  updatedAt: Date;
}

// Status of individual dose
export type DoseStatus = 
  | 'scheduled'   // Future dose
  | 'due'         // Current time window
  | 'taken'       // Successfully taken
  | 'missed'      // Past due window
  | 'skipped'     // Intentionally skipped
  | 'delayed';    // Taken late but within grace period

// How dose was confirmed
export type ConfirmationMethod = 
  | 'manual'      // User clicked taken
  | 'qr_scan'     // Scanned medication QR code
  | 'photo'       // Photo verification
  | 'caregiver'   // Confirmed by caregiver
  | 'automatic';  // Smart dispenser

// Patient information
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email?: string;
  phone?: string;
  emergencyContact?: EmergencyContact;
  medicalConditions?: string[];
  allergies?: string[];
  preferences: PatientPreferences;
  caregivers?: string[]; // Array of caregiver user IDs
  createdAt: Date;
  updatedAt: Date;
}

// Emergency contact information
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

// Patient preferences for UI and notifications
export interface PatientPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reminderAdvanceTime: number; // Minutes before dose time
  language: 'es' | 'en'; // Spanish by default for Chilean users
  timeFormat: '12h' | '24h';
  voiceReminders: boolean;
  familyNotifications: boolean;
}

// Medication alerts and reminders
export interface MedicationAlert {
  id: string;
  patientId: string;
  scheduleId?: string;
  medicationId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  scheduledTime: Date;
  isRead: boolean;
  isActioned: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

// Types of alerts
export type AlertType = 
  | 'dose_reminder'     // Time to take medication
  | 'dose_overdue'      // Missed dose
  | 'low_stock'         // Running low on medication
  | 'refill_needed'     // Time to refill prescription
  | 'expiration_warning' // Medication expiring soon
  | 'interaction_warning' // Drug interaction detected
  | 'appointment_reminder' // Doctor appointment
  | 'system_notification'; // General system message

// Alert severity levels
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// QR Code scan result
export interface QRScanResult {
  success: boolean;
  data?: string;
  medicationInfo?: Medication;
  error?: string;
  timestamp: Date;
}

// Camera permissions and state
export interface CameraState {
  hasPermission: boolean;
  isActive: boolean;
  isSupported: boolean;
  error?: string;
  stream?: MediaStream;
}

// Medication stock tracking
export interface MedicationStock {
  id: string;
  medicationId: string;
  patientId: string;
  currentQuantity: number;
  totalQuantity: number;
  unit: string; // 'tablets', 'ml', 'doses'
  lowStockThreshold: number;
  expirationDate?: Date;
  location?: string; // Where medication is stored
  lastUpdated: Date;
}

// Analytics and adherence tracking
export interface AdherenceMetrics {
  patientId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalScheduledDoses: number;
  takenDoses: number;
  missedDoses: number;
  skippedDoses: number;
  adherenceRate: number; // Percentage
  medications: MedicationAdherence[];
}

export interface MedicationAdherence {
  medicationId: string;
  medicationName: string;
  scheduledDoses: number;
  takenDoses: number;
  adherenceRate: number;
}

// WebSocket message types for real-time updates
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
  timestamp: Date;
  patientId?: string;
}

export type WebSocketMessageType = 
  | 'dose_reminder'
  | 'dose_confirmed'
  | 'alert_created'
  | 'schedule_updated'
  | 'stock_updated'
  | 'caregiver_notification';

// Form validation errors
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// API response wrapper  
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  timestamp: Date;
}