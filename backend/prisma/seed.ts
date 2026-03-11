import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('ℹ️  Los datos de referencia se gestionan mediante fases SQL.');
    console.log('📂 Ubicación: database/15-fase-(10-03-2026)-v1-7391.sql');
    console.log('');
    console.log('Para cargar datos iniciales ejecutar en MySQL:');
    console.log('   source database/15-fase-(10-03-2026)-v1-7391.sql');
    console.log('');
    console.log('Para verificar la carga:');
    console.log('   source database/15-fase-verificacion.sql');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
