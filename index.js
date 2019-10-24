// ./src/index.js

// importing the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const MongoClient = require('mongodb').MongoClient;

// defining the Express app
const app = express();

// defining an array to work as the database (temporary solution)
const ads = [
  {title: 'Hello, world (again)!'}
];

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

// defining an endpoint to return all ads
app.get('/', (req, res) => {
  res.send(ads);
});

// starting the server
app.listen(8081, () => {
  console.log('listening on port 8081');
});

const uri = "mongodb+srv://stem-portal-dev:stem-portal-dev@stem-portal-dx28y.gcp.mongodb.net/test?retryWrites=true&w=majority";

MongoClient.connect(uri, function(err, client) {
    
    if(err) {
        console.log("Error occurred!", err)
    }
    console.log("Connected...")
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object
    collection.insertOne({name: 'chow'})
    client.close();
    
});

console.log("FUCK U GIT");