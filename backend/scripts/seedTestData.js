// Standalone script: seeds demo students + a demo sponsor for end-to-end testing
// of the sponsorship flow. Idempotent (keyed on email). Run: npm run seed:test
require('dotenv').config();
const { sequelize, User, DailyActivity, StudentUpload } = require('../models');

const PASSWORD = 'Test@123';

const STUDENTS = [
  { name: 'Aisha Khalil', email: 'aisha.student@test.com', location: 'Gaza, Palestine', isWarZone: true },
  { name: 'Yusuf Haddad', email: 'yusuf.student@test.com', location: 'Gaza, Palestine', isWarZone: true },
  { name: 'Omar Farouk',  email: 'omar.student@test.com',  location: 'Cairo, Egypt',     isWarZone: false },
  { name: 'Fatima Noor',  email: 'fatima.student@test.com', location: 'Istanbul, Turkey', isWarZone: false },
];

const SPONSOR = { name: 'Sponsor Demo', email: 'sponsor@test.com', location: 'London, UK' };
const INSTRUCTOR = { name: 'Instructor Demo', email: 'instructor@test.com', location: 'Amman, Jordan' };

async function ensureUser(data, role) {
  const [user, created] = await User.findOrCreate({
    where: { email: data.email },
    defaults: {
      ...data,
      role,
      password: PASSWORD,
      isActive: true,
      emailVerified: true,
      authProvider: 'local',
    },
  });
  if (!created) {
    user.password = PASSWORD;
    user.role = role;
    user.isActive = true;
    user.emailVerified = true;
    await user.save();
  }
  console.log(`${created ? 'Created' : 'Updated'} ${role}: ${data.email}`);
  return user;
}

async function seedAttendance(userId) {
  const existing = await DailyActivity.count({ where: { userId } });
  if (existing > 0) return;
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const activityDate = d.toISOString().slice(0, 10);
    await DailyActivity.findOrCreate({ where: { userId, activityDate }, defaults: { userId, activityDate } });
  }
}

async function seedUpload(userId, name) {
  const existing = await StudentUpload.count({ where: { userId } });
  if (existing > 0) return;
  await StudentUpload.create({
    userId,
    title: `${name} — School Record.pdf`,
    description: 'Latest school transcript shared for sponsors.',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    type: 'document',
  });
}

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    for (const s of STUDENTS) {
      const student = await ensureUser(s, 'student');
      await seedAttendance(student.id);
      await seedUpload(student.id, s.name);
    }

    await ensureUser(SPONSOR, 'sponsor');
    await ensureUser(INSTRUCTOR, 'instructor');

    console.log('\n✅ Test data seeded.');
    console.log('   Instructor login: instructor@test.com / Test@123');
    console.log('   Sponsor login:    sponsor@test.com / Test@123');
    console.log('   Student logins:   *.student@test.com / Test@123');
  } catch (err) {
    console.error('Seed test data error:', err);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
})();
