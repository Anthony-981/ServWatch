/**
 * Migration: Add userId to existing tables
 * This script handles adding userId columns to tables with existing data
 */

import sequelize from '../config/database.js';

async function migrate() {
  try {
    console.log('Starting migration...');

    // Check if there are existing users
    const [users] = await sequelize.query('SELECT id, role FROM users ORDER BY "createdAt" ASC LIMIT 1');

    if (users.length === 0) {
      console.log('No users found. Please create a user first.');
      return;
    }

    // Get the first admin or regular user as the default owner
    const defaultUser = users[0];
    console.log(`Using default user: ${defaultUser.id} (role: ${defaultUser.role})`);

    // Step 1: Add userId columns as nullable first
    console.log('Adding userId columns as nullable...');

    await sequelize.query(`
      ALTER TABLE targets ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES users(id) ON DELETE CASCADE;
    `);

    await sequelize.query(`
      ALTER TABLE alerts ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES users(id) ON DELETE CASCADE;
    `);

    await sequelize.query(`
      ALTER TABLE alert_history ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES users(id) ON DELETE CASCADE;
    `);

    await sequelize.query(`
      ALTER TABLE metrics ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES users(id) ON DELETE CASCADE;
    `);

    console.log('userId columns added as nullable.');

    // Step 2: Update existing rows to have the default user
    console.log('Updating existing records...');

    const result1 = await sequelize.query(`
      UPDATE targets SET "userId" = :userId WHERE "userId" IS NULL
    `, { replacements: { userId: defaultUser.id } });
    console.log(`Updated ${result1[0].rowCount} targets`);

    const result2 = await sequelize.query(`
      UPDATE alerts SET "userId" = :userId WHERE "userId" IS NULL
    `, { replacements: { userId: defaultUser.id } });
    console.log(`Updated ${result2[0].rowCount} alerts`);

    const result3 = await sequelize.query(`
      UPDATE alert_history SET "userId" = :userId WHERE "userId" IS NULL
    `, { replacements: { userId: defaultUser.id } });
    console.log(`Updated ${result3[0].rowCount} alert_history records`);

    const result4 = await sequelize.query(`
      UPDATE metrics SET "userId" = :userId WHERE "userId" IS NULL
    `, { replacements: { userId: defaultUser.id } });
    console.log(`Updated ${result4[0].rowCount} metrics`);

    // Step 3: Make columns NOT NULL
    console.log('Making userId columns NOT NULL...');

    await sequelize.query(`
      ALTER TABLE targets ALTER COLUMN "userId" SET NOT NULL;
    `);

    await sequelize.query(`
      ALTER TABLE alerts ALTER COLUMN "userId" SET NOT NULL;
    `);

    await sequelize.query(`
      ALTER TABLE alert_history ALTER COLUMN "userId" SET NOT NULL;
    `);

    await sequelize.query(`
      ALTER TABLE metrics ALTER COLUMN "userId" SET NOT NULL;
    `);

    // Step 4: Create indexes
    console.log('Creating indexes...');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_targets_userId ON targets("userId");
      CREATE INDEX IF NOT EXISTS idx_targets_userId_enabled ON targets("userId", "enabled");
      CREATE INDEX IF NOT EXISTS idx_alerts_userId ON alerts("userId");
      CREATE INDEX IF NOT EXISTS idx_alerts_userId_enabled ON alerts("userId", "enabled");
      CREATE INDEX IF NOT EXISTS idx_alert_history_userId ON alert_history("userId");
      CREATE INDEX IF NOT EXISTS idx_alert_history_userId_createdAt ON alert_history("userId", "createdAt");
      CREATE INDEX IF NOT EXISTS idx_metrics_userId ON metrics("userId");
      CREATE INDEX IF NOT EXISTS idx_metrics_userId_timestamp ON metrics("userId", "timestamp");
    `);

    // Add comments
    await sequelize.query(`
      COMMENT ON COLUMN targets."userId" IS 'Owner of this target';
      COMMENT ON COLUMN alerts."userId" IS 'Owner of this alert';
      COMMENT ON COLUMN alert_history."userId" IS 'Owner of this alert history record';
      COMMENT ON COLUMN metrics."userId" IS 'Owner of this metric';
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate().then(() => {
  process.exit(0);
});
