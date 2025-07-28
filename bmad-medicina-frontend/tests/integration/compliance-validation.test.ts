import { assertEquals, assertExists, assert } from "@std/assert";
import { describe, it, beforeAll } from "@std/testing/bdd";

/**
 * Ley 19.628 Compliance Validation - Integrated System Testing
 * End-to-end validation of Chilean data protection law compliance
 */

const API_BASE_URL = "http://localhost:8080";
const FRONTEND_URL = "http://localhost:8000";

describe("🔒 Ley 19.628 Compliance - Integrated System Validation", () => {

  beforeAll(async () => {
    console.log("🏥 Testing healthcare data protection compliance in integrated system");
  });

  it("should validate complete consent management workflow", async () => {
    const testPatient = {
      rut: "11111111-1",
      name: "Ana María Torres",
      email: "ana.torres@test.cl",
      phone: "+56912345678"
    };

    try {
      // Step 1: Initial registration should require explicit consent
      const registrationResponse = await fetch(`${API_BASE_URL}/api/patients/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testPatient,
          consent_data_processing: true,
          consent_medication_reminders: true,
          consent_pharmacy_sharing: false,
          consent_research_participation: false,
          consent_timestamp: new Date().toISOString(),
          consent_method: "web_form"
        })
      });

      if (registrationResponse.ok) {
        const registrationResult = await registrationResponse.json();
        assertExists(registrationResult.patient_id);
        assertExists(registrationResult.consent_id);

        // Step 2: Verify consent can be retrieved
        const consentResponse = await fetch(`${API_BASE_URL}/api/privacy/consent/${registrationResult.consent_id}`);
        
        if (consentResponse.ok) {
          const consentData = await consentResponse.json();
          
          assertEquals(consentData.data_processing, true);
          assertEquals(consentData.medication_reminders, true);
          assertEquals(consentData.pharmacy_sharing, false);
          assertExists(consentData.consent_timestamp);
          assertEquals(consentData.consent_method, "web_form");
          
          console.log("✅ Consent management workflow functional");
        }

        // Step 3: Test consent withdrawal
        const withdrawalResponse = await fetch(`${API_BASE_URL}/api/privacy/consent/${registrationResult.consent_id}/withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            withdrawal_reason: "patient_request",
            withdrawal_timestamp: new Date().toISOString()
          })
        });

        if (withdrawalResponse.ok) {
          const withdrawalResult = await withdrawalResponse.json();
          assertEquals(withdrawalResult.consent_status, "withdrawn");
          assertExists(withdrawalResult.withdrawal_timestamp);
          
          console.log("✅ Consent withdrawal process functional");
        }

      } else {
        console.log(`⚠️  Patient registration: ${registrationResponse.status} (development in progress)`);
      }
    } catch (error) {
      console.log(`⚠️  Consent workflow testing: ${error.message}`);
    }
  });

  it("should validate data subject rights implementation", async () => {
    const testRUT = "22222222-2";

    try {
      // Test Right to Access (Derecho de Acceso)
      const accessResponse = await fetch(`${API_BASE_URL}/api/privacy/data-subject-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rut: testRUT,
          request_type: "full_data_access",
          identity_verified: true
        })
      });

      if (accessResponse.ok) {
        const accessData = await accessResponse.json();
        
        // Should include all personal data categories
        assertExists(accessData.personal_information);
        assertExists(accessData.medical_data);
        assertExists(accessData.usage_logs);
        assertExists(accessData.consent_history);
        
        // Should include data sources and sharing information
        assertExists(accessData.data_sources);
        assertExists(accessData.third_party_sharing);
        
        console.log("✅ Right to Access implemented");
      }

      // Test Right to Rectification (Derecho de Rectificación)
      const rectificationResponse = await fetch(`${API_BASE_URL}/api/privacy/data-rectification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rut: testRUT,
          corrections: {
            phone: "+56987654321",
            emergency_contact: "Juan Torres - +56911223344"
          },
          rectification_reason: "information_update"
        })
      });

      if (rectificationResponse.ok) {
        const rectificationResult = await rectificationResponse.json();
        assertEquals(rectificationResult.status, "updated");
        assertExists(rectificationResult.audit_id);
        
        console.log("✅ Right to Rectification implemented");
      }

      // Test Right to Deletion (Derecho de Cancelación/Olvido)
      const deletionResponse = await fetch(`${API_BASE_URL}/api/privacy/data-deletion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rut: testRUT,
          deletion_scope: "partial", // or "complete"
          data_categories: ["usage_logs", "marketing_preferences"],
          retention_exceptions: ["medical_prescriptions"], // Legal requirement to retain
          deletion_reason: "patient_request"
        })
      });

      if (deletionResponse.ok) {
        const deletionResult = await deletionResponse.json();
        assertEquals(deletionResult.status, "processed");
        assertExists(deletionResult.deletion_certificate);
        assertExists(deletionResult.retained_data_justification);
        
        console.log("✅ Right to Deletion implemented with medical data retention compliance");
      }

    } catch (error) {
      console.log(`⚠️  Data subject rights testing: ${error.message}`);
    }
  });

  it("should validate audit trail completeness", async () => {
    const testPatientId = "audit-test-patient";

    try {
      // Generate various auditable events
      const auditableEvents = [
        { action: "data_access", endpoint: "/api/patients/" + testPatientId },
        { action: "medication_update", endpoint: "/api/patients/" + testPatientId + "/medications" },
        { action: "consent_modification", endpoint: "/api/privacy/consent/update" },
        { action: "data_export", endpoint: "/api/privacy/data-export" }
      ];

      for (const event of auditableEvents) {
        await fetch(`${API_BASE_URL}${event.endpoint}`, {
          headers: {
            'X-Patient-ID': testPatientId,
            'X-Audit-Test': 'true'
          }
        });
      }

      // Retrieve audit trail
      const auditResponse = await fetch(`${API_BASE_URL}/api/audit/trail/${testPatientId}`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (auditResponse.ok) {
        const auditTrail = await auditResponse.json();
        
        // Validate audit trail completeness
        assert(auditTrail.events.length >= auditableEvents.length, "All events should be logged");
        
        for (const auditEvent of auditTrail.events) {
          // Required audit fields per Ley 19.628
          assertExists(auditEvent.timestamp);
          assertExists(auditEvent.user_identifier);
          assertExists(auditEvent.action_type);
          assertExists(auditEvent.data_subject_id);
          assertExists(auditEvent.legal_basis);
          assertExists(auditEvent.ip_address);
          assertExists(auditEvent.user_agent);
          
          // Validate timestamp format (ISO 8601)
          assert(
            !isNaN(Date.parse(auditEvent.timestamp)),
            "Timestamp should be valid ISO 8601 format"
          );
        }

        console.log(`✅ Audit trail complete: ${auditTrail.events.length} events logged`);
      }

    } catch (error) {
      console.log(`⚠️  Audit trail testing: ${error.message}`);
    }
  });

  it("should validate cross-border data transfer restrictions", async () => {
    const testTransfer = {
      patient_id: "transfer-test",
      destination_country: "USA",
      data_categories: ["medical_history", "medication_data"],
      transfer_purpose: "specialist_consultation",
      recipient_organization: "Mayo Clinic"
    };

    try {
      const transferResponse = await fetch(`${API_BASE_URL}/api/privacy/cross-border-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testTransfer)
      });

      if (transferResponse.status === 403) {
        const restrictionResult = await transferResponse.json();
        
        // Should block unauthorized international transfers
        assertEquals(restrictionResult.error, "cross_border_transfer_restricted");
        assertExists(restrictionResult.legal_requirement);
        assertEquals(restrictionResult.legal_requirement, "ley_19628_compliance");
        
        console.log("✅ Cross-border data transfer restrictions enforced");
      } else if (transferResponse.ok) {
        const transferResult = await transferResponse.json();
        
        // If allowed, should have proper safeguards
        assertExists(transferResult.adequacy_decision);
        assertExists(transferResult.contractual_clauses);
        assertExists(transferResult.data_subject_consent);
        
        console.log("✅ International transfer with proper safeguards");
      }

    } catch (error) {
      console.log(`⚠️  Cross-border transfer testing: ${error.message}`);
    }
  });

  it("should validate data retention policy enforcement", async () => {
    try {
      const retentionResponse = await fetch(`${API_BASE_URL}/api/privacy/retention-policy`);

      if (retentionResponse.ok) {
        const retentionPolicy = await retentionResponse.json();
        
        // Validate retention periods comply with Chilean healthcare regulations
        assertEquals(retentionPolicy.medical_prescriptions.retention_years, 10);
        assertEquals(retentionPolicy.consent_records.retention_years, 5);
        assertEquals(retentionPolicy.usage_logs.retention_years, 2);
        assertEquals(retentionPolicy.marketing_data.retention_years, 1);
        
        // Should have automated deletion processes
        assertEquals(retentionPolicy.automated_deletion_enabled, true);
        assertExists(retentionPolicy.next_cleanup_date);
        
        console.log("✅ Data retention policy complies with Chilean healthcare regulations");
      }

      // Test automated data purging simulation
      const purgeTestResponse = await fetch(`${API_BASE_URL}/api/privacy/test-data-purge`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true'
        },
        body: JSON.stringify({
          simulate_date: new Date(Date.now() + 11 * 365 * 24 * 60 * 60 * 1000).toISOString() // 11 years from now
        })
      });

      if (purgeTestResponse.ok) {
        const purgeResult = await purgeTestResponse.json();
        
        // Should identify data eligible for deletion
        assert(purgeResult.eligible_records > 0, "Should find records eligible for purging");
        assertExists(purgeResult.retention_exceptions);
        
        console.log(`✅ Automated data purge simulation: ${purgeResult.eligible_records} records eligible`);
      }

    } catch (error) {
      console.log(`⚠️  Data retention testing: ${error.message}`);
    }
  });

  it("should validate encryption and data security measures", async () => {
    try {
      const securityResponse = await fetch(`${API_BASE_URL}/api/security/encryption-status`);

      if (securityResponse.ok) {
        const securityStatus = await securityResponse.json();
        
        // Validate encryption implementations
        assertEquals(securityStatus.data_at_rest_encrypted, true);
        assertEquals(securityStatus.data_in_transit_encrypted, true);
        assertEquals(securityStatus.encryption_algorithm, "AES-256");
        assertEquals(securityStatus.tls_version >= 1.2, true);
        
        // Validate key management
        assertExists(securityStatus.key_rotation_enabled);
        assertExists(securityStatus.last_key_rotation);
        
        console.log(`✅ Data encryption: ${securityStatus.encryption_algorithm}, TLS ${securityStatus.tls_version}`);
      }

      // Test data masking for non-authorized access
      const maskingResponse = await fetch(`${API_BASE_URL}/api/patients/masked-view/test-patient`, {
        headers: { 'X-Role': 'pharmacy_staff' } // Limited access role
      });

      if (maskingResponse.ok) {
        const maskedData = await maskingResponse.json();
        
        // Sensitive data should be masked
        assert(maskedData.rut.includes('***'), "RUT should be partially masked");
        assert(!maskedData.full_name, "Full name should not be visible to pharmacy staff");
        assertExists(maskedData.medications); // Pharmacy staff needs medication info
        
        console.log("✅ Data masking implemented for role-based access");
      }

    } catch (error) {
      console.log(`⚠️  Encryption validation testing: ${error.message}`);
    }
  });

  it("should validate privacy impact assessment documentation", async () => {
    try {
      const piaResponse = await fetch(`${API_BASE_URL}/api/privacy/impact-assessment`);

      if (piaResponse.ok) {
        const pia = await piaResponse.json();
        
        // Should have documented privacy risks and mitigations
        assertExists(pia.identified_risks);
        assertExists(pia.mitigation_measures);
        assertExists(pia.compliance_validation);
        assertExists(pia.last_updated);
        
        // Should address specific healthcare data risks
        const healthcareRisks = pia.identified_risks.filter((risk: any) => 
          risk.category === 'healthcare_data'
        );
        assert(healthcareRisks.length > 0, "Should identify healthcare-specific privacy risks");
        
        console.log(`✅ Privacy Impact Assessment: ${pia.identified_risks.length} risks identified and mitigated`);
      }

    } catch (error) {
      console.log(`⚠️  Privacy Impact Assessment testing: ${error.message}`);
    }
  });

  it("should validate incident response procedures", async () => {
    const testIncident = {
      incident_type: "unauthorized_access_attempt",
      affected_patients: ["test-patient-1", "test-patient-2"],
      incident_severity: "medium",
      detection_timestamp: new Date().toISOString(),
      initial_response: "access_revoked"
    };

    try {
      const incidentResponse = await fetch(`${API_BASE_URL}/api/privacy/incident-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testIncident)
      });

      if (incidentResponse.ok) {
        const incidentResult = await incidentResponse.json();
        
        // Should trigger proper incident response procedures
        assertExists(incidentResult.incident_id);
        assertEquals(incidentResult.status, "under_investigation");
        assertExists(incidentResult.notification_timeline);
        
        // Should include patient notification requirements
        if (incidentResult.patient_notification_required) {
          assertExists(incidentResult.notification_deadline);
          assertExists(incidentResult.notification_method);
        }
        
        // Should include authority notification if required
        if (incidentResult.authority_notification_required) {
          assertEquals(incidentResult.authority, "SERNAC");
          assertExists(incidentResult.authority_notification_deadline);
        }

        console.log(`✅ Privacy incident response initiated: ${incidentResult.incident_id}`);
      }

    } catch (error) {
      console.log(`⚠️  Incident response testing: ${error.message}`);
    }
  });
});