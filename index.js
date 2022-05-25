const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forviden access' })
        }
        req.decoded = decoded;
        next()
    });
}
// Database cunnection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ujpdfsf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const produtcsCollection = client.db('radon-electronics').collection('Products');
        const usersCollection = client.db('radon-electronics').collection('users');

        // add product api
        app.post('/product', async (req, res) => {
            const product = req.body;
            const result = await produtcsCollection.insertOne(product);
            res.send(result)
        })


        // get all products api
        app.get('/products', async (req, res) => {
            const product = await produtcsCollection.find().toArray();
            res.send(product);
        })

        // create user api
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign(user, process.env.ACCESS_SECRET, { expiresIn: '1h' });
            res.send({ result, token });
        })

        // get All Users api
        app.get('/users', verifyJwt, async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users)
        })

    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Welcome to Radon Electronics')
})

app.listen(port, () => {
    console.log(`Radon Electronics listening on port ${port}`)
})