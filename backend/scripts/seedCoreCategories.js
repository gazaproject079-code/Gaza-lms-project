const { Category } = require('../models');

// The platform launches with exactly two areas of study.
// We only ensure these exist; we never delete admin-created extras here.
const CORE_CATEGORIES = ['Medicine', 'Islamic Education'];

async function seedCoreCategories() {
  for (const name of CORE_CATEGORIES) {
    const [category, created] = await Category.findOrCreate({
      where: { name },
      defaults: { name }
    });
    if (created) {
      console.log(`Seeded core category: ${name}`);
    }
  }
}

module.exports = seedCoreCategories;
