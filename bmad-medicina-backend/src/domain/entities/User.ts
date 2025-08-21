export interface User {
  id: string;
  email: string;
  phone: string;
  hashedPassword: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other";
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  // Ley 19.628 compliance fields
  consentGiven: boolean;
  consentDate: Date;
  dataRetentionUntil: Date;
}

export enum UserRole {
  PATIENT = "patient",
  FAMILY_MEMBER = "family_member",
  PHARMACY_STAFF = "pharmacy_staff",
  PHARMACIST = "pharmacist",
  DOCTOR = "doctor",
  ADMIN = "admin",
}

export interface CreateUserRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  gender: "male" | "female" | "other";
  role: UserRole;
  consentGiven: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  gender?: "male" | "female" | "other";
}

export interface UserResponse {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
