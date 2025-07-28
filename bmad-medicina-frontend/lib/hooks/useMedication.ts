/**
 * BMad - Medication Management Hook
 * Custom hook for medication state management and API integration
 * Optimized for senior-friendly error handling
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import { apiService, ApiResponse, Medication, MedicationSchedule, DoseRecord } from '../services/api.ts';

interface MedicationState {
  medications: Medication[];
  schedules: MedicationSchedule[];
  doses: DoseRecord[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseMedicationReturn {
  // State
  state: MedicationState;
  
  // Actions
  searchMedicationByQR: (qrCode: string) => Promise<Medication | null>;
  getMedicationDetails: (id: string) => Promise<Medication | null>;
  markDoseAsTaken: (scheduleId: string) => Promise<boolean>;
  markDoseAsSkipped: (scheduleId: string, reason?: string) => Promise<boolean>;
  loadPatientSchedule: (patientId: string, date?: string) => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  isOffline: boolean;
}

export function useMedication(patientId?: string): UseMedicationReturn {
  const [state, setState] = useState<MedicationState>({
    medications: [],
    schedules: [],
    doses: [],
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update state helper
  const updateState = useCallback((updates: Partial<MedicationState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date(),
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Handle API errors with senior-friendly messages
  const handleApiError = useCallback((error: string): string => {
    if (error.includes('Failed to fetch') || error.includes('Network')) {
      return 'No se puede conectar al servidor. Verifica tu conexión a internet.';
    }
    if (error.includes('timeout') || error.includes('tardó demasiado')) {
      return 'La solicitud tardó demasiado. Intenta nuevamente.';
    }
    if (error.includes('401') || error.includes('Unauthorized')) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    }
    if (error.includes('404') || error.includes('Not found')) {
      return 'No se encontró la información solicitada.';
    }
    if (error.includes('500') || error.includes('Internal')) {
      return 'Error del servidor. Intenta nuevamente en unos minutos.';
    }
    return error || 'Ha ocurrido un error inesperado.';
  }, []);

  // Search medication by QR code
  const searchMedicationByQR = useCallback(async (qrCode: string): Promise<Medication | null> => {
    if (!qrCode?.trim()) {
      updateState({ error: 'Código QR inválido' });
      return null;
    }

    updateState({ loading: true, error: null });

    try {
      // First try to search by exact code
      let response = await apiService.searchMedicationByCode(qrCode);
      
      if (!response.success) {
        // If direct search fails, try processing as QR with patient context
        if (patientId) {
          const qrResponse = await apiService.processMedicationQR(qrCode, patientId);
          if (qrResponse.success && qrResponse.data?.medication) {
            const medication = qrResponse.data.medication;
            
            // Update local state with new medication
            updateState({ 
              medications: prev => {
                const existing = prev.medications.find(m => m.id === medication.id);
                if (existing) return prev;
                return { ...prev, medications: [...prev.medications, medication] };
              },
              loading: false 
            });
            
            return medication;
          }
        }
        
        // If all fails, show user-friendly error
        const errorMsg = handleApiError(response.error || 'Medicamento no encontrado');
        updateState({ error: errorMsg, loading: false });
        return null;
      }

      const medication = response.data;
      
      // Update local medications cache
      updateState({ 
        medications: prev => {
          const existing = prev.medications.find(m => m.id === medication.id);
          if (existing) return prev;
          return { ...prev, medications: [...prev.medications, medication] };
        },
        loading: false 
      });

      return medication;

    } catch (error) {
      const errorMsg = handleApiError(error instanceof Error ? error.message : 'Error desconocido');
      updateState({ error: errorMsg, loading: false });
      return null;
    }
  }, [patientId, updateState, handleApiError]);

  // Get medication details
  const getMedicationDetails = useCallback(async (id: string): Promise<Medication | null> => {
    if (!id) {
      updateState({ error: 'ID de medicamento requerido' });
      return null;
    }

    updateState({ loading: true, error: null });

    try {
      const response = await apiService.getMedicationById(id);
      
      if (!response.success) {
        const errorMsg = handleApiError(response.error || 'Error al obtener detalles del medicamento');
        updateState({ error: errorMsg, loading: false });
        return null;
      }

      const medication = response.data;
      
      // Update local cache
      updateState({ 
        medications: prev => {
          const index = prev.medications.findIndex(m => m.id === medication.id);
          if (index >= 0) {
            const updated = [...prev.medications];
            updated[index] = medication;
            return { ...prev, medications: updated };
          }
          return { ...prev, medications: [...prev.medications, medication] };
        },
        loading: false 
      });

      return medication;

    } catch (error) {
      const errorMsg = handleApiError(error instanceof Error ? error.message : 'Error desconocido');
      updateState({ error: errorMsg, loading: false });
      return null;
    }
  }, [updateState, handleApiError]);

  // Mark dose as taken
  const markDoseAsTaken = useCallback(async (scheduleId: string): Promise<boolean> => {
    if (!scheduleId) {
      updateState({ error: 'ID de horario requerido' });
      return false;
    }

    updateState({ loading: true, error: null });

    try {
      const response = await apiService.markDoseAsTaken(scheduleId);
      
      if (!response.success) {
        const errorMsg = handleApiError(response.error || 'Error al marcar dosis como tomada');
        updateState({ error: errorMsg, loading: false });
        return false;
      }

      const doseRecord = response.data;
      
      // Update local state
      updateState({ 
        doses: prev => [...prev.doses, doseRecord],
        schedules: prev => prev.schedules.map(schedule => 
          schedule.id === scheduleId 
            ? { ...schedule, lastTaken: new Date() }
            : schedule
        ),
        loading: false 
      });

      // Show success feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }

      return true;

    } catch (error) {
      const errorMsg = handleApiError(error instanceof Error ? error.message : 'Error desconocido');
      updateState({ error: errorMsg, loading: false });
      return false;
    }
  }, [updateState, handleApiError]);

  // Mark dose as skipped
  const markDoseAsSkipped = useCallback(async (scheduleId: string, reason?: string): Promise<boolean> => {
    if (!scheduleId) {
      updateState({ error: 'ID de horario requerido' });
      return false;
    }

    updateState({ loading: true, error: null });

    try {
      const response = await apiService.markDoseAsSkipped(scheduleId, reason);
      
      if (!response.success) {
        const errorMsg = handleApiError(response.error || 'Error al marcar dosis como omitida');
        updateState({ error: errorMsg, loading: false });
        return false;
      }

      const doseRecord = response.data;
      
      // Update local state
      updateState({ 
        doses: prev => [...prev.doses, doseRecord],
        loading: false 
      });

      return true;

    } catch (error) {
      const errorMsg = handleApiError(error instanceof Error ? error.message : 'Error desconocido');
      updateState({ error: errorMsg, loading: false });
      return false;
    }
  }, [updateState, handleApiError]);

  // Load patient schedule
  const loadPatientSchedule = useCallback(async (patientId: string, date?: string): Promise<void> => {
    if (!patientId) {
      updateState({ error: 'ID de paciente requerido' });
      return;
    }

    updateState({ loading: true, error: null });

    try {
      const response = await apiService.getPatientSchedule(patientId, date);
      
      if (!response.success) {
        const errorMsg = handleApiError(response.error || 'Error al cargar horario de medicamentos');
        updateState({ error: errorMsg, loading: false });
        return;
      }

      const schedules = response.data || [];
      
      updateState({ 
        schedules,
        loading: false 
      });

    } catch (error) {
      const errorMsg = handleApiError(error instanceof Error ? error.message : 'Error desconocido');
      updateState({ error: errorMsg, loading: false });
    }
  }, [updateState, handleApiError]);

  // Refresh all data
  const refreshData = useCallback(async (): Promise<void> => {
    if (!patientId) return;

    updateState({ loading: true, error: null });

    try {
      // Load schedule for today
      const today = new Date().toISOString().split('T')[0];
      await loadPatientSchedule(patientId, today);
      
      // Load recent dose history
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const doseResponse = await apiService.getDoseHistory(
        patientId,
        weekAgo.toISOString().split('T')[0],
        today
      );
      
      if (doseResponse.success) {
        updateState({ 
          doses: doseResponse.data || [],
          loading: false 
        });
      }

    } catch (error) {
      const errorMsg = handleApiError(error instanceof Error ? error.message : 'Error al actualizar datos');
      updateState({ error: errorMsg, loading: false });
    }
  }, [patientId, loadPatientSchedule, updateState, handleApiError]);

  // Auto-refresh data when patient ID changes
  useEffect(() => {
    if (patientId && !isOffline) {
      refreshData();
    }
  }, [patientId, isOffline, refreshData]);

  return {
    state,
    searchMedicationByQR,
    getMedicationDetails,
    markDoseAsTaken,
    markDoseAsSkipped,
    loadPatientSchedule,
    refreshData,
    clearError,
    isOffline,
  };
}