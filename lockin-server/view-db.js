const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'waitlist.db'));

console.log('--- LockIn Waitlist Database Dump ---');
db.all('SELECT * FROM waitlist ORDER BY joinedAt DESC', (err, rows) => {
    if (err) {
        console.error('Error reading database:', err.message);
    } else {
        if (rows.length === 0) {
            console.log('The waitlist is currently empty.');
        } else {
            console.table(rows);
            console.log(`\nTotal signups: ${rows.length}`);
        }
    }
    db.close();
});
