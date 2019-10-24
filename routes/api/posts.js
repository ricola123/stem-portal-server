const express = require('express');
const mongodb = require('mongodb');

const router = express.Router();

const uri = "mongodb+srv://stem-portal-dev:stem-portal-dev@stem-portal-dx28y.gcp.mongodb.net/test?retryWrites=true&w=majority";

//Get Posts
router.get('/', async(req, res) => {
    const posts = await loadPostsCollection();
    res.send(await posts.find({}).toArray());
});

//Add Posts
router.post('/', async(req, res) => {
    const posts = await loadPostsCollection();
    await posts.insertOne({
        text: req.body.text,
        createdAt: new Date()
    });
    res.status(201).send();
});

//Delete Posts
router.delete('/:id', async(req, res) => {
    const posts = await loadPostsCollection();
    await posts.deleteOne({ _id: new mongodb.ObjectID(req.params.id) });
    res.status(200).send();
});

async function loadPostsCollection() {
    const client = await mongodb.MongoClient.connect(
        uri, 
        { useNewUrlParser: true }
    );
    return client.db('test').collection('devices');
}

module.exports = router;