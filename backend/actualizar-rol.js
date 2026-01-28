const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Actualizar el código del rol a minúsculas
    const rolActualizado = await prisma.rol.update({
        where: { id: 1 },
        data: { codigo: 'admin' }
    });
    console.log('✅ Rol actualizado:', JSON.stringify(rolActualizado, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
