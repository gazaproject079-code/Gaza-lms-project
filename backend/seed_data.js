const { LibraryItem, ForumChannel, ForumMessage, User } = require('./models');

const seedData = async () => {
  try {
    // Need at least one user for references
    let admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
       admin = await User.findOne({ where: { role: 'superadmin' } });
    }
    if (!admin) {
       admin = await User.findOne();
    }
    
    if (!admin) {
      console.log('No user found to set as creator. Exiting.');
      return;
    }

    console.log('Seeding Library Items...');
    await LibraryItem.bulkCreate([
      {
        title: 'Introduction to Islamic Studies',
        description: 'A comprehensive guide for beginners in Islamic education.',
        type: 'pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        status: 'approved',
        uploadedBy: admin.id,
        approvedBy: admin.id,
      },
      {
        title: 'Basic Anatomy for Medicine Students',
        description: 'Core concepts of human anatomy.',
        type: 'pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        status: 'approved',
        uploadedBy: admin.id,
        approvedBy: admin.id,
      },
      {
        title: 'The Principles of First Aid',
        description: 'Crucial first aid techniques for emergency situations.',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        status: 'approved',
        uploadedBy: admin.id,
        approvedBy: admin.id,
      }
    ]);

    console.log('Seeding Forum Channels...');
    const channels = await ForumChannel.bulkCreate([
      {
        name: 'General Discussion',
        description: 'A place for everyone to discuss learning topics.',
        type: 'public',
        adminOnly: false,
        createdBy: admin.id,
      },
      {
        name: 'Medical Students Lounge',
        description: 'Discussion specifically for medicine.',
        type: 'public',
        adminOnly: false,
        createdBy: admin.id,
      },
      {
        name: 'Announcements',
        description: 'Important updates from the administration.',
        type: 'adminOnly',
        adminOnly: true,
        createdBy: admin.id,
      }
    ]);

    console.log('Seeding Forum Messages...');
    await ForumMessage.bulkCreate([
      {
        channelId: channels[0].id,
        senderId: admin.id,
        content: 'Welcome to the General Discussion channel!'
      },
      {
        channelId: channels[1].id,
        senderId: admin.id,
        content: 'Feel free to share your medical study resources here.'
      },
      {
        channelId: channels[2].id,
        senderId: admin.id,
        content: 'System update scheduled for tonight.'
      }
    ]);

    console.log('Seed data added successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit(0);
  }
};

seedData();
