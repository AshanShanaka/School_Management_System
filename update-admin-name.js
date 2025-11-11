const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminName() {
    try {
        console.log('🔄 Updating admin user name...');

        const admin = await prisma.admin.update({
            where: { username: 'admin' },
            data: {
                name: 'Admin',
                surname: 'User',
            },
        });

        console.log('✅ Admin user updated successfully!');
        console.log('Name:', admin.name, admin.surname);
        console.log('Email:', admin.email);
        console.log('Username:', admin.username);

    } catch (error) {
        console.error('❌ Error updating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateAdminName();
