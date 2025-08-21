/**
 * BMad - API Service Layer
 * Frontend integration with backend APIs at localhost:8080
 * Optimized for medication adherence system
 */

import { ApiResponse, Medication, MedicationSchedule, DoseRecord, Patient } from '../types/medication.ts';

// API Configuration
const API_BASE_URL = 'http://localhost:8080/api/v1';
const API_TIMEOUT = 10000; // 10 seconds for seniors

// JWT Token management
let authToken: string | null = null;

export class ApiService {
  private static instance: ApiService;
  
  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Set authentication token
  setAuthToken(token: string): void {
    authToken = token;
    localStorage.setItem('bmad_auth_token', token);
  }

  // Get stored auth token
  getAuthToken(): string | null {
    if (!authToken && typeof localStorage !== 'undefined') {
      authToken = localStorage.getItem('bmad_auth_token');
    }
    return authToken;
  }

  // Clear authentication
  clearAuth(): void {
    authToken = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('bmad_auth_token');
    }
  }

  // Generic API request method
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Default headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Request configuration
    const config: RequestInit = {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
    };

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      config.signal = controller.signal;

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Parse response
      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle HTTP errors
      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data,
        timestamp: new Date(),
      };

    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      
      let errorMessage = 'Error de conexión con el servidor';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'La solicitud tardó demasiado. Verifica tu conexión.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'No se puede conectar al servidor. Verifica tu conexión a internet.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: Patient }>> {
    const response = await this.request<{ token: string; user: Patient }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>('/auth/logout', {
      method: 'POST',
    });

    this.clearAuth();
    return response;
  }

  // Medication endpoints
  async searchMedicationByCode(code: string): Promise<ApiResponse<Medication>> {
    // Backend uses query parameter "search" in medications list endpoint
    const response = await this.request<{ data: Medication[] }>(`/medications?search=${encodeURIComponent(code)}`);
    
    if (response.success && response.data?.data && response.data.data.length > 0) {
      // Return the first matching medication
      return {
        success: true,
        data: response.data.data[0],
        timestamp: new Date(),
      };
    } else if (response.success && response.data?.data && response.data.data.length === 0) {
      return {
        success: false,
        error: 'No se encontró medicamento con ese código',
        timestamp: new Date(),
      };
    }
    
    return response as ApiResponse<Medication>;
  }

  async getMedicationById(id: string): Promise<ApiResponse<Medication>> {
    return this.request<Medication>(`/medications/${id}`);
  }

  async getAllMedications(): Promise<ApiResponse<Medication[]>> {
    return this.request<Medication[]>('/medications');
  }

  async createMedication(medication: Partial<Medication>): Promise<ApiResponse<Medication>> {
    return this.request<Medication>('/medications', {
      method: 'POST',
      body: JSON.stringify(medication),
    });
  }

  async updateMedication(id: string, medication: Partial<Medication>): Promise<ApiResponse<Medication>> {
    return this.request<Medication>(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(medication),
    });
  }

  // Schedule endpoints
  async getPatientSchedule(patientId: string, date?: string): Promise<ApiResponse<MedicationSchedule[]>> {
    const queryParams = date ? `?date=${date}` : '';
    return this.request<MedicationSchedule[]>(`/patients/${patientId}/schedule${queryParams}`);
  }

  async createSchedule(schedule: Partial<MedicationSchedule>): Promise<ApiResponse<MedicationSchedule>> {
    return this.request<MedicationSchedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule),
    });
  }

  async updateSchedule(id: string, schedule: Partial<MedicationSchedule>): Promise<ApiResponse<MedicationSchedule>> {
    return this.request<MedicationSchedule>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schedule),
    });
  }

  async deleteSchedule(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  // Dose tracking endpoints
  async recordDose(dose: Partial<DoseRecord>): Promise<ApiResponse<DoseRecord>> {
    return this.request<DoseRecord>('/doses', {
      method: 'POST',
      body: JSON.stringify(dose),
    });
  }

  async markDoseAsTaken(scheduleId: string, timestamp?: string): Promise<ApiResponse<DoseRecord>> {
    return this.request<DoseRecord>('/doses/taken', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId,
        actualTime: timestamp || new Date().toISOString(),
        status: 'taken',
        method: 'manual',
      }),
    });
  }

  async markDoseAsSkipped(scheduleId: string, reason?: string): Promise<ApiResponse<DoseRecord>> {
    return this.request<DoseRecord>('/doses/skipped', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId,
        status: 'skipped',
        notes: reason,
      }),
    });
  }

  async getDoseHistory(patientId: string, startDate?: string, endDate?: string): Promise<ApiResponse<DoseRecord[]>> {
    let queryParams = '';
    if (startDate || endDate) {
      queryParams = `?${startDate ? `startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`;
    }
    return this.request<DoseRecord[]>(`/patients/${patientId}/doses${queryParams}`);
  }

  // Patient endpoints
  async getPatientProfile(id: string): Promise<ApiResponse<Patient>> {
    return this.request<Patient>(`/patients/${id}`);
  }

  async updatePatientProfile(id: string, patient: Partial<Patient>): Promise<ApiResponse<Patient>> {
    return this.request<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patient),
    });
  }

  async updatePatientPreferences(patientId: string, preferences: any): Promise<ApiResponse<Patient>> {
    return this.request<Patient>(`/patients/${patientId}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // QR Code specific endpoint
  async processMedicationQR(qrCode: string, patientId: string): Promise<ApiResponse<{
    medication: Medication;
    existingSchedule?: MedicationSchedule;
    suggestions: {
      dosage: string;
      frequency: string;
      instructions: string;
    };
  }>> {
    return this.request('/medications/process-qr', {
      method: 'POST',
      body: JSON.stringify({
        qrCode,
        patientId,
      }),
    });
  }

  // Alerts and notifications
  async getPatientAlerts(patientId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/patients/${patientId}/alerts`);
  }

  async markAlertAsRead(alertId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/alerts/${alertId}/read`, {
      method: 'PUT',
    });
  }

  // Analytics and adherence
  async getAdherenceMetrics(patientId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<ApiResponse<any>> {
    return this.request(`/patients/${patientId}/adherence?period=${period}`);
  }

  // Emergency contacts
  async notifyEmergencyContacts(patientId: string, message: string): Promise<ApiResponse<void>> {
    return this.request('/emergency/notify', {
      method: 'POST',
      body: JSON.stringify({
        patientId,
        message,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    // Backend uses /health instead of /api/v1/health
    const url = `${API_BASE_URL.replace('/api/v1', '')}/health`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data,
          timestamp: new Date(),
        };
      } else {
        return {
          success: false,
          error: `Health check failed: ${response.status}`,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date(),
      };
    }
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();

// Export types for convenience
export type { ApiResponse, Medication, MedicationSchedule, DoseRecord, Patient };