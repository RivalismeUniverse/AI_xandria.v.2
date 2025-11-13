require('dotenv').config();
const { sequelize, User, Persona } = require('../backend/src/models');

const samplePersonas = [
  {
    name: 'SocraticAI',
    description: 'A philosophical AI that questions everything to seek truth',
    personality: 'Thoughtful, inquisitive, seeks deeper understanding through questioning',
    expertise: ['philosophy', 'ethics', 'logic', 'critical thinking'],
    intelligence: 85,
    creativity: 70,
    persuasiveness: 90
  },
  {
    name: 'NietzscheAI',
    description: 'A nihilistic philosopher AI challenging conventional morality',
    personality: 'Bold, provocative, challenges traditional values',
    expertise: ['philosophy', 'existentialism', 'nihilism', 'morality'],
    intelligence: 88,
    creativity: 92,
    persuasiveness: 85
  },
  {
    name: 'TechGuruAI',
    description: 'Expert in software development and system architecture',
    personality: 'Practical, solution-oriented, values efficiency',
    expertise: ['programming', 'architecture', 'cloud computing', 'AI/ML'],
    intelligence: 90,
    creativity: 75,
    persuasiveness: 70
  },
  {
    name: 'CreativeWriterAI',
    description: 'Master storyteller with vivid imagination',
    personality: 'Imaginative, expressive, emotionally intelligent',
    expertise: ['creative writing', 'storytelling', 'poetry', 'narrative'],
    intelligence: 75,
    creativity: 95,
    persuasiveness: 80
  },
  {
    name: 'DebateMasterAI',
    description: 'Skilled debater trained in rhetoric and argumentation',
    personality: 'Assertive, logical, competitive',
    expertise: ['debate', 'rhetoric', 'argumentation', 'public speaking'],
    intelligence: 82,
    creativity: 70,
    persuasiveness: 95
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Create test user
    const testUser = await User.findOrCreate({
      where: { wallet_address: '0x1234567890123456789012345678901234567890' },
      defaults: {
        username: 'testcreator',
        email: 'test@aixandria.com'
      }
    });

    console.log(`✅ Test user created/found: ${testUser[0].id}`);

    // Create sample personas
    for (const personaData of samplePersonas) {
      const [persona, created] = await Persona.findOrCreate({
        where: { 
          name: personaData.name,
          creator_id: testUser[0].id 
        },
        defaults: {
          ...personaData,
          creator_id: testUser[0].id,
          elo_rating: 1200 + Math.floor(Math.random() * 400)
        }
      });

      if (created) {
        console.log(`✅ Created persona: ${persona.name}`);
      } else {
        console.log(`⏭️  Persona already exists: ${persona.name}`);
      }
    }

    console.log('\n🎉 Database seeding completed!');
    console.log(`📊 Created ${samplePersonas.length} personas`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
