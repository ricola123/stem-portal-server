const mongoose = require('mongoose');

const conn = mongoose.createConnection(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

conn.on('error', console.error.bind(console, 'Connection to DB error:'));

let gfs = new Promise((resolve, reject) => {
  conn.once("open", () => {
    resolve(new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: "uploads"
    }));
  });
});

module.exports = { conn, gfs: async () => await gfs }