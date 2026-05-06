const argon2 = require('argon2');

/**
 * Ensures a SUPER_ADMIN user exists.
 * Requires SUPER_ADMIN_EMAIL in the environment; skips silently if not set.
 * SUPER_ADMIN_NAME is optional and defaults to 'Super Admin'.
 * SUPER_ADMIN_PASSWORD is required now that Google OAuth is disabled.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 */
async function seedSuperAdmin(prisma) {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const name = process.env.SUPER_ADMIN_NAME ?? 'Super Admin';
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const username= process.env.SUPER_ADMIN_USERNAME;

  if (!email) {
    console.log('[seed] SUPER_ADMIN_EMAIL not set \u2014 skipping super admin seed.');
    return;
  }

  if (!password) {
    console.warn('[seed] SUPER_ADMIN_PASSWORD not set \u2014 admin will have no password and cannot log in.');
  }

  if (!username) {
    console.error('[seed] SUPER_ADMIN_USERNAME not set \u2014 skipping super admin seed.');
    return;
  }

  if (username.length < 3 || username.length > 30) {
    console.error(`[seed] SUPER_ADMIN_USERNAME "${username}" must be 3-30 characters \u2014 skipping.`);
    return;
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    console.error(`[seed] SUPER_ADMIN_USERNAME "${username}" must only contain lowercase letters, numbers and underscores \u2014 skipping.`);
    return;
  }

  const passwordHash = password ? await argon2.hash(password) : undefined;

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      globalRole: 'SUPER_ADMIN',
      username,
      ...(passwordHash ? { passwordHash } : {}),
    },
    update: {
      globalRole: 'SUPER_ADMIN',
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  console.log(`[seed] Super admin ensured: ${user.email} (${user.id})`);
}

// Run standalone: node prisma/seeds/super-admin.seed.js
if (require.main === module) {
  const { runStandalone } = require('./seed-runner');
  runStandalone(module.exports);
}

module.exports = { fn: seedSuperAdmin };
