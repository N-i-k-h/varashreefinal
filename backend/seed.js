const mongoose = require('mongoose');
require('dotenv').config();
const Plant = require('./models/Plant');

const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/varashree';

const seed = async () => {
  await mongoose.connect(MONGO);
  await Plant.deleteMany({});

  const plants = [
    {
      plantName: 'Snake Plant',
      botanicalName: 'Sansevieria trifasciata',
      description: 'Hardy indoor plant, low water needs. Great air purifier.',
      price: 399,
      stock: 20,
      size: 'Medium',
      light: 'Low to Bright Indirect',
      water: 'Low',
      category: 'Indoor',
      image: '/images/snake-plant.jpg'
    },
    {
      plantName: 'Money Plant',
      botanicalName: 'Epipremnum aureum',
      description: 'Trailing vine, easy to care. Great for baskets and shelves.',
      price: 199,
      stock: 35,
      size: 'Small',
      light: 'Bright Indirect',
      water: 'Moderate',
      category: 'Indoor',
      image: '/images/money-plant.jpg'
    },
    {
      plantName: 'Rubber Plant',
      botanicalName: 'Ficus elastica',
      description: 'Large glossy leaves, great statement plant.',
      price: 899,
      stock: 8,
      size: 'Large',
      light: 'Bright Indirect',
      water: 'Moderate',
      category: 'Indoor',
      image: '/images/rubber-plant.jpg'
    },
    {
      plantName: 'Aloe Vera',
      botanicalName: 'Aloe vera',
      description: 'Low maintenance succulent with medicinal uses.',
      price: 149,
      stock: 50,
      size: 'Small',
      light: 'Full Sun to Partial Shade',
      water: 'Low',
      category: 'Outdoor',
      image: '/images/aloe-vera.jpg'
    },
    {
      plantName: 'Peace Lily',
      botanicalName: 'Spathiphyllum',
      description: 'Beautiful white flowers, does well indoors.',
      price: 349,
      stock: 12,
      size: 'Medium',
      light: 'Low to Bright Indirect',
      water: 'Moderate',
      category: 'Indoor',
      image: '/images/peace-lily.jpg'
    }
  ];

  await Plant.insertMany(plants);
  console.log('Seeded plants');
  mongoose.disconnect();
};

seed().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
