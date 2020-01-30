const mongoose = require('mongoose');

module.exports = async () => {
  mongoose.set('useCreateIndex', true);
  mongoose.set('useUnifiedTopology', true);

  await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Connection to DB error:'));

  return db;
}