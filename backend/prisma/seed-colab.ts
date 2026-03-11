import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('ℹ️  Los datos del portal de colaboradores se gestionan mediante fases SQL.');
    console.log('');
    console.log('📂 Datos base (módulos, permisos, roles, configuración, almacén):');
    console.log('   database/13-fase-(10-02-2026)-v1-9213.sql');
    console.log('');
    console.log('📂 Datos extendidos (seguridad, documentos, capacitaciones, evaluaciones, equipos, incidencias):');
    console.log('   database/14-fase-(24-02-2026)-v1-6483.sql');
    console.log('');
    console.log('Para verificar la carga:');
    console.log('   source database/13-fase-verificacion.sql');
    console.log('   source database/14-fase-verificacion.sql');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
