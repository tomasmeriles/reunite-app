/**
 * Ensures a SUPER_ADMIN user exists.
 * Requires SUPER_ADMIN_EMAIL in the environment; skips silently if not set.
 * SUPER_ADMIN_NAME is optional and defaults to 'Super Admin'.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 */
async function seedSuperAdmin(prisma) {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const name = process.env.SUPER_ADMIN_NAME ?? 'Super Admin';
  
  if (!email) {
    console.log('[seed] SUPER_ADMIN_EMAIL not set \u2014 skipping super admin seed.');
    return;
  }
  const username = (email.split('@')[0] ?? 'user')
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '_')
              .slice(0, 28) +
            '_' +
            Math.random().toString(36).slice(2, 6);
  
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, globalRole: 'SUPER_ADMIN', username },
    update: { globalRole: 'SUPER_ADMIN' },
  });

  console.log(`[seed] Super admin ensured: ${user.email} (${user.id})`);
}

// Run standalone: node prisma/seeds/super-admin.seed.js
if (require.main === module) {
  const { runStandalone } = require('./seed-runner');
  runStandalone(module.exports);
}

module.exports = { fn: seedSuperAdmin };
