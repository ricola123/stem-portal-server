const express = require('express');
const mongodb = require('mongodb');

const router = express.Router();

const uri = "mongodb+srv://stem-portal-dev:stem-portal-dev@stem-portal-dx28y.gcp.mongodb.net/test?retryWrites=true&w=majority";

//Get Posts
router.get('/', async(req, res) => {
    const users = await loadUsersCollection();
    res.send(await users.find({}).toArray());
});

//Register New User
router.post('/', async(req, res) => {
    const users = await loadUsersCollection();
    const { username, password } = req.body
    await users.insertOne({
        username: username,
        password: password,
        createdAt: new Date()
    });
    res.status(201).send();
});

async function loadUsersCollection() {
    const client = await mongodb.MongoClient.connect(
        uri, 
        { useNewUrlParser: true }
    );
    return client.db('stem-portal').collection('users');
}

module.exports = router;