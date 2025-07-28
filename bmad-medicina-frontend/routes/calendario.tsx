/**
 * BMad - Medication Calendar Page
 * Full calendar view for medication schedule management
 * Optimized for seniors with accessibility features
 */

import { useState, useEffect } from "preact/hooks";
import MedicationCalendar from "../islands/MedicationCalendar.tsx";

interface MedicationScheduleItem {
  id: string;
  medicationName: string;
  time: string;
  dosage: string;
  status: 'due' | 'taken' | 'missed' | 'upcoming';
  instructions?: string;
  color: string;
}

export default function CalendarioPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notifications, setNotifications] = useState<'default' | 'granted' | 'denied'>('default');
  const [medications, setMedications] = useState<MedicationScheduleItem[]>([]);

  // Request notification permissions on page load
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotifications(permission as 'granted' | 'denied');
        });
      } else {
        setNotifications(Notification.permission as 'granted' | 'denied');
      }
    }
  }, []);

  // Mock medication data - would come from API in real app
  useEffect(() => {
    const mockMedications: MedicationScheduleItem[] = [
      {
        id: '1',
        medicationName: 'Aspirina',
        time: '08:00',
        dosage: '100mg',
        status: 'due',
        instructions: 'Tomar con el desayuno',
        color: '#fbbf24',
      },
      {
        id: '2',
        medicationName: 'Metformina',
        time: '08:30',
        dosage: '500mg',
        status: 'taken',
        instructions: 'Después de comer',
        color: '#f59e0b',
      },
      {
        id: '3',
        medicationName: 'Losartán',
        time: '12:00',
        dosage: '50mg',
        status: 'upcoming',
        instructions: 'Con o sin comida',
        color: '#3b82f6',
      },
      {
        id: '4',
        medicationName: 'Simvastatina',
        time: '20:00',
        dosage: '20mg',
        status: 'upcoming',
        instructions: 'Tomar en la noche',
        color: '#7c3aed',
      },
      {
        id: '5',
        medicationName: 'Omeprazol',
        time: '07:30',
        dosage: '20mg',
        status: 'missed',
        instructions: 'Antes del desayuno',
        color: '#ef4444',
      },
    ];

    setMedications(mockMedications);
  }, [selectedDate]);

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    // In real app, would fetch medications for new date
  };

  const handleMedicationClick = (medicationId: string) => {
    const medication = medications.find(m => m.id === medicationId);
    if (medication) {
      alert(`Información de ${medication.medicationName}:\n\nDosis: ${medication.dosage}\nHora: ${medication.time}\nInstrucciones: ${medication.instructions || 'No hay instrucciones específicas'}`);
    }
  };

  const handleMarkAsTaken = (medicationId: string) => {
    setMedications(prev => 
      prev.map(med => 
        med.id === medicationId 
          ? { ...med, status: 'taken' as const }
          : med
      )
    );

    // Show success message
    const medication = medications.find(m => m.id === medicationId);
    if (medication) {
      // Show visual confirmation
      const successMessage = document.createElement('div');
      successMessage.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: var(--color-success-500);
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 600;
          z-index: 1000;
          box-shadow: var(--shadow-card);
        ">
          ✅ ${medication.medicationName} marcado como tomado
        </div>
      `;
      
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    }
  };

  const handlePlayAudioAlert = (medicationId: string) => {
    // Create audio context for medication alert
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a simple beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Repeat the beep 3 times
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator2.type = 'sine';
      
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.5);
    }, 600);

    setTimeout(() => {
      const oscillator3 = audioContext.createOscillator();
      const gainNode3 = audioContext.createGain();
      
      oscillator3.connect(gainNode3);
      gainNode3.connect(audioContext.destination);
      
      oscillator3.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator3.type = 'sine';
      
      gainNode3.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator3.start(audioContext.currentTime);
      oscillator3.stop(audioContext.currentTime + 0.5);
    }, 1200);
  };

  const enableNotifications = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotifications(permission as 'granted' | 'denied');
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const dueMedicationsCount = medications.filter(m => m.status === 'due').length;
  const missedMedicationsCount = medications.filter(m => m.status === 'missed').length;

  return (
    <div class="container py-xl">
      {/* Header */}
      <header class="text-center mb-2xl">
        <h1 class="text-4xl font-bold mb-md text-primary">
          📅 Calendario de Medicamentos
        </h1>
        <p class="text-lg text-secondary mb-lg">
          Seguimiento diario de tu plan de medicamentos
        </p>

        {/* Quick stats */}
        <div class="flex justify-center gap-lg mb-lg">
          {dueMedicationsCount > 0 && (
            <div class="stat-card bg-warning text-white">
              <span class="text-2xl font-bold">{dueMedicationsCount}</span>
              <span class="text-sm">Pendientes</span>
            </div>
          )}
          
          {missedMedicationsCount > 0 && (
            <div class="stat-card bg-error text-white">
              <span class="text-2xl font-bold">{missedMedicationsCount}</span>
              <span class="text-sm">Atrasados</span>
            </div>
          )}
          
          <div class="stat-card bg-success text-white">
            <span class="text-2xl font-bold">
              {medications.filter(m => m.status === 'taken').length}
            </span>
            <span class="text-sm">Tomados</span>
          </div>
        </div>

        {/* Quick actions */}
        <div class="flex justify-center gap-md flex-wrap">
          <button
            class="button button-primary"
            onClick={goToToday}
          >
            📍 Ir a Hoy
          </button>
          
          <a href="/" class="button button-secondary">
            🏠 Inicio
          </a>
          
          {notifications !== 'granted' && (
            <button
              class="button button-warning"
              onClick={enableNotifications}
            >
              🔔 Activar Alertas
            </button>
          )}
        </div>
      </header>

      {/* Notification permission alert */}
      {notifications === 'denied' && (
        <div class="card bg-warning text-white mb-lg max-w-lg mx-auto" role="alert">
          <h3 class="text-lg font-semibold mb-sm">
            ⚠️ Alertas Desactivadas
          </h3>
          <p class="text-base mb-md">
            Las notificaciones están desactivadas. Para recibir recordatorios de medicamentos, 
            activa las notificaciones en la configuración de tu navegador.
          </p>
          <button 
            class="button bg-white text-warning"
            onClick={() => {
              alert('Ve a Configuración > Sitios web > Notificaciones y permite las notificaciones para este sitio.');
            }}
          >
            ¿Cómo Activar?
          </button>
        </div>
      )}

      {/* Main Calendar */}
      <main>
        <MedicationCalendar
          date={selectedDate}
          medications={medications}
          onDateChange={handleDateChange}
          onMedicationClick={handleMedicationClick}
          onMarkAsTaken={handleMarkAsTaken}
          onPlayAudioAlert={handlePlayAudioAlert}
          enableAudioAlerts={true}
          enableVibration={true}
          class="mb-2xl"
        />
      </main>

      {/* Footer actions */}
      <footer class="text-center">
        <div class="flex justify-center gap-md flex-wrap">
          <button class="button button-secondary">
            📊 Ver Estadísticas
          </button>
          
          <button class="button button-secondary">
            ⚙️ Configurar Recordatorios
          </button>
          
          <button class="button button-error">
            🚨 Emergencia
          </button>
        </div>
        
        <p class="text-sm text-secondary mt-lg">
          En caso de dudas sobre tus medicamentos, consulta con tu médico o farmacéutico.
        </p>
      </footer>

      {/* Custom styles */}
      <style jsx>{`
        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-md) var(--spacing-lg);
          border-radius: 8px;
          min-width: 80px;
          box-shadow: var(--shadow-card);
        }

        .stat-card span:first-child {
          line-height: 1;
          margin-bottom: var(--spacing-xs);
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .stat-card {
            min-width: 70px;
            padding: var(--spacing-sm) var(--spacing-md);
          }
          
          .stat-card span:first-child {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}