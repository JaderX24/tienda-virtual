const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const usuario = await prisma.usuario.findUnique({
        where: { correo: 'admin@tiendavirtual.hn' },
        include: { rol: true }
    });
    console.log('Usuario:', JSON.stringify(usuario, null, 2));
    
    const roles = await prisma.rol.findMany();
    console.log('Roles:', JSON.stringify(roles, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
