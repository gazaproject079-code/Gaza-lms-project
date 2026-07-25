const { sequelize } = require('../config/database');

// Safely renames the legacy 'admin' role to 'instructor'.
// Idempotent: can run on every startup without harm.
async function migrateAdminToInstructor() {
  const qi = sequelize.getQueryInterface();
  const table = 'users';

  // 1. Temporarily allow BOTH 'admin' and 'instructor' in the enum so the
  //    UPDATE below is valid regardless of the current column definition.
  await sequelize.query(
    "ALTER TABLE `users` MODIFY COLUMN `role` " +
    "ENUM('student','admin','instructor','superadmin','sponsor') NOT NULL DEFAULT 'student'"
  );

  // 2. Migrate any existing 'admin' rows to 'instructor'.
  const [, meta] = await sequelize.query(
    "UPDATE `users` SET `role` = 'instructor' WHERE `role` = 'admin'"
  );
  const affected = (meta && (meta.affectedRows ?? meta.rowCount)) || 0;
  if (affected > 0) console.log(`Migrated ${affected} admin user(s) to instructor`);

  // 3. Normalise any invalid/empty role (e.g. legacy 'expert' rows that became
  //    '' when the enum was tightened) to the safe default 'student'.
  const [, fixMeta] = await sequelize.query(
    "UPDATE `users` SET `role` = 'student' " +
    "WHERE `role` NOT IN ('student','instructor','superadmin','sponsor')"
  );
  const fixed = (fixMeta && (fixMeta.affectedRows ?? fixMeta.rowCount)) || 0;
  if (fixed > 0) console.log(`Normalised ${fixed} user(s) with an invalid role to student`);

  // 4. Finalise the enum to the four supported roles (drop 'admin').
  await sequelize.query(
    "ALTER TABLE `users` MODIFY COLUMN `role` " +
    "ENUM('student','instructor','superadmin','sponsor') NOT NULL DEFAULT 'student'"
  );
}

module.exports = migrateAdminToInstructor;
