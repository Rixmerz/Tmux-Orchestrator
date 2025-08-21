/**
 * BMad - Medication Calendar Island Component
 * Visual calendar with medication schedule and alerts
 * Optimized for seniors with large touch targets and clear visual indicators
 */

import { useState, useEffect, useRef } from 'preact/hooks';
import { CalendarProps } from '../lib/types/ui.ts';

interface MedicationScheduleItem {
  id: string;
  medicationName: string;
  time: string;
  dosage: string;
  status: 'due' | 'taken' | 'missed' | 'upcoming';
  instructions?: string;
  color: string;
}

interface MedicationCalendarProps {
  date: Date;
  medications: MedicationScheduleItem[];
  onDateChange: (date: Date) => void;
  onMedicationClick: (medicationId: string) => void;
  onMarkAsTaken?: (medicationId: string) => void;
  onPlayAudioAlert?: (medicationId: string) => void;
  view?: 'day' | 'week';
  class?: string;
  enableAudioAlerts?: boolean;
  enableVibration?: boolean;
}

export default function MedicationCalendar({
  date,
  medications,
  onDateChange,
  onMedicationClick,
  onMarkAsTaken,
  onPlayAudioAlert,
  view = 'day',
  class: className = '',
  enableAudioAlerts = true,
  enableVibration = true,
}: MedicationCalendarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertedMedications, setAlertedMedications] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioSupported, setAudioSupported] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Check for due medications and trigger alerts
  useEffect(() => {
    const now = new Date();
    const currentTimeStr = now.toTimeString().substring(0, 5); // "HH:MM"

    medications.forEach(med => {
      if (
        med.status === 'due' && 
        med.time === currentTimeStr &&
        !alertedMedications.has(med.id)
      ) {
        triggerAlert(med);
        setAlertedMedications(prev => new Set(prev).add(med.id));
      }
    });
  }, [currentTime, medications, alertedMedications]);

  // Check audio support
  useEffect(() => {
    const audio = document.createElement('audio');
    setAudioSupported(!!audio.canPlayType);
  }, []);

  // Trigger medication alert
  const triggerAlert = (medication: MedicationScheduleItem) => {
    // Visual alert - browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`💊 Hora del Medicamento: ${medication.medicationName}`, {
        body: `Es hora de tomar ${medication.dosage} - ${medication.time}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        tag: `medication-${medication.id}`,
      });
    }

    // Audio alert
    if (enableAudioAlerts && onPlayAudioAlert) {
      onPlayAudioAlert(medication.id);
    }

    // Vibration alert
    if (enableVibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Visual flash effect
    const calendarElement = document.querySelector('.medication-calendar');
    if (calendarElement) {
      calendarElement.classList.add('alert-flash');
      setTimeout(() => {
        calendarElement.classList.remove('alert-flash');
      }, 1000);
    }
  };

  // Navigate to previous/next day
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    onDateChange(newDate);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'due':
        return { icon: '⏰', color: 'var(--color-warning-500)', bgColor: 'var(--color-warning-500)' };
      case 'taken':
        return { icon: '✅', color: 'var(--color-success-500)', bgColor: 'var(--color-success-500)' };
      case 'missed':
        return { icon: '❌', color: 'var(--color-error-500)', bgColor: 'var(--color-error-500)' };
      case 'upcoming':
        return { icon: '📅', color: 'var(--color-primary-500)', bgColor: 'var(--color-primary-500)' };
      default:
        return { icon: '💊', color: 'var(--color-text-secondary)', bgColor: 'var(--color-text-secondary)' };
    }
  };

  // Get medications sorted by time
  const sortedMedications = [...medications].sort((a, b) => a.time.localeCompare(b.time));

  // Group medications by time period
  const groupMedicationsByPeriod = (meds: MedicationScheduleItem[]) => {
    const periods = {
      morning: { label: 'Mañana (6:00 - 11:59)', meds: [] as MedicationScheduleItem[] },
      afternoon: { label: 'Tarde (12:00 - 17:59)', meds: [] as MedicationScheduleItem[] },
      evening: { label: 'Noche (18:00 - 23:59)', meds: [] as MedicationScheduleItem[] },
      night: { label: 'Madrugada (0:00 - 5:59)', meds: [] as MedicationScheduleItem[] },
    };

    meds.forEach(med => {
      const hour = parseInt(med.time.split(':')[0]);
      if (hour >= 6 && hour < 12) {
        periods.morning.meds.push(med);
      } else if (hour >= 12 && hour < 18) {
        periods.afternoon.meds.push(med);
      } else if (hour >= 18) {
        periods.evening.meds.push(med);
      } else {
        periods.night.meds.push(med);
      }
    });

    return periods;
  };

  const medicationPeriods = groupMedicationsByPeriod(sortedMedications);

  // Handle medication action
  const handleMedicationAction = (medicationId: string, action: 'take' | 'view') => {
    if (action === 'take' && onMarkAsTaken) {
      onMarkAsTaken(medicationId);
      // Remove from alerted medications
      setAlertedMedications(prev => {
        const newSet = new Set(prev);
        newSet.delete(medicationId);
        return newSet;
      });
    } else {
      onMedicationClick(medicationId);
    }
  };

  return (
    <div class={`medication-calendar ${className}`}>
      {/* Header with date navigation */}
      <div class="calendar-header">
        <button
          class="button button-secondary"
          onClick={() => navigateDay('prev')}
          aria-label="Día anterior"
        >
          ← Anterior
        </button>
        
        <div class="date-display">
          <h2 class="text-2xl font-bold text-center">
            {formatDate(date)}
          </h2>
          <p class="text-lg text-secondary text-center mt-xs">
            Hora actual: {currentTime.toLocaleTimeString('es-CL', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
        
        <button
          class="button button-secondary"
          onClick={() => navigateDay('next')}
          aria-label="Día siguiente"
        >
          Siguiente →
        </button>
      </div>

      {/* Medication schedule by periods */}
      <div class="schedule-container">
        {Object.entries(medicationPeriods).map(([periodKey, period]) => {
          if (period.meds.length === 0) return null;

          return (
            <div key={periodKey} class={`period-section period-${periodKey}`}>
              <h3 class="period-title text-xl font-semibold mb-md">
                {period.label}
              </h3>
              
              <div class="medications-list">
                {period.meds.map((medication) => {
                  const statusDisplay = getStatusDisplay(medication.status);
                  
                  return (
                    <div
                      key={medication.id}
                      class={`medication-item ${medication.status === 'due' ? 'medication-due' : ''}`}
                      onClick={() => handleMedicationAction(medication.id, 'view')}
                      role="button"
                      tabIndex={0}
                      aria-label={`Medicamento ${medication.medicationName} a las ${formatTime(medication.time)}`}
                    >
                      <div class="medication-info">
                        <div class="medication-header">
                          <span class="status-icon" style={{ color: statusDisplay.color }}>
                            {statusDisplay.icon}
                          </span>
                          <h4 class="medication-name text-lg font-semibold">
                            {medication.medicationName}
                          </h4>
                          <span class="medication-time text-base font-medium">
                            {formatTime(medication.time)}
                          </span>
                        </div>
                        
                        <p class="medication-dosage text-base text-secondary">
                          Dosis: {medication.dosage}
                        </p>
                        
                        {medication.instructions && (
                          <p class="medication-instructions text-sm text-secondary">
                            {medication.instructions}
                          </p>
                        )}
                      </div>
                      
                      <div class="medication-actions">
                        {medication.status === 'due' && onMarkAsTaken && (
                          <button
                            class="button button-success button-large"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMedicationAction(medication.id, 'take');
                            }}
                            aria-label={`Marcar como tomado: ${medication.medicationName}`}
                          >
                            ✅ Tomado
                          </button>
                        )}
                        
                        {medication.status === 'missed' && (
                          <button
                            class="button button-warning button-large"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMedicationAction(medication.id, 'take');
                            }}
                            aria-label={`Tomar ahora: ${medication.medicationName}`}
                          >
                            💊 Tomar Ahora
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency alert for overdue medications */}
      {medications.some(med => med.status === 'missed') && (
        <div class="emergency-alert" role="alert">
          <div class="alert-content">
            <span class="alert-icon">🚨</span>
            <div class="alert-text">
              <h3 class="text-lg font-bold text-error">
                Medicamentos Pendientes
              </h3>
              <p class="text-base">
                Tienes {medications.filter(m => m.status === 'missed').length} medicamento(s) pendiente(s).
                Consulta con tu médico si es seguro tomarlos ahora.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for alerts */}
      {audioSupported && (
        <audio ref={audioRef} preload="auto">
          {/* You would add actual audio file sources here */}
          <source src="/audio/medication-alert.mp3" type="audio/mpeg" />
          <source src="/audio/medication-alert.ogg" type="audio/ogg" />
        </audio>
      )}

      {/* Styles */}
      <style jsx>{`
        .medication-calendar {
          max-width: 800px;
          margin: 0 auto;
          background: var(--color-bg-primary);
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          overflow: hidden;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border-light);
          gap: var(--spacing-md);
        }

        .date-display {
          flex: 1;
          min-width: 200px;
        }

        .schedule-container {
          padding: var(--spacing-lg);
        }

        .period-section {
          margin-bottom: var(--spacing-2xl);
        }

        .period-section:last-child {
          margin-bottom: 0;
        }

        .period-title {
          color: var(--color-text-primary);
          border-bottom: 2px solid var(--color-primary-500);
          padding-bottom: var(--spacing-sm);
        }

        .period-morning .period-title {
          border-color: var(--color-med-morning);
        }

        .period-afternoon .period-title {
          border-color: var(--color-med-afternoon);
        }

        .period-evening .period-title {
          border-color: var(--color-med-evening);
        }

        .period-night .period-title {
          border-color: var(--color-med-night);
        }

        .medications-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .medication-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          background: var(--color-bg-primary);
          border: 2px solid var(--color-border-light);
          border-radius: 8px;
          cursor: pointer;
          transition: all var(--duration-normal) ease;
          min-height: var(--touch-target-large);
        }

        .medication-item:hover {
          border-color: var(--color-primary-500);
          box-shadow: var(--shadow-button);
        }

        .medication-item:focus {
          outline: none;
          box-shadow: var(--shadow-focus);
        }

        .medication-due {
          border-color: var(--color-warning-500);
          background: rgba(245, 158, 11, 0.1);
          animation: pulse-warning 2s infinite;
        }

        @keyframes pulse-warning {
          0%, 100% { 
            border-color: var(--color-warning-500);
            background: rgba(245, 158, 11, 0.1);
          }
          50% { 
            border-color: var(--color-warning-600);
            background: rgba(245, 158, 11, 0.2);
          }
        }

        .medication-info {
          flex: 1;
        }

        .medication-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xs);
        }

        .status-icon {
          font-size: 1.5rem;
          line-height: 1;
        }

        .medication-name {
          flex: 1;
          color: var(--color-text-primary);
        }

        .medication-time {
          color: var(--color-text-secondary);
          font-family: var(--font-family-mono);
          background: var(--color-bg-secondary);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: 4px;
        }

        .medication-dosage {
          margin-bottom: var(--spacing-xs);
        }

        .medication-instructions {
          font-style: italic;
        }

        .medication-actions {
          margin-left: var(--spacing-md);
        }

        .emergency-alert {
          margin: var(--spacing-lg);
          padding: var(--spacing-lg);
          background: rgba(239, 68, 68, 0.1);
          border: 2px solid var(--color-error-500);
          border-radius: 8px;
          animation: pulse-error 3s infinite;
        }

        @keyframes pulse-error {
          0%, 100% { 
            border-color: var(--color-error-500);
            background: rgba(239, 68, 68, 0.1);
          }
          50% { 
            border-color: var(--color-error-600);
            background: rgba(239, 68, 68, 0.2);
          }
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .alert-icon {
          font-size: 2rem;
          animation: shake 0.5s infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }

        .alert-text h3 {
          margin-bottom: var(--spacing-xs);
        }

        /* Alert flash effect */
        .alert-flash {
          animation: flash-alert 1s ease-in-out;
        }

        @keyframes flash-alert {
          0%, 100% { background: var(--color-bg-primary); }
          50% { background: rgba(245, 158, 11, 0.3); }
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .calendar-header {
            flex-direction: column;
            gap: var(--spacing-sm);
          }

          .medication-item {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spacing-md);
          }

          .medication-actions {
            margin-left: 0;
            margin-top: var(--spacing-sm);
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .medication-item {
            border-width: 3px;
          }
          
          .medication-due {
            border-width: 4px;
          }
          
          .emergency-alert {
            border-width: 3px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .medication-due,
          .emergency-alert,
          .alert-icon,
          .alert-flash {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}