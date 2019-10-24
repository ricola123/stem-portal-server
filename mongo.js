const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://stem-portal-dev:stem-portal-dev@stem-portal-dx28y.gcp.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });

client.connect(uri, function(err, client) {
    if(err) {
        console.log("Error occurred!", err)
    }
    console.log("Connected...")
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object
    collection.insert({name: 'rico'})
    client.close();
});

console.log('1312321')