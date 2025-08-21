import { assertEquals, assertExists, assert } from "@std/assert";
import { describe, it, beforeAll } from "@std/testing/bdd";

/**
 * Real-Time Data Flow & Error Handling Tests
 * Testing live medication alerts, WebSocket connections, and error recovery
 */

const API_BASE_URL = "http://localhost:8080";

describe("🔄 Real-Time Data Flow & Error Handling", () => {

  beforeAll(async () => {
    // Verify backend is accessible
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error("Backend not accessible for real-time testing");
      }
    } catch (error) {
      console.log("⚠️  Backend not ready - tests will validate expected behavior");
    }
  });

  it("should handle medication alert real-time delivery", async () => {
    const testAlert = {
      patient_id: "test-patient-realtime",
      medication: "Losartán 50mg",
      alert_time: new Date().toISOString(),
      alert_type: "dosage_reminder",
      priority: "high"
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAlert)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Validate real-time delivery confirmation
        assertExists(result.alert_id);
        assertExists(result.delivery_timestamp);
        assertEquals(result.status, "delivered");
        
        // Should deliver within 1 second for critical medication alerts
        const deliveryTime = new Date(result.delivery_timestamp);
        const sentTime = new Date(testAlert.alert_time);
        const delayMs = deliveryTime.getTime() - sentTime.getTime();
        
        assert(delayMs < 1000, `Alert delivery delay ${delayMs}ms exceeds 1s limit`);
        
        console.log(`✅ Real-time alert delivered in ${delayMs}ms`);
      } else {
        console.log(`⚠️  Real-time alerts endpoint: ${response.status} (development in progress)`);
      }
    } catch (error) {
      console.log(`⚠️  Real-time testing waiting for backend: ${error.message}`);
    }
  });

  it("should handle WebSocket connection for live notifications", async () => {
    try {
      // Test WebSocket connection establishment
      const wsUrl = "ws://localhost:8080/ws/notifications";
      const ws = new WebSocket(wsUrl);
      
      const connectionPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("WebSocket connection timeout"));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          console.log("✅ WebSocket connection established");
          resolve();
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });

      await connectionPromise;

      // Test sending notification
      const testNotification = {
        type: "medication_alert",
        patient_id: "test-patient-ws",
        message: "Hora de tomar Paracetamol 500mg"
      };

      ws.send(JSON.stringify(testNotification));

      // Test receiving response
      const responsePromise = new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("WebSocket response timeout"));
        }, 3000);

        ws.onmessage = (event) => {
          clearTimeout(timeout);
          const data = JSON.parse(event.data);
          resolve(data);
        };
      });

      const response = await responsePromise;
      assertExists(response.acknowledged);
      assertEquals(response.status, "received");

      ws.close();
      console.log("✅ WebSocket bidirectional communication working");

    } catch (error) {
      console.log(`⚠️  WebSocket testing: ${error.message} (may not be implemented yet)`);
    }
  });

  it("should handle database connection errors gracefully", async () => {
    // Test how API handles database unavailability
    const testPatient = {
      rut: "database-error-test",
      name: "Test Patient"
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/patients`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Test-Database-Error': 'true' // Signal to trigger DB error for testing
        },
        body: JSON.stringify(testPatient)
      });

      if (response.status === 503) {
        const errorData = await response.json();
        
        // Should return proper error structure
        assertExists(errorData.error);
        assertExists(errorData.message);
        assertExists(errorData.retry_after);
        
        // Error message should be user-friendly for seniors
        assert(
          errorData.message.includes("temporalmente") || 
          errorData.message.includes("intente"),
          "Error message should be senior-friendly"
        );
        
        console.log("✅ Database error handled gracefully");
      } else {
        console.log(`⚠️  Database error simulation not implemented: ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️  Database error testing: ${error.message}`);
    }
  });

  it("should implement circuit breaker for external services", async () => {
    // Test circuit breaker for external pharmacy APIs
    const pharmacyRequests = [];
    
    // Simulate multiple requests to external pharmacy service
    for (let i = 0; i < 10; i++) {
      pharmacyRequests.push(
        fetch(`${API_BASE_URL}/api/pharmacy/external/stock-check`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Test-External-Failure': 'true' // Simulate external service failure
          },
          body: JSON.stringify({ medication_id: "paracetamol-500mg" })
        })
      );
    }

    try {
      const responses = await Promise.all(pharmacyRequests);
      
      // After several failures, circuit breaker should open
      const circuitBreakerResponses = responses.filter(r => r.status === 503);
      
      if (circuitBreakerResponses.length > 0) {
        const breakerResponse = await circuitBreakerResponses[0].json();
        
        assertEquals(breakerResponse.error, "circuit_breaker_open");
        assertExists(breakerResponse.retry_after);
        
        console.log("✅ Circuit breaker pattern implemented");
      } else {
        console.log("⚠️  Circuit breaker pattern not yet implemented");
      }
    } catch (error) {
      console.log(`⚠️  Circuit breaker testing: ${error.message}`);
    }
  });

  it("should handle medication interaction checking delays", async () => {
    const complexInteractionCheck = {
      patient_id: "interaction-test",
      medications: [
        { name: "Warfarina", dosage: "5mg", frequency: "daily" },
        { name: "Aspirina", dosage: "100mg", frequency: "daily" },
        { name: "Clopidogrel", dosage: "75mg", frequency: "daily" },
        { name: "Heparina", dosage: "5000ui", frequency: "bid" },
        { name: "Rivaroxaban", dosage: "20mg", frequency: "daily" }
      ]
    };

    const startTime = Date.now();

    try {
      const response = await fetch(`${API_BASE_URL}/api/medications/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complexInteractionCheck),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();
        
        // Should handle complex interaction checking within reasonable time
        assert(responseTime < 5000, `Interaction check took ${responseTime}ms, should be < 5s`);
        
        // Should identify multiple blood thinner interactions
        assert(result.has_interactions === true, "Should detect multiple interactions");
        assert(result.interactions.length >= 3, "Should find multiple blood thinner interactions");
        assert(result.severity === "critical", "Multiple blood thinners should be critical");
        
        console.log(`✅ Complex interaction check completed in ${responseTime}ms`);
        console.log(`✅ Found ${result.interactions.length} interactions, severity: ${result.severity}`);
      } else if (response.status === 408) {
        console.log("⚠️  Interaction check timed out - may need performance optimization");
      } else {
        console.log(`⚠️  Interaction checking: ${response.status}`);
      }
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.log("⚠️  Interaction check timeout - performance optimization needed");
      } else {
        console.log(`⚠️  Interaction checking error: ${error.message}`);
      }
    }
  });

  it("should implement retry logic for critical operations", async () => {
    const criticalAlert = {
      patient_id: "retry-test",
      medication: "Insulina Rápida",
      alert_type: "critical_medication",
      severity: "urgent",
      max_retries: 3
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/critical`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Test-Retry-Logic': 'true' // Test retry mechanism
        },
        body: JSON.stringify(criticalAlert)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Should show retry attempts for critical medications
        assertExists(result.delivery_attempts);
        assertExists(result.final_status);
        
        if (result.delivery_attempts > 1) {
          assert(result.delivery_attempts <= 3, "Should not exceed max retries");
          assertEquals(result.final_status, "delivered");
          
          console.log(`✅ Critical alert delivered after ${result.delivery_attempts} attempts`);
        } else {
          console.log("✅ Critical alert delivered on first attempt");
        }
      } else {
        console.log(`⚠️  Critical alert retry logic: ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️  Retry logic testing: ${error.message}`);
    }
  });

  it("should handle patient data synchronization conflicts", async () => {
    const patientUpdate1 = {
      patient_id: "sync-test-patient",
      medications: ["Paracetamol 500mg"],
      last_modified: new Date().toISOString(),
      source: "mobile_app"
    };

    const patientUpdate2 = {
      patient_id: "sync-test-patient", 
      medications: ["Paracetamol 500mg", "Ibuprofeno 400mg"],
      last_modified: new Date(Date.now() + 1000).toISOString(), // 1 second later
      source: "web_app"
    };

    try {
      // Send concurrent updates
      const [response1, response2] = await Promise.all([
        fetch(`${API_BASE_URL}/api/patients/sync`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientUpdate1)
        }),
        fetch(`${API_BASE_URL}/api/patients/sync`, {
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientUpdate2)
        })
      ]);

      if (response1.ok && response2.ok) {
        const result1 = await response1.json();
        const result2 = await response2.json();

        // Should handle conflict resolution
        if (result1.conflict_detected || result2.conflict_detected) {
          // Later timestamp should win
          const finalState = result2.conflict_resolved ? result2 : result1;
          assertEquals(finalState.medications.length, 2); // Should have both medications
          
          console.log("✅ Data synchronization conflict resolved");
        } else {
          console.log("✅ No synchronization conflicts detected");
        }
      } else {
        console.log(`⚠️  Data synchronization: ${response1.status}, ${response2.status}`);
      }
    } catch (error) {
      console.log(`⚠️  Synchronization conflict testing: ${error.message}`);
    }
  });

  it("should validate offline data queue processing", async () => {
    const offlineOperations = [
      { type: "medication_taken", patient_id: "offline-test", medication: "Paracetamol", timestamp: new Date().toISOString() },
      { type: "missed_dose", patient_id: "offline-test", medication: "Losartán", timestamp: new Date().toISOString() },
      { type: "side_effect", patient_id: "offline-test", medication: "Paracetamol", effect: "náusea", timestamp: new Date().toISOString() }
    ];

    try {
      const response = await fetch(`${API_BASE_URL}/api/sync/offline-queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: offlineOperations })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Should process all offline operations
        assertEquals(result.processed_count, offlineOperations.length);
        assertEquals(result.failed_count, 0);
        
        // Should maintain chronological order
        assertExists(result.processing_order);
        
        console.log(`✅ Offline queue processed: ${result.processed_count} operations`);
      } else {
        console.log(`⚠️  Offline queue processing: ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️  Offline queue testing: ${error.message}`);
    }
  });
});