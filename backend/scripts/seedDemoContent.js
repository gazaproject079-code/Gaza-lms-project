const { LibraryItem, ForumChannel, User } = require('../models');

// Idempotent seeding of demo Library books and Forum channels so the platform
// always has content for the two areas of study (Medicine & Islamic Education).
const LIBRARY_BOOKS = [
  {
    title: 'Introduction to Islamic Studies',
    description: 'A comprehensive beginner-friendly guide to the foundations of Islamic education.',
    type: 'pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'The Principles of Tajweed',
    description: 'Learn the rules of Quranic recitation in this structured reference.',
    type: 'pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Basic Human Anatomy for Medical Students',
    description: 'Core concepts of human anatomy explained clearly for first-year learners.',
    type: 'pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Emergency First Aid Essentials',
    description: 'Crucial first-aid techniques for emergency and conflict-zone situations.',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
];

const FORUM_CHANNELS = [
  {
    name: 'General Discussion',
    description: 'A place for everyone to discuss learning and support each other.',
    type: 'public',
    adminOnly: false,
  },
  {
    name: 'Medical Students Lounge',
    description: 'Share resources and questions about Medicine.',
    type: 'public',
    adminOnly: false,
  },
  {
    name: 'Announcements',
    description: 'Important updates from the administration.',
    type: 'adminOnly',
    adminOnly: true,
  },
];

async function seedDemoContent() {
  // Find a creator (admin/superadmin) to own the seeded content.
  let creator = await User.findOne({ where: { role: 'superadmin' } });
  if (!creator) creator = await User.findOne({ where: { role: 'instructor' } });
  if (!creator) {
    console.log('seedDemoContent: no admin/superadmin found yet — skipping');
    return;
  }

  for (const book of LIBRARY_BOOKS) {
    const [, created] = await LibraryItem.findOrCreate({
      where: { title: book.title },
      defaults: {
        ...book,
        status: 'approved',
        uploadedBy: creator.id,
        approvedBy: creator.id,
      },
    });
    if (created) console.log(`Seeded library book: ${book.title}`);
  }

  for (const channel of FORUM_CHANNELS) {
    const [, created] = await ForumChannel.findOrCreate({
      where: { name: channel.name },
      defaults: { ...channel, createdBy: creator.id },
    });
    if (created) console.log(`Seeded forum channel: ${channel.name}`);
  }
}

module.exports = seedDemoContent;
