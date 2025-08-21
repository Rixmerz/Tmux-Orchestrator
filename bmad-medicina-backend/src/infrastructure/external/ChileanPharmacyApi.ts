import { config } from "../config/config.ts";
import { logger } from "../logging/logger.ts";

export interface ChileanMedicationData {
  ispCode: string;
  name: string;
  genericName: string;
  activeIngredient: string;
  concentration: string;
  pharmaceuticalForm: string;
  manufacturer: string;
  registrationStatus: string;
  expirationDate?: string;
  therapeuticGroup: string;
  prescriptionRequired: boolean;
  controlledSubstance: boolean;
  priceReference?: number;
}

export interface PharmacyStockInfo {
  pharmacyId: string;
  pharmacyName: string;
  address: string;
  phone: string;
  medicationId: string;
  inStock: boolean;
  quantity: number;
  price: number;
  lastUpdated: string;
}

export interface MedicationSearchParams {
  name?: string;
  activeIngredient?: string;
  ispCode?: string;
  therapeuticGroup?: string;
  limit?: number;
}

export class ChileanPharmacyApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.chileanPharmacyApiUrl;
    this.apiKey = config.chileanPharmacyApiKey;
  }

  async searchMedications(params: MedicationSearchParams): Promise<ChileanMedicationData[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.name) searchParams.append("name", params.name);
      if (params.activeIngredient) searchParams.append("active_ingredient", params.activeIngredient);
      if (params.ispCode) searchParams.append("isp_code", params.ispCode);
      if (params.therapeuticGroup) searchParams.append("therapeutic_group", params.therapeuticGroup);
      if (params.limit) searchParams.append("limit", params.limit.toString());

      const url = `${this.baseUrl}/api/v1/medications/search?${searchParams}`;
      
      logger.info(`Calling Chilean Pharmacy API: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "BMad-Medicina-Backend/1.0.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Chilean Pharmacy API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      logger.info(`Chilean Pharmacy API response: ${data.results?.length || 0} medications found`);
      
      return data.results || [];
    } catch (error) {
      logger.error("Error calling Chilean Pharmacy API", error);
      
      // Return mock data for development/testing
      return this.getMockMedicationData(params);
    }
  }

  async getMedicationByIspCode(ispCode: string): Promise<ChileanMedicationData | null> {
    try {
      const url = `${this.baseUrl}/api/v1/medications/${ispCode}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Chilean Pharmacy API error: ${response.status}`);
      }

      const data = await response.json();
      return data.medication || null;
    } catch (error) {
      logger.error(`Error fetching medication ${ispCode} from Chilean API`, error);
      return null;
    }
  }

  async checkPharmacyStock(medicationIspCode: string, latitude?: number, longitude?: number): Promise<PharmacyStockInfo[]> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append("medication_code", medicationIspCode);
      
      if (latitude && longitude) {
        searchParams.append("lat", latitude.toString());
        searchParams.append("lng", longitude.toString());
        searchParams.append("radius", "10"); // 10km radius
      }

      const url = `${this.baseUrl}/api/v1/stock/search?${searchParams}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Stock API error: ${response.status}`);
      }

      const data = await response.json();
      return data.pharmacies || [];
    } catch (error) {
      logger.error("Error checking pharmacy stock", error);
      return [];
    }
  }

  async validateMedicationInteractions(medicationCodes: string[]): Promise<{
    hasInteractions: boolean;
    interactions: Array<{
      medication1: string;
      medication2: string;
      severity: string;
      description: string;
    }>;
  }> {
    try {
      const url = `${this.baseUrl}/api/v1/interactions/check`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medication_codes: medicationCodes,
        }),
      });

      if (!response.ok) {
        throw new Error(`Interactions API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        hasInteractions: data.interactions?.length > 0,
        interactions: data.interactions || [],
      };
    } catch (error) {
      logger.error("Error validating medication interactions", error);
      return {
        hasInteractions: false,
        interactions: [],
      };
    }
  }

  // Mock data for development/testing
  private getMockMedicationData(params: MedicationSearchParams): ChileanMedicationData[] {
    const mockData: ChileanMedicationData[] = [
      {
        ispCode: "ISP-001234",
        name: "Paracetamol 500mg Tabletas",
        genericName: "Paracetamol",
        activeIngredient: "Paracetamol",
        concentration: "500mg",
        pharmaceuticalForm: "Tableta",
        manufacturer: "Laboratorio Chile S.A.",
        registrationStatus: "Vigente",
        therapeuticGroup: "Analgésicos",
        prescriptionRequired: false,
        controlledSubstance: false,
        priceReference: 2500,
      },
      {
        ispCode: "ISP-005678",
        name: "Ibuprofeno 400mg Cápsulas",
        genericName: "Ibuprofeno",
        activeIngredient: "Ibuprofeno",
        concentration: "400mg",
        pharmaceuticalForm: "Cápsula",
        manufacturer: "Farma Nacional Ltda.",
        registrationStatus: "Vigente",
        therapeuticGroup: "Antiinflamatorios",
        prescriptionRequired: false,
        controlledSubstance: false,
        priceReference: 3200,
      },
    ];

    // Filter mock data based on search parameters
    let filteredData = mockData;
    
    if (params.name) {
      filteredData = filteredData.filter(med => 
        med.name.toLowerCase().includes(params.name!.toLowerCase())
      );
    }
    
    if (params.ispCode) {
      filteredData = filteredData.filter(med => 
        med.ispCode === params.ispCode
      );
    }

    return filteredData.slice(0, params.limit || 10);
  }
}