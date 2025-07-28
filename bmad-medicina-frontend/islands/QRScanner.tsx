/**
 * BMad - QR Scanner Island Component
 * WebRTC-based QR code scanner optimized for seniors
 * Large touch targets, clear error messages, accessibility compliant
 */

import { useState, useEffect, useRef } from 'preact/hooks';
import { QRScannerProps, CameraState, QRScanResult } from '../lib/types/ui.ts';

// QR Code detection using jsQR library
interface QRCode {
  data: string;
  location: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
  };
}

// Dynamic import for jsQR to handle client-side loading
let jsQRModule: any = null;

const loadJsQR = async () => {
  if (jsQRModule) return jsQRModule;
  
  try {
    // Load jsQR dynamically on the client
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.async = true;
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          jsQRModule = (window as any).jsQR;
          resolve(jsQRModule);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  } catch (error) {
    console.error('Failed to load jsQR:', error);
    return null;
  }
};

export default function QRScanner({
  onScan,
  onError,
  onPermissionDenied,
  isActive,
  width = 320,
  height = 240,
  facingMode = 'environment',
  showViewfinder = true,
  scanDelay = 500,
  class: className = '',
  'aria-label': ariaLabel = 'Escáner de código QR para medicamentos',
}: QRScannerProps) {
  const [cameraState, setCameraState] = useState<CameraState>({
    hasPermission: false,
    isActive: false,
    isSupported: false,
  });
  
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Check browser support for WebRTC and load jsQR
  useEffect(() => {
    const isSupported = !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.HTMLVideoElement &&
      window.HTMLCanvasElement
    );

    setCameraState(prev => ({
      ...prev,
      isSupported
    }));

    if (!isSupported) {
      onError('Su navegador no soporta el escáner de cámara. Por favor, use un navegador moderno.');
    } else {
      // Load jsQR library when component mounts
      loadJsQR().catch(error => {
        console.error('Failed to load QR scanner library:', error);
        onError('Error al cargar la biblioteca de escaneo QR.');
      });
    }
  }, [onError]);

  // Request camera permission and start stream
  const startCamera = async () => {
    if (!cameraState.isSupported) {
      onError('Cámara no soportada en este dispositivo');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: currentFacingMode,
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState(prev => ({
        ...prev,
        hasPermission: true,
        isActive: true,
        stream,
        error: undefined,
      }));

      // Start scanning after camera is ready
      startScanning();

    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Error desconocido al acceder a la cámara';
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Permiso de cámara denegado. Por favor, permita el acceso a la cámara.';
            onPermissionDenied();
            break;
          case 'NotFoundError':
            errorMessage = 'No se encontró una cámara en este dispositivo.';
            break;
          case 'NotReadableError':
            errorMessage = 'La cámara está siendo usada por otra aplicación.';
            break;
          case 'OverconstrainedError':
            errorMessage = 'La cámara no cumple con los requisitos necesarios.';
            break;
          case 'SecurityError':
            errorMessage = 'Error de seguridad al acceder a la cámara.';
            break;
          default:
            errorMessage = `Error de cámara: ${error.message}`;
        }
      }

      setCameraState(prev => ({
        ...prev,
        hasPermission: false,
        isActive: false,
        error: errorMessage,
      }));

      onError(errorMessage);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    stopScanning();

    setCameraState(prev => ({
      ...prev,
      isActive: false,
      stream: undefined,
    }));
  };

  // Start QR code scanning
  const startScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    setIsScanning(true);
    
    scanIntervalRef.current = setInterval(() => {
      scanForQRCode();
    }, scanDelay);
  };

  // Stop QR code scanning
  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  // Scan for QR codes in video frame
  const scanForQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !jsQRModule) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // Use jsQR library for QR detection
      const qrCode = jsQRModule(imageData.data, imageData.width, imageData.height);
      
      if (qrCode && qrCode.data) {
        const now = Date.now();
        
        // Prevent duplicate scans within scanDelay period
        if (now - lastScanTime > scanDelay) {
          setLastScanTime(now);
          onScan(qrCode.data);
          
          // Provide haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(100);
          }
          
          // Visual feedback - brief flash
          const overlay = document.querySelector('.viewfinder-overlay') as HTMLElement;
          if (overlay) {
            overlay.style.background = 'rgba(34, 197, 94, 0.3)';
            setTimeout(() => {
              overlay.style.background = 'rgba(0, 0, 0, 0.3)';
            }, 200);
          }
        }
      }
    } catch (error) {
      console.error('Error scanning QR code:', error);
    }
  };

  // Toggle between front and back camera
  const switchCamera = async () => {
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    setCurrentFacingMode(newFacingMode);
    
    if (cameraState.isActive) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  // Effect to handle isActive prop changes
  useEffect(() => {
    if (isActive && cameraState.isSupported) {
      startCamera();
    } else if (!isActive) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, currentFacingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!cameraState.isSupported) {
    return (
      <div class={`qr-scanner-error ${className}`} role="alert">
        <div class="error-content">
          <h3 class="text-xl font-semibold mb-md text-error">
            Cámara No Disponible
          </h3>
          <p class="text-lg mb-lg">
            Su dispositivo o navegador no soporta el escáner de cámara.
            Por favor, use un navegador moderno como Chrome, Firefox o Safari.
          </p>
          <button 
            class="button button-primary button-large"
            onClick={() => window.location.reload()}
          >
            Intentar Nuevamente
          </button>
        </div>
      </div>
    );
  }

  if (cameraState.error) {
    return (
      <div class={`qr-scanner-error ${className}`} role="alert">
        <div class="error-content">
          <h3 class="text-xl font-semibold mb-md text-error">
            Error de Cámara
          </h3>
          <p class="text-lg mb-lg">
            {cameraState.error}
          </p>
          <div class="flex gap-md">
            <button 
              class="button button-primary button-large"
              onClick={startCamera}
            >
              Intentar Nuevamente
            </button>
            <button 
              class="button button-secondary button-large"
              onClick={() => window.location.reload()}
            >
              Recargar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      class={`qr-scanner ${className}`}
      role="application"
      aria-label={ariaLabel}
    >
      {/* Video element for camera stream */}
      <div class="camera-container">
        <video
          ref={videoRef}
          class="camera-video"
          width={width}
          height={height}
          autoPlay
          muted
          playsInline
          aria-hidden="true"
        />
        
        {/* Viewfinder overlay */}
        {showViewfinder && (
          <div class="viewfinder-overlay">
            <div class="viewfinder-frame">
              <div class="viewfinder-corner top-left"></div>
              <div class="viewfinder-corner top-right"></div>
              <div class="viewfinder-corner bottom-left"></div>
              <div class="viewfinder-corner bottom-right"></div>
            </div>
            <p class="viewfinder-text text-lg font-medium">
              Apunte la cámara al código QR del medicamento
            </p>
          </div>
        )}

        {/* Scanning indicator */}
        {isScanning && (
          <div class="scanning-indicator" aria-live="polite">
            <div class="scanning-line"></div>
            <span class="sr-only">Escaneando código QR...</span>
          </div>
        )}
      </div>

      {/* Camera controls */}
      <div class="camera-controls">
        <button
          class="button button-secondary button-large"
          onClick={switchCamera}
          aria-label="Cambiar cámara"
          title="Cambiar entre cámara frontal y trasera"
        >
          🔄 Cambiar Cámara
        </button>
        
        <div class="camera-status">
          <span class="text-sm text-secondary">
            {cameraState.isActive ? 'Cámara Activa' : 'Cámara Inactiva'}
          </span>
          {isScanning && (
            <span class="scanning-dot" aria-hidden="true"></span>
          )}
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        class="hidden-canvas"
        aria-hidden="true"
        style={{ display: 'none' }}
      />

      {/* Styles */}
      <style jsx>{`
        .qr-scanner {
          max-width: 100%;
          background: var(--color-bg-primary);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }

        .qr-scanner-error {
          padding: var(--spacing-2xl);
          text-align: center;
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-error-500);
          border-radius: 12px;
        }

        .error-content {
          max-width: 400px;
          margin: 0 auto;
        }

        .camera-container {
          position: relative;
          background: #000;
          overflow: hidden;
        }

        .camera-video {
          width: 100%;
          height: auto;
          object-fit: cover;
          display: block;
        }

        .viewfinder-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
        }

        .viewfinder-frame {
          position: relative;
          width: 200px;
          height: 200px;
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 8px;
        }

        .viewfinder-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 3px solid #ffffff;
        }

        .viewfinder-corner.top-left {
          top: -3px;
          left: -3px;
          border-right: none;
          border-bottom: none;
        }

        .viewfinder-corner.top-right {
          top: -3px;
          right: -3px;
          border-left: none;
          border-bottom: none;
        }

        .viewfinder-corner.bottom-left {
          bottom: -3px;
          left: -3px;
          border-right: none;
          border-top: none;
        }

        .viewfinder-corner.bottom-right {
          bottom: -3px;
          right: -3px;
          border-left: none;
          border-top: none;
        }

        .viewfinder-text {
          margin-top: var(--spacing-lg);
          color: #ffffff;
          text-align: center;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          max-width: 280px;
        }

        .scanning-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .scanning-line {
          position: absolute;
          left: 50%;
          top: 0;
          width: 2px;
          height: 100%;
          background: linear-gradient(
            to bottom,
            transparent,
            var(--color-primary-500),
            transparent
          );
          transform: translateX(-50%);
          animation: scan 2s linear infinite;
        }

        @keyframes scan {
          0% { top: 0; opacity: 1; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .camera-controls {
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--color-border-light);
        }

        .camera-status {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .scanning-dot {
          width: 8px;
          height: 8px;
          background: var(--color-success-500);
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .viewfinder-frame {
            border-color: #ffffff;
            border-width: 3px;
          }
          
          .viewfinder-corner {
            border-width: 4px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .scanning-line,
          .scanning-dot {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}