// Script para crear usuario admin inicial
import { AuthService } from "../lib/auth/authService.ts";

async function createInitialAdmin() {
  const authService = new AuthService();
  
  try {
    // Verificar si ya existe un admin
    const hasAdmin = await authService.hasAdminUsers();
    
    if (hasAdmin) {
      console.log("✅ Ya existe un usuario admin");
      return;
    }
    
    // Crear usuario admin inicial
    const admin = await authService.createAdminUser(
      "admin",
      "admin@nar-designs.com", 
      "nar2024admin"
    );
    
    console.log("✅ Usuario admin creado exitosamente:");
    console.log(`   Usuario: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Contraseña: nar2024admin`);
    console.log("\n🔐 Accede en: http://localhost:8000/admin/login");
    
  } catch (error) {
    console.error("❌ Error creando admin:", error);
  }
}

if (import.meta.main) {
  await createInitialAdmin();
}