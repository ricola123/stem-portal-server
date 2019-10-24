const express = require('express');
const mongodb = require('mongodb');

const router = express.Router();

const uri = "mongodb+srv://stem-portal-dev:stem-portal-dev@stem-portal-dx28y.gcp.mongodb.net/test?retryWrites=true&w=majority";

router.get('/', async(req, res) => {
    const posts = await loadPostsCollection();
    res.send(await posts.find({}).toArray());
});

async function loadPostsCollection() {
    const client = await mongodb.MongoClient.connect(
        uri, 
        { useNewUrlParser: true }
    );
    return client.db('test').collection('devices');
}

module.exports = router;