/**
 * BMad - App Layout with PWA Configuration
 * Main app wrapper with PWA manifest and service worker registration
 * Optimized for senior-friendly medication adherence system
 */

import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html lang="es-CL">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        
        {/* App Info */}
        <title>BMad - Sistema de Adherencia Medicamentos</title>
        <meta name="description" content="Asistente personal para el seguimiento de medicamentos, diseñado especialmente para adultos mayores chilenos" />
        <meta name="keywords" content="medicamentos, adherencia, salud, adultos mayores, recordatorios, calendario" />
        <meta name="author" content="BMad Healthcare" />
        <meta name="language" content="es-CL" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme and Status Bar */}
        <meta name="theme-color" content="#0369a1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BMad Medicamentos" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0369a1" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#0369a1" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="BMad - Sistema de Adherencia Medicamentos" />
        <meta property="og:description" content="Asistente personal para el seguimiento de medicamentos para adultos mayores" />
        <meta property="og:image" content="/icons/og-image.png" />
        <meta property="og:site_name" content="BMad Medicamentos" />
        <meta property="og:locale" content="es_CL" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BMad - Sistema de Adherencia Medicamentos" />
        <meta name="twitter:description" content="Asistente personal para el seguimiento de medicamentos para adultos mayores" />
        <meta name="twitter:image" content="/icons/twitter-image.png" />
        
        {/* Security */}
        <meta http-equiv="X-Content-Type-Options" content="nosniff" />
        <meta http-equiv="X-Frame-Options" content="DENY" />
        <meta http-equiv="X-XSS-Protection" content="1; mode=block" />
        <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/styles.css" as="style" />
        <link rel="preload" href="/icons/icon-192x192.png" as="image" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
        
        {/* Styles */}
        <link rel="stylesheet" href="/styles.css" />
        
        {/* Skip link for accessibility */}
        <style>
          {`
            .skip-link {
              position: absolute;
              top: -40px;
              left: 6px;
              background: #0369a1;
              color: white;
              padding: 8px;
              text-decoration: none;
              border-radius: 4px;
              z-index: 1600;
              font-size: 18px;
              font-weight: 600;
            }
            .skip-link:focus {
              top: 6px;
            }
          `}
        </style>
      </head>
      <body>
        {/* Skip navigation link for accessibility */}
        <a href="#main-content" class="skip-link">
          Saltar al contenido principal
        </a>
        
        {/* Main app content */}
        <main id="main-content">
          <Component />
        </main>
        
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Service Worker Registration for PWA functionality
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', async () => {
                try {
                  const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                  });
                  
                  console.log('Service Worker registered successfully:', registration.scope);
                  
                  // Handle service worker updates
                  registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          // New version available
                          if (confirm('Nueva versión disponible. ¿Deseas actualizar?')) {
                            window.location.reload();
                          }
                        }
                      });
                    }
                  });
                  
                  // Request notification permission
                  if ('Notification' in window && Notification.permission === 'default') {
                    const permission = await Notification.requestPermission();
                    console.log('Notification permission:', permission);
                  }
                  
                  // Register for push notifications
                  if ('PushManager' in window && registration.pushManager) {
                    try {
                      const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        // You would need to add your VAPID public key here
                        applicationServerKey: null
                      });
                      console.log('Push subscription:', subscription);
                    } catch (error) {
                      console.log('Push subscription failed:', error);
                    }
                  }
                  
                } catch (error) {
                  console.error('Service Worker registration failed:', error);
                }
              });
            }
            
            // App Install Prompt
            let deferredPrompt;
            
            window.addEventListener('beforeinstallprompt', (e) => {
              console.log('Install prompt triggered');
              e.preventDefault();
              deferredPrompt = e;
              
              // Show custom install button
              const installButton = document.getElementById('install-button');
              if (installButton) {
                installButton.style.display = 'block';
                installButton.addEventListener('click', async () => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log('Install prompt outcome:', outcome);
                    deferredPrompt = null;
                    installButton.style.display = 'none';
                  }
                });
              }
            });
            
            // Track app usage
            window.addEventListener('appinstalled', () => {
              console.log('BMad app installed successfully');
            });
            
            // Handle online/offline status
            function updateOnlineStatus() {
              const statusElement = document.getElementById('connection-status');
              if (statusElement) {
                statusElement.textContent = navigator.onLine ? 
                  'En línea' : 'Sin conexión - Funcionando offline';
                statusElement.className = navigator.onLine ? 
                  'online-status' : 'offline-status';
              }
            }
            
            window.addEventListener('online', updateOnlineStatus);
            window.addEventListener('offline', updateOnlineStatus);
            
            // Initialize app
            document.addEventListener('DOMContentLoaded', () => {
              updateOnlineStatus();
              
              // Add keyboard navigation improvements for seniors
              document.addEventListener('keydown', (e) => {
                // Enhance tab navigation visibility
                if (e.key === 'Tab') {
                  document.body.classList.add('keyboard-navigation');
                }
                
                // Emergency shortcut (Ctrl + E)
                if (e.ctrlKey && e.key === 'e') {
                  e.preventDefault();
                  const emergencyButton = document.querySelector('[data-emergency]');
                  if (emergencyButton) {
                    emergencyButton.click();
                  }
                }
              });
              
              // Remove keyboard navigation class on mouse use
              document.addEventListener('mousedown', () => {
                document.body.classList.remove('keyboard-navigation');
              });
            });
            
            // Medication reminder notifications
            function scheduleMedicationReminder(medication, time) {
              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'SCHEDULE_MEDICATION_REMINDER',
                  payload: { medication, time }
                });
              }
            }
            
            // Make functions available globally
            window.bmadApp = {
              scheduleMedicationReminder,
              updateOnlineStatus
            };
          `
        }} />
        
        {/* Global styles for keyboard navigation and accessibility */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .keyboard-navigation *:focus {
              outline: 3px solid #0369a1 !important;
              outline-offset: 2px !important;
            }
            
            .online-status, .offline-status {
              position: fixed;
              top: 10px;
              right: 10px;
              padding: 8px 12px;
              border-radius: 4px;
              font-size: 14px;
              font-weight: 500;
              z-index: 1000;
            }
            
            .online-status {
              background: #22c55e;
              color: white;
            }
            
            .offline-status {
              background: #f59e0b;
              color: white;
              animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
            
            #install-button {
              display: none;
              position: fixed;
              bottom: 20px;
              right: 20px;
              background: #0369a1;
              color: white;
              border: none;
              padding: 12px 16px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              z-index: 1000;
            }
            
            #install-button:hover {
              background: #0284c7;
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
              .keyboard-navigation *:focus {
                outline-width: 4px !important;
              }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
              .offline-status {
                animation: none;
              }
            }
          `
        }} />
        
        {/* Connection status indicator */}
        <div id="connection-status" class="online-status" aria-live="polite"></div>
        
        {/* Install app button */}
        <button id="install-button" aria-label="Instalar aplicación BMad">
          📱 Instalar App
        </button>
      </body>
    </html>
  );
}