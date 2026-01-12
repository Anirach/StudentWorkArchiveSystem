import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../data/archive.db');
console.log('Seeding database at:', dbPath);

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Sample users
const sampleUsers = [
  { google_id: 'sample_user_1', email: 'student1@university.edu', name: 'Alice Johnson', role: 'user' },
  { google_id: 'sample_user_2', email: 'student2@university.edu', name: 'Bob Smith', role: 'user' },
  { google_id: 'sample_user_3', email: 'student3@university.edu', name: 'Carol Williams', role: 'user' },
  { google_id: 'sample_user_4', email: 'student4@university.edu', name: 'David Brown', role: 'user' },
  { google_id: 'sample_user_5', email: 'professor@university.edu', name: 'Dr. Emily Davis', role: 'user' },
];

// Sample works
const sampleWorks = [
  {
    title: 'AI-Powered Student Attendance System',
    description: 'A comprehensive attendance management system using facial recognition technology. Built with Python, TensorFlow, and React. Features include real-time face detection, automatic attendance marking, and detailed analytics dashboard.',
    author_name: 'Alice Johnson',
    author_email: 'student1@university.edu',
    academic_year: '2024',
    work_type_id: 1, // Project
    category_id: 1, // Computer Science
    google_file_id: 'sample_file_001',
    file_url: 'https://drive.google.com/file/d/sample_file_001/view',
    thumbnail_url: null,
    file_size: 2500000,
    page_count: 45,
    view_count: 156,
    download_count: 23,
    is_featured: 1,
    is_public: 1,
  },
  {
    title: 'Smart Home IoT Control System',
    description: 'An Internet of Things project that enables smart home automation. Control lights, temperature, and security systems through a mobile app. Utilizes ESP32 microcontrollers, MQTT protocol, and Flutter for cross-platform mobile development.',
    author_name: 'Bob Smith',
    author_email: 'student2@university.edu',
    academic_year: '2024',
    work_type_id: 1, // Project
    category_id: 1, // Computer Science
    google_file_id: 'sample_file_002',
    file_url: 'https://drive.google.com/file/d/sample_file_002/view',
    thumbnail_url: null,
    file_size: 1800000,
    page_count: 38,
    view_count: 89,
    download_count: 15,
    is_featured: 1,
    is_public: 1,
  },
  {
    title: 'Machine Learning for Crop Disease Detection',
    description: 'Research thesis on using deep learning to identify plant diseases from leaf images. Achieved 94% accuracy using convolutional neural networks trained on a dataset of 50,000+ images.',
    author_name: 'Carol Williams',
    author_email: 'student3@university.edu',
    academic_year: '2023',
    work_type_id: 3, // Thesis
    category_id: 3, // Research
    google_file_id: 'sample_file_003',
    file_url: 'https://drive.google.com/file/d/sample_file_003/view',
    thumbnail_url: null,
    file_size: 5200000,
    page_count: 120,
    view_count: 234,
    download_count: 67,
    is_featured: 1,
    is_public: 1,
  },
  {
    title: 'E-Commerce Platform Development Report',
    description: 'Technical report documenting the development of a full-stack e-commerce platform. Covers system design, database architecture, payment integration, and deployment strategies using AWS.',
    author_name: 'David Brown',
    author_email: 'student4@university.edu',
    academic_year: '2024',
    work_type_id: 2, // Report
    category_id: 1, // Computer Science
    google_file_id: 'sample_file_004',
    file_url: 'https://drive.google.com/file/d/sample_file_004/view',
    thumbnail_url: null,
    file_size: 3100000,
    page_count: 65,
    view_count: 45,
    download_count: 12,
    is_featured: 0,
    is_public: 1,
  },
  {
    title: 'Renewable Energy Systems Analysis',
    description: 'Engineering project analyzing the efficiency of solar and wind energy systems in tropical climates. Includes cost-benefit analysis and implementation recommendations for university campus.',
    author_name: 'Alice Johnson',
    author_email: 'student1@university.edu',
    academic_year: '2023',
    work_type_id: 1, // Project
    category_id: 2, // Engineering
    google_file_id: 'sample_file_005',
    file_url: 'https://drive.google.com/file/d/sample_file_005/view',
    thumbnail_url: null,
    file_size: 4500000,
    page_count: 85,
    view_count: 112,
    download_count: 34,
    is_featured: 0,
    is_public: 1,
  },
  {
    title: 'Mobile Banking App UI/UX Design',
    description: 'Presentation showcasing the complete UI/UX design process for a mobile banking application. Includes user research, wireframes, prototypes, and usability testing results.',
    author_name: 'Bob Smith',
    author_email: 'student2@university.edu',
    academic_year: '2024',
    work_type_id: 4, // Presentation
    category_id: 1, // Computer Science
    google_file_id: 'sample_file_006',
    file_url: 'https://drive.google.com/file/d/sample_file_006/view',
    thumbnail_url: null,
    file_size: 8500000,
    page_count: 42,
    view_count: 178,
    download_count: 45,
    is_featured: 1,
    is_public: 1,
  },
  {
    title: 'Blockchain-Based Voting System',
    description: 'A secure electronic voting system leveraging blockchain technology for transparency and immutability. Implements smart contracts on Ethereum and provides a user-friendly web interface.',
    author_name: 'Carol Williams',
    author_email: 'student3@university.edu',
    academic_year: '2024',
    work_type_id: 1, // Project
    category_id: 1, // Computer Science
    google_file_id: 'sample_file_007',
    file_url: 'https://drive.google.com/file/d/sample_file_007/view',
    thumbnail_url: null,
    file_size: 2900000,
    page_count: 55,
    view_count: 201,
    download_count: 38,
    is_featured: 0,
    is_public: 1,
  },
  {
    title: 'Natural Language Processing for Thai Text',
    description: 'Research paper on developing NLP models specifically optimized for Thai language processing. Covers tokenization, named entity recognition, and sentiment analysis.',
    author_name: 'Dr. Emily Davis',
    author_email: 'professor@university.edu',
    academic_year: '2023',
    work_type_id: 3, // Thesis
    category_id: 3, // Research
    google_file_id: 'sample_file_008',
    file_url: 'https://drive.google.com/file/d/sample_file_008/view',
    thumbnail_url: null,
    file_size: 6200000,
    page_count: 145,
    view_count: 312,
    download_count: 89,
    is_featured: 1,
    is_public: 1,
  },
  {
    title: 'Database Performance Optimization Techniques',
    description: 'Comprehensive report on database optimization strategies including indexing, query optimization, caching mechanisms, and horizontal scaling approaches.',
    author_name: 'David Brown',
    author_email: 'student4@university.edu',
    academic_year: '2024',
    work_type_id: 2, // Report
    category_id: 1, // Computer Science
    google_file_id: 'sample_file_009',
    file_url: 'https://drive.google.com/file/d/sample_file_009/view',
    thumbnail_url: null,
    file_size: 2100000,
    page_count: 48,
    view_count: 67,
    download_count: 19,
    is_featured: 0,
    is_public: 1,
  },
  {
    title: 'Structural Analysis of Earthquake-Resistant Buildings',
    description: 'Engineering thesis examining structural designs that minimize earthquake damage. Includes finite element analysis simulations and cost comparisons of different construction methods.',
    author_name: 'Alice Johnson',
    author_email: 'student1@university.edu',
    academic_year: '2022',
    work_type_id: 3, // Thesis
    category_id: 2, // Engineering
    google_file_id: 'sample_file_010',
    file_url: 'https://drive.google.com/file/d/sample_file_010/view',
    thumbnail_url: null,
    file_size: 7800000,
    page_count: 180,
    view_count: 145,
    download_count: 52,
    is_featured: 0,
    is_public: 1,
  },
];

// Work-tag mappings
const workTags = [
  { work_id: 1, tags: [3, 1] }, // AI Attendance: Machine Learning, Web Development
  { work_id: 2, tags: [5, 2] }, // Smart Home: IoT, Mobile App
  { work_id: 3, tags: [3, 4] }, // Crop Disease: Machine Learning, Data Science
  { work_id: 4, tags: [1, 6] }, // E-Commerce: Web Development, Database
  { work_id: 5, tags: [5] }, // Renewable Energy: IoT
  { work_id: 6, tags: [2] }, // Banking App: Mobile App
  { work_id: 7, tags: [1, 6] }, // Blockchain Voting: Web Development, Database
  { work_id: 8, tags: [3, 4] }, // NLP Thai: Machine Learning, Data Science
  { work_id: 9, tags: [6] }, // Database Optimization: Database
  { work_id: 10, tags: [] }, // Structural Analysis: No specific tags
];

// Sample comments
const sampleComments = [
  { work_id: 1, user_id: 2, content: 'Excellent implementation! The facial recognition accuracy is impressive. Did you consider adding mask detection for post-pandemic scenarios?' },
  { work_id: 1, user_id: 3, content: 'Great work! I would love to see the source code. Is it available on GitHub?' },
  { work_id: 1, user_id: 4, content: 'This could really help our department. Very practical project!' },
  { work_id: 2, user_id: 1, content: 'The MQTT implementation looks solid. Have you tested it with hundreds of devices?' },
  { work_id: 2, user_id: 5, content: 'Well-documented project. The architecture diagram is very clear.' },
  { work_id: 3, user_id: 1, content: 'Fascinating research! The 94% accuracy is remarkable. What was your training dataset size?' },
  { work_id: 3, user_id: 2, content: 'This could have real agricultural applications. Have you considered partnering with local farmers?' },
  { work_id: 3, user_id: 4, content: 'The methodology section is very thorough. Great thesis!' },
  { work_id: 6, user_id: 1, content: 'Beautiful UI design! The color scheme is very professional.' },
  { work_id: 6, user_id: 3, content: 'The user flow is intuitive. Did you conduct user testing?' },
  { work_id: 7, user_id: 5, content: 'Interesting application of blockchain. How do you handle scalability concerns?' },
  { work_id: 8, user_id: 2, content: 'This is important work for Thai NLP. The tokenization approach is innovative.' },
  { work_id: 8, user_id: 4, content: 'Comprehensive coverage of Thai language challenges. Excellent research!' },
];

// Sample votes (ratings 1-5)
const sampleVotes = [
  { work_id: 1, user_id: 2, stars: 5 },
  { work_id: 1, user_id: 3, stars: 4 },
  { work_id: 1, user_id: 4, stars: 5 },
  { work_id: 1, user_id: 5, stars: 5 },
  { work_id: 2, user_id: 1, stars: 4 },
  { work_id: 2, user_id: 3, stars: 4 },
  { work_id: 2, user_id: 5, stars: 5 },
  { work_id: 3, user_id: 1, stars: 5 },
  { work_id: 3, user_id: 2, stars: 5 },
  { work_id: 3, user_id: 4, stars: 4 },
  { work_id: 3, user_id: 5, stars: 5 },
  { work_id: 4, user_id: 1, stars: 3 },
  { work_id: 4, user_id: 3, stars: 4 },
  { work_id: 5, user_id: 2, stars: 4 },
  { work_id: 5, user_id: 4, stars: 4 },
  { work_id: 6, user_id: 1, stars: 5 },
  { work_id: 6, user_id: 2, stars: 5 },
  { work_id: 6, user_id: 4, stars: 4 },
  { work_id: 6, user_id: 5, stars: 5 },
  { work_id: 7, user_id: 1, stars: 4 },
  { work_id: 7, user_id: 3, stars: 5 },
  { work_id: 7, user_id: 5, stars: 4 },
  { work_id: 8, user_id: 1, stars: 5 },
  { work_id: 8, user_id: 2, stars: 5 },
  { work_id: 8, user_id: 3, stars: 5 },
  { work_id: 8, user_id: 4, stars: 4 },
  { work_id: 9, user_id: 1, stars: 3 },
  { work_id: 9, user_id: 5, stars: 4 },
  { work_id: 10, user_id: 2, stars: 4 },
  { work_id: 10, user_id: 3, stars: 4 },
];

// Sample favorites
const sampleFavorites = [
  { user_id: 1, work_id: 3 },
  { user_id: 1, work_id: 6 },
  { user_id: 1, work_id: 8 },
  { user_id: 2, work_id: 1 },
  { user_id: 2, work_id: 3 },
  { user_id: 2, work_id: 7 },
  { user_id: 3, work_id: 1 },
  { user_id: 3, work_id: 2 },
  { user_id: 3, work_id: 8 },
  { user_id: 4, work_id: 1 },
  { user_id: 4, work_id: 6 },
  { user_id: 5, work_id: 3 },
  { user_id: 5, work_id: 8 },
];

// Sample activity logs
const sampleActivityLogs = [
  { work_id: 1, user_id: 2, action: 'view', ip_address: '192.168.1.100' },
  { work_id: 1, user_id: 3, action: 'view', ip_address: '192.168.1.101' },
  { work_id: 1, user_id: 3, action: 'download', ip_address: '192.168.1.101' },
  { work_id: 1, user_id: 4, action: 'view', ip_address: '192.168.1.102' },
  { work_id: 2, user_id: 1, action: 'view', ip_address: '192.168.1.103' },
  { work_id: 2, user_id: 5, action: 'view', ip_address: '192.168.1.104' },
  { work_id: 3, user_id: 1, action: 'view', ip_address: '192.168.1.103' },
  { work_id: 3, user_id: 1, action: 'download', ip_address: '192.168.1.103' },
  { work_id: 3, user_id: 2, action: 'view', ip_address: '192.168.1.100' },
  { work_id: 3, user_id: 4, action: 'share', ip_address: '192.168.1.102' },
  { work_id: 6, user_id: 1, action: 'view', ip_address: '192.168.1.103' },
  { work_id: 6, user_id: 3, action: 'view', ip_address: '192.168.1.101' },
  { work_id: 6, user_id: 3, action: 'download', ip_address: '192.168.1.101' },
  { work_id: 8, user_id: 2, action: 'view', ip_address: '192.168.1.100' },
  { work_id: 8, user_id: 4, action: 'view', ip_address: '192.168.1.102' },
  { work_id: 8, user_id: 4, action: 'download', ip_address: '192.168.1.102' },
];

// Seed functions
const seedUsers = () => {
  console.log('Seeding users...');
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO users (google_id, email, name, role, is_active, created_at)
    VALUES (?, ?, ?, ?, 1, datetime('now'))
  `);

  for (const user of sampleUsers) {
    stmt.run(user.google_id, user.email, user.name, user.role);
  }
  console.log(`  Added ${sampleUsers.length} sample users`);
};

const seedWorks = () => {
  console.log('Seeding works...');
  const stmt = db.prepare(`
    INSERT INTO works (
      title, description, author_name, author_email, academic_year,
      work_type_id, category_id, google_file_id, file_url, thumbnail_url,
      file_size, page_count, view_count, download_count, is_featured, is_public,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now', '-' || ? || ' days'))
  `);

  const workIds = [];
  sampleWorks.forEach((work, index) => {
    const daysAgo = Math.floor(Math.random() * 180); // Random date within last 6 months
    const result = stmt.run(
      work.title, work.description, work.author_name, work.author_email, work.academic_year,
      work.work_type_id, work.category_id, work.google_file_id, work.file_url, work.thumbnail_url,
      work.file_size, work.page_count, work.view_count, work.download_count, work.is_featured, work.is_public,
      daysAgo, daysAgo
    );
    workIds.push(result.lastInsertRowid);
  });
  console.log(`  Added ${sampleWorks.length} sample works`);
  return workIds;
};

const seedWorkTags = (workIds) => {
  console.log('Seeding work tags...');
  const stmt = db.prepare('INSERT OR IGNORE INTO work_tags (work_id, tag_id) VALUES (?, ?)');

  let count = 0;
  workTags.forEach((wt, index) => {
    const workId = workIds[index];
    for (const tagId of wt.tags) {
      stmt.run(workId, tagId);
      count++;
    }
  });
  console.log(`  Added ${count} work-tag relationships`);
};

const seedComments = (workIds) => {
  console.log('Seeding comments...');

  // Get actual user IDs
  const users = db.prepare('SELECT id FROM users WHERE google_id LIKE ?').all('sample_user_%');
  if (users.length === 0) {
    console.log('  No sample users found, skipping comments');
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO comments (work_id, user_id, content, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now', '-' || ? || ' days'))
  `);

  for (const comment of sampleComments) {
    const workId = workIds[comment.work_id - 1];
    const userId = users[comment.user_id - 1]?.id;
    if (workId && userId) {
      const daysAgo = Math.floor(Math.random() * 30);
      stmt.run(workId, userId, comment.content, daysAgo, daysAgo);
    }
  }
  console.log(`  Added ${sampleComments.length} sample comments`);
};

const seedVotes = (workIds) => {
  console.log('Seeding votes...');

  const users = db.prepare('SELECT id FROM users WHERE google_id LIKE ?').all('sample_user_%');
  if (users.length === 0) {
    console.log('  No sample users found, skipping votes');
    return;
  }

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO votes (work_id, user_id, stars, created_at)
    VALUES (?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);

  for (const vote of sampleVotes) {
    const workId = workIds[vote.work_id - 1];
    const userId = users[vote.user_id - 1]?.id;
    if (workId && userId) {
      const daysAgo = Math.floor(Math.random() * 60);
      stmt.run(workId, userId, vote.stars, daysAgo);
    }
  }
  console.log(`  Added ${sampleVotes.length} sample votes`);
};

const seedFavorites = (workIds) => {
  console.log('Seeding favorites...');

  const users = db.prepare('SELECT id FROM users WHERE google_id LIKE ?').all('sample_user_%');
  if (users.length === 0) {
    console.log('  No sample users found, skipping favorites');
    return;
  }

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO favorites (user_id, work_id, created_at)
    VALUES (?, ?, datetime('now', '-' || ? || ' days'))
  `);

  for (const fav of sampleFavorites) {
    const workId = workIds[fav.work_id - 1];
    const userId = users[fav.user_id - 1]?.id;
    if (workId && userId) {
      const daysAgo = Math.floor(Math.random() * 30);
      stmt.run(userId, workId, daysAgo);
    }
  }
  console.log(`  Added ${sampleFavorites.length} sample favorites`);
};

const seedActivityLogs = (workIds) => {
  console.log('Seeding activity logs...');

  const users = db.prepare('SELECT id FROM users WHERE google_id LIKE ?').all('sample_user_%');
  if (users.length === 0) {
    console.log('  No sample users found, skipping activity logs');
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO activity_logs (work_id, user_id, action, ip_address, created_at)
    VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);

  for (const log of sampleActivityLogs) {
    const workId = workIds[log.work_id - 1];
    const userId = users[log.user_id - 1]?.id;
    if (workId && userId) {
      const daysAgo = Math.floor(Math.random() * 14);
      stmt.run(workId, userId, log.action, log.ip_address, daysAgo);
    }
  }
  console.log(`  Added ${sampleActivityLogs.length} sample activity logs`);
};

// Run seeding
try {
  console.log('\n========================================');
  console.log('Starting database seeding...');
  console.log('========================================\n');

  seedUsers();
  const workIds = seedWorks();
  seedWorkTags(workIds);
  seedComments(workIds);
  seedVotes(workIds);
  seedFavorites(workIds);
  seedActivityLogs(workIds);

  console.log('\n========================================');
  console.log('Database seeding complete!');
  console.log('========================================\n');

  // Print summary
  const summary = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    works: db.prepare('SELECT COUNT(*) as count FROM works').get().count,
    comments: db.prepare('SELECT COUNT(*) as count FROM comments').get().count,
    votes: db.prepare('SELECT COUNT(*) as count FROM votes').get().count,
    favorites: db.prepare('SELECT COUNT(*) as count FROM favorites').get().count,
    activity_logs: db.prepare('SELECT COUNT(*) as count FROM activity_logs').get().count,
  };

  console.log('Database Summary:');
  console.log('-----------------');
  Object.entries(summary).forEach(([table, count]) => {
    console.log(`  ${table}: ${count} records`);
  });

} catch (error) {
  console.error('Seeding failed:', error);
  process.exit(1);
} finally {
  db.close();
}
