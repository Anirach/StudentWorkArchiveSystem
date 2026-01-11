const Database = require('./backend/node_modules/better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'backend/data/archive.db'));

// Check current count
const currentCount = db.prepare('SELECT COUNT(*) as count FROM works').get().count;
console.log(`Current works count: ${currentCount}`);

// Create 100 bulk works
const insert = db.prepare(`
  INSERT INTO works (title, author_name, description, academic_year, google_file_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const transaction = db.transaction((count) => {
  for (let i = 1; i <= count; i++) {
    insert.run(
      `Bulk Work ${i}`,
      `Bulk Author ${i}`,
      `This is a bulk generated work ${i} for performance testing`,
      2024,
      `bulk_file_id_${i}`
    );
  }
});

const toCreate = Math.max(0, 110 - currentCount);
if (toCreate > 0) {
  transaction(toCreate);
  console.log(`Created ${toCreate} bulk works`);
} else {
  console.log('Already have 110+ works, skipping bulk creation');
}

const newCount = db.prepare('SELECT COUNT(*) as count FROM works').get().count;
console.log(`New works count: ${newCount}`);

db.close();
