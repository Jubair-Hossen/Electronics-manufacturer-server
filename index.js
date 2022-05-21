const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
// const { MongoClient, ServerApiVersion } = require('mongodb');

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

// async function run() {
//     try {
//         await client.connect();
//         const serviceCollection = client.db('doctors_portal').collection('services');

//     }
//     finally {

//     }
// }

// run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Welcome to Radon Electronics')
})

app.listen(port, () => {
    console.log(`Radon Electronics listening on port ${port}`)
})