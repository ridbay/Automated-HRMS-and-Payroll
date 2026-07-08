const { drizzle } = require('drizzle-orm/lib/d1');

const db = drizzle({});
try {
  db.insert(undefined).values({});
} catch (err) {
  console.log(err.stack);
}
