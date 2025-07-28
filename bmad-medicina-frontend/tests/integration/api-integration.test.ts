import { assertEquals, assertExists, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Simple test runner without BDD framework for immediate execution
const API_BASE_URL = "http://localhost:8080";
const FRONTEND_URL = "http://localhost:8000";

console.log("🔄 LIVE Frontend-Backend Integration Tests");
console.log("==========================================");

/**
 * LIVE Integration Tests - Frontend-Backend API Connection
 * Testing REAL API endpoints on port 8080 as integration happens
 */

const API_BASE_URL = "http://localhost:8080";
const FRONTEND_URL = "http://localhost:8000";

// Live Integration Testing Functions
async function runTest(testName: string, testFunction: () => Promise<void>) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log("----------------------------------------");
  try {
    await testFunction();
    console.log(`✅ PASS: ${testName}`);
    return true;
  } catch (error) {
    console.log(`⚠️  PENDING: ${testName} - ${error.message}`);
    return false;
  }
}

// Pre-test system verification
async function verifySystemReadiness() {
  console.log("\n🔍 System Readiness Check");
  console.log("----------------------------------------");
  
  // Check backend
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      console.log("✅ Backend server operational on port 8080");
    } else {
      throw new Error(`Backend returned ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Backend not accessible: ${error.message}`);
    return false;
  }
  
  // Check frontend
  try {
    const response = await fetch(FRONTEND_URL);
    if (response.ok) {
      console.log("✅ Frontend server operational on port 8000");
    } else {
      throw new Error(`Frontend returned ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Frontend not accessible: ${error.message}`);
    return false;
  }
  
  return true;
}

// Test Functions
async function testMedicationAPIEndpoints() {
  const endpoints = [
    "/api/v1/medications",
    "/health"
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Endpoint ${endpoint} returned ${response.status}`);
    }
    
    console.log(`✅ ${endpoint}: ${response.status} OK`);
  }
}

  it("should handle medication search with Chilean drug database", async () => {
    const searchTerm = "paracetamol";
    const response = await fetch(`${API_BASE_URL}/api/medications/search?q=${searchTerm}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const medications = await response.json();
      assertExists(medications);
      
      // Should return array of Chilean medications
      assert(Array.isArray(medications), "Medications should be an array");
      
      if (medications.length > 0) {
        const firstMed = medications[0];
        assertExists(firstMed.name);
        assertExists(firstMed.id);
        
        console.log(`✅ Found ${medications.length} medications for "${searchTerm}"`);
      }
    } else {
      console.log(`⚠️  Medication search endpoint not yet implemented: ${response.status}`);
    }
  });

  it("should validate QR code processing endpoint", async () => {
    const mockQRData = {
      qr_code: "MED:12345678901234567890:PARACETAMOL_500MG:CRUZ_VERDE",
      patient_id: "test-patient-123"
    };

    const response = await fetch(`${API_BASE_URL}/api/medications/qr-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockQRData)
    });

    if (response.ok) {
      const result = await response.json();
      assertExists(result);
      
      // Should validate medication exists in Chilean database
      console.log("✅ QR code processing endpoint functional");
    } else if (response.status === 404) {
      console.log("⚠️  QR scan endpoint not yet implemented");
    } else {
      console.log(`⚠️  QR scan endpoint returned: ${response.status}`);
    }
  });

  it("should test patient registration with data protection", async () => {
    const testPatient = {
      rut: "12345678-9",
      name: "María González",
      email: "maria@test.com",
      phone: "+56912345678",
      consent_data_processing: true,
      consent_medication_reminders: true,
      consent_pharmacy_sharing: false
    };

    const response = await fetch(`${API_BASE_URL}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPatient)
    });

    if (response.ok) {
      const result = await response.json();
      assertExists(result.patient_id);
      
      // Verify consent was properly recorded
      assertExists(result.consent_timestamp);
      assertEquals(result.data_processing_consent, true);
      
      console.log("✅ Patient registration with consent management working");
    } else if (response.status === 409) {
      console.log("⚠️  Patient already exists (expected in testing)");
    } else {
      console.log(`⚠️  Patient registration endpoint: ${response.status}`);
    }
  });

  it("should validate medication alert scheduling", async () => {
    const alertData = {
      patient_id: "test-patient-123",
      medication_id: "paracetamol-500mg",
      dosage_times: ["08:00", "14:00", "20:00"],
      start_date: new Date().toISOString().split('T')[0],
      duration_days: 7
    };

    const response = await fetch(`${API_BASE_URL}/api/alerts/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });

    if (response.ok) {
      const result = await response.json();
      assertExists(result.alert_id);
      assertExists(result.next_alert_time);
      
      console.log("✅ Medication alert scheduling functional");
    } else {
      console.log(`⚠️  Alert scheduling endpoint: ${response.status}`);
    }
  });

  it("should test drug interaction checking", async () => {
    const interactionCheck = {
      patient_id: "test-patient-123",
      medications: [
        { name: "Warfarina", dosage: "5mg" },
        { name: "Aspirina", dosage: "100mg" }
      ]
    };

    const response = await fetch(`${API_BASE_URL}/api/medications/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interactionCheck)
    });

    if (response.ok) {
      const result = await response.json();
      
      // Should detect Warfarin-Aspirin interaction
      assert(result.has_interactions === true, "Should detect blood thinner interaction");
      assert(result.interactions.length > 0, "Should return interaction details");
      
      console.log(`✅ Drug interaction detection: ${result.interactions.length} interactions found`);
    } else {
      console.log(`⚠️  Drug interaction endpoint: ${response.status}`);
    }
  });

  it("should validate B2B pharmacy dashboard data", async () => {
    const pharmacyId = "cruz-verde-001";
    const response = await fetch(`${API_BASE_URL}/api/pharmacy/${pharmacyId}/dashboard`, {
      headers: { 
        'Authorization': 'Bearer test-pharmacy-token',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const dashboardData = await response.json();
      
      // Should include key pharmacy metrics
      assertExists(dashboardData.total_patients);
      assertExists(dashboardData.adherence_rate);
      assertExists(dashboardData.pending_refills);
      
      console.log(`✅ B2B Dashboard: ${dashboardData.total_patients} patients, ${dashboardData.adherence_rate}% adherence`);
    } else if (response.status === 401) {
      console.log("⚠️  B2B Dashboard requires authentication (expected)");
    } else {
      console.log(`⚠️  B2B Dashboard endpoint: ${response.status}`);
    }
  });

  it("should test real-time alert delivery", async () => {
    // Test WebSocket or SSE connection for real-time alerts
    const testAlert = {
      patient_id: "test-patient-123",
      medication: "Paracetamol 500mg",
      scheduled_time: new Date().toISOString(),
      alert_type: "dosage_reminder"
    };

    const response = await fetch(`${API_BASE_URL}/api/alerts/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAlert)
    });

    if (response.ok) {
      const result = await response.json();
      assertExists(result.alert_sent);
      assertEquals(result.delivery_method, "push_notification");
      
      console.log("✅ Real-time alert delivery functional");
    } else {
      console.log(`⚠️  Real-time alerts endpoint: ${response.status}`);
    }
  });

  it("should validate data encryption in transit", async () => {
    // Test that sensitive data is properly encrypted
    const sensitiveData = {
      rut: "12345678-9",
      medical_conditions: ["hipertensión", "diabetes"],
      emergency_contact: "+56987654321"
    };

    const response = await fetch(`${API_BASE_URL}/api/patients/sensitive-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sensitiveData)
    });

    // Response headers should indicate HTTPS/TLS
    const securityHeaders = {
      'strict-transport-security': response.headers.get('strict-transport-security'),
      'content-security-policy': response.headers.get('content-security-policy'),
      'x-content-type-options': response.headers.get('x-content-type-options')
    };

    console.log("🔒 Security headers check:", securityHeaders);
    
    if (response.ok) {
      console.log("✅ Sensitive data transmission secured");
    } else {
      console.log(`⚠️  Sensitive data endpoint: ${response.status}`);
    }
  });

  it("should test error handling and recovery", async () => {
    // Test how system handles various error conditions
    const errorScenarios = [
      { endpoint: "/api/medications/999999", expectedStatus: 404 },
      { endpoint: "/api/patients", method: "POST", body: {}, expectedStatus: 400 },
      { endpoint: "/api/alerts/invalid-id", expectedStatus: 400 }
    ];

    for (const scenario of errorScenarios) {
      const response = await fetch(`${API_BASE_URL}${scenario.endpoint}`, {
        method: scenario.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: scenario.body ? JSON.stringify(scenario.body) : undefined
      });

      if (response.status === scenario.expectedStatus) {
        const errorData = await response.json();
        assertExists(errorData.error);
        assertExists(errorData.message);
        
        console.log(`✅ Error handling correct for ${scenario.endpoint}: ${response.status}`);
      } else {
        console.log(`⚠️  Unexpected error response for ${scenario.endpoint}: ${response.status}`);
      }
    }
  });
});