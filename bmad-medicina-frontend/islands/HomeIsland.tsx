/**
 * BMad - Home Island Component
 * Interactive home page with QR scanner and medication management
 * Optimized for Chilean seniors aged 60-85+
 */

import { useState, useEffect } from "preact/hooks";
import QRScanner from "./QRScanner.tsx";
import { useMedication } from "../lib/hooks/useMedication.ts";
import { apiService } from "../lib/services/api.ts";

export default function HomeIsland() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [currentPatientId, setCurrentPatientId] = useState<string>('patient-demo-001'); // Demo patient ID
  const [medicationInfo, setMedicationInfo] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Initialize medication hook
  const {
    state: medicationState,
    searchMedicationByQR,
    markDoseAsTaken,
    refreshData,
    clearError,
    isOffline,
  } = useMedication(currentPatientId);

  // Check backend server status on load
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await apiService.healthCheck();
        setServerStatus(response.success ? 'online' : 'offline');
      } catch (error) {
        setServerStatus('offline');
      }
    };

    checkServerStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async (result: string) => {
    console.log('QR Scan result:', result);
    setScanResult(result);
    setScanError(null);
    setIsScanning(false);
    
    // Search medication in backend database
    setMedicationInfo(null);
    const medication = await searchMedicationByQR(result);
    
    if (medication) {
      setMedicationInfo(medication);
      console.log('Medication found:', medication);
    } else {
      // Error handling is managed by the hook
      if (medicationState.error) {
        setScanError(medicationState.error);
      }
    }
  };

  const handleScanError = (error: string) => {
    console.error('QR Scan error:', error);
    setScanError(error);
    setScanResult(null);
  };

  const handlePermissionDenied = () => {
    setScanError('Se necesita permiso de cámara para escanear medicamentos. Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
  };

  const startScanning = () => {
    setScanResult(null);
    setScanError(null);
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  // Handle medication actions
  const handleTakeMedication = async (medicationId: string) => {
    const success = await markDoseAsTaken(medicationId);
    if (success) {
      console.log('Medication marked as taken:', medicationId);
    }
  };

  return (
    <div class="container py-xl">
      {/* Server Status Indicator */}
      <div class="server-status-container mb-lg">
        <div class={`server-status ${serverStatus}`}>
          <span class="status-indicator"></span>
          <span class="status-text">
            {serverStatus === 'checking' ? 'Verificando servidor...' :
             serverStatus === 'online' ? '🟢 Backend Conectado' :
             '🔴 Backend Desconectado - Modo offline'}
          </span>
          {serverStatus === 'online' && (
            <span class="server-url text-sm">http://localhost:8080</span>
          )}
        </div>
      </div>

      {/* Header */}
      <header class="text-center mb-2xl">
        <h1 class="text-4xl font-bold mb-md text-primary">
          🏥 BMad Medicamentos
        </h1>
        <p class="text-lg text-secondary">
          Tu asistente personal para el seguimiento de medicamentos
        </p>
        {medicationState.loading && (
          <p class="text-base text-warning">
            ⏳ Consultando base de datos...
          </p>
        )}
        {medicationState.error && (
          <div class="error-banner bg-error text-white p-md rounded mb-md">
            ⚠️ {medicationState.error}
            <button 
              class="ml-md text-sm underline"
              onClick={clearError}
            >
              Cerrar
            </button>
          </div>
        )}
      </header>

      {/* Quick Actions */}
      <section class="mb-2xl">
        <h2 class="text-2xl font-semibold mb-lg text-center">
          Acciones Rápidas
        </h2>
        
        <div class="flex flex-col gap-md max-w-lg mx-auto">
          <button
            class="button button-primary button-large w-full"
            onClick={startScanning}
            aria-label="Escanear código QR del medicamento"
          >
            📱 Escanear Medicamento
          </button>
          
          <a href="/calendario" class="button button-secondary button-large w-full">
            📋 Ver Mis Medicamentos
          </a>
          
          <a href="/calendario" class="button button-secondary button-large w-full">
            ⏰ Calendario Diario
          </a>
          
          <button class="button button-warning button-large w-full">
            🚨 Emergencia
          </button>
        </div>
      </section>

      {/* QR Scanner Modal/Section */}
      {isScanning && (
        <section class="mb-2xl">
          <div class="card max-w-lg mx-auto">
            <div class="flex justify-between items-center mb-lg">
              <h3 class="text-xl font-semibold">
                Escanear Medicamento
              </h3>
              <button
                class="button button-error"
                onClick={stopScanning}
                aria-label="Cerrar escáner"
              >
                ✕ Cerrar
              </button>
            </div>
            
            <QRScanner
              onScan={handleScan}
              onError={handleScanError}
              onPermissionDenied={handlePermissionDenied}
              isActive={isScanning}
              showViewfinder={true}
              scanDelay={1000}
            />
          </div>
        </section>
      )}

      {/* Scan Results */}
      {scanResult && medicationInfo && (
        <section class="mb-2xl">
          <div class="card max-w-lg mx-auto bg-success text-white">
            <h3 class="text-xl font-semibold mb-md">
              ✅ Medicamento Encontrado
            </h3>
            <div class="medication-details mb-lg">
              <h4 class="text-lg font-bold mb-sm">
                {medicationInfo.name}
              </h4>
              {medicationInfo.genericName && (
                <p class="text-base mb-sm">
                  <strong>Genérico:</strong> {medicationInfo.genericName}
                </p>
              )}
              <p class="text-base mb-sm">
                <strong>Dosis:</strong> {medicationInfo.dosage}
              </p>
              <p class="text-base mb-sm">
                <strong>Forma:</strong> {medicationInfo.form}
              </p>
              {medicationInfo.manufacturer && (
                <p class="text-base mb-sm">
                  <strong>Laboratorio:</strong> {medicationInfo.manufacturer}
                </p>
              )}
              {medicationInfo.expirationDate && (
                <p class="text-base mb-sm">
                  <strong>Vencimiento:</strong> {new Date(medicationInfo.expirationDate).toLocaleDateString('es-CL')}
                </p>
              )}
              <p class="text-sm mt-md">
                <strong>Código QR:</strong> {scanResult}
              </p>
            </div>
            <div class="flex gap-md">
              <button
                class="button bg-white text-success hover:bg-gray"
                onClick={() => {
                  setScanResult(null);
                  setMedicationInfo(null);
                }}
              >
                Escanear Otro
              </button>
              <button
                class="button bg-white text-success hover:bg-gray"
                onClick={() => {
                  // TODO: Add to medication schedule
                  alert('Función de agregar al horario próximamente');
                }}
              >
                Agregar al Horario
              </button>
            </div>
          </div>
        </section>
      )}

      {/* QR Code only (no medication found) */}
      {scanResult && !medicationInfo && !medicationState.loading && (
        <section class="mb-2xl">
          <div class="card max-w-lg mx-auto bg-warning text-white">
            <h3 class="text-xl font-semibold mb-md">
              ⚠️ Código Escaneado
            </h3>
            <p class="text-lg mb-md">
              Código: <code class="font-mono bg-white text-black px-sm py-xs rounded">
                {scanResult}
              </code>
            </p>
            <p class="mb-lg">
              No se encontró información de este medicamento en la base de datos.
            </p>
            <div class="flex gap-md">
              <button
                class="button bg-white text-warning hover:bg-gray"
                onClick={() => setScanResult(null)}
              >
                Escanear Otro
              </button>
              <button
                class="button bg-white text-warning hover:bg-gray"
                onClick={() => {
                  // TODO: Manual medication entry
                  alert('Función de ingreso manual próximamente');
                }}
              >
                Ingresar Manual
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Scan Errors */}
      {scanError && (
        <section class="mb-2xl">
          <div class="card max-w-lg mx-auto bg-error text-white" role="alert">
            <h3 class="text-xl font-semibold mb-md">
              ⚠️ Error de Escaneo
            </h3>
            <p class="text-lg mb-lg">
              {scanError}
            </p>
            <div class="flex gap-md">
              <button
                class="button bg-white text-error hover:bg-gray"
                onClick={() => setScanError(null)}
              >
                Entendido
              </button>
              <button
                class="button bg-white text-error hover:bg-gray"
                onClick={() => {
                  setScanError(null);
                  startScanning();
                }}
              >
                Intentar Nuevamente
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Today's Medications */}
      <section class="mb-2xl">
        <h2 class="text-2xl font-semibold mb-lg text-center">
          Medicamentos de Hoy
        </h2>
        
        {medicationState.schedules.length > 0 ? (
          <div class="space-y-md max-w-lg mx-auto">
            {medicationState.schedules.map((schedule) => (
              <div
                key={schedule.id}
                class={`card flex justify-between items-center p-lg ${
                  schedule.status === 'due' ? 'border-2 border-warning bg-warning/10' :
                  schedule.status === 'taken' ? 'border-2 border-success bg-success/10' :
                  'border border-gray-300'
                }`}
              >
                <div class="flex-1">
                  <h3 class="text-xl font-semibold mb-xs">
                    {schedule.medicationName || 'Medicamento'}
                  </h3>
                  <p class="text-lg text-secondary mb-xs">
                    Dosis: {schedule.dosage}
                  </p>
                  <p class="text-base text-secondary">
                    Horario: {schedule.times?.join(', ') || 'No definido'}
                  </p>
                  {schedule.instructions && (
                    <p class="text-sm text-secondary mt-xs">
                      {schedule.instructions}
                    </p>
                  )}
                </div>
                
                <div class="flex flex-col gap-sm ml-md">
                  <button 
                    class="button button-success"
                    onClick={() => handleTakeMedication(schedule.id)}
                    disabled={medicationState.loading}
                  >
                    ✅ Tomado
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div class="text-center">
            <p class="text-lg text-secondary mb-md">
              {medicationState.loading ? 
                '⏳ Cargando medicamentos...' :
                serverStatus === 'offline' ?
                '🔴 Sin conexión - No se pueden cargar medicamentos' :
                '📝 No hay medicamentos programados para hoy'
              }
            </p>
            {serverStatus === 'offline' && (
              <button 
                class="button button-primary"
                onClick={() => window.location.reload()}
              >
                🔄 Reintentar Conexión
              </button>
            )}
          </div>
        )}
      </section>

      {/* Help Section */}
      <section class="text-center">
        <h2 class="text-2xl font-semibold mb-lg">
          ¿Necesitas Ayuda?
        </h2>
        
        <div class="flex flex-col gap-md max-w-md mx-auto">
          <button class="button button-secondary">
            📞 Llamar a Familia
          </button>
          
          <button class="button button-secondary">
            🏥 Contactar Médico
          </button>
          
          <button class="button button-secondary">
            ❓ Tutorial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer class="text-center mt-2xl pt-xl border-t border-gray-200">
        <p class="text-base text-secondary">
          BMad - Sistema de Adherencia Medicamentos
        </p>
        <p class="text-sm text-secondary mt-sm">
          Diseñado especialmente para adultos mayores
        </p>
      </footer>

      {/* Custom styles */}
      <style jsx>{`
        .space-y-md > * + * {
          margin-top: var(--spacing-md);
        }

        .server-status-container {
          display: flex;
          justify-content: center;
        }

        .server-status {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: 6px;
          font-size: var(--font-size-sm);
          font-weight: 500;
        }

        .server-status.checking {
          background: #f3f4f6;
          color: #6b7280;
        }

        .server-status.online {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .server-status.offline {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .server-status.checking .status-indicator {
          background: #9ca3af;
          animation: pulse 2s infinite;
        }

        .server-status.online .status-indicator {
          background: #22c55e;
        }

        .server-status.offline .status-indicator {
          background: #f59e0b;
          animation: pulse 2s infinite;
        }

        .server-url {
          margin-left: var(--spacing-sm);
          font-family: var(--font-family-mono);
          background: rgba(255, 255, 255, 0.7);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .error-banner {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .medication-details h4 {
          margin-bottom: var(--spacing-sm);
        }

        .medication-details p {
          margin-bottom: var(--spacing-xs);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .server-status {
            flex-direction: column;
            text-align: center;
            gap: var(--spacing-xs);
          }
          
          .error-banner {
            flex-direction: column;
            gap: var(--spacing-sm);
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}