const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use(
    cors({
        origin: true,
        optionsSuccessStatus: 200,
        credentials: true,
    })
);


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
        const ordersCollection = client.db('radon-electronics').collection('Orders');
        const usersCollection = client.db('radon-electronics').collection('users');
        const reviewsCollection = client.db('radon-electronics').collection('reviews');

        // add product api
        app.post('/product', verifyJwt, async (req, res) => {
            const product = req.body;
            const result = await produtcsCollection.insertOne(product);
            res.send(result)
        })


        // get all products api
        app.get('/products', async (req, res) => {
            const product = await produtcsCollection.find().toArray();
            res.send(product);
        })

        // get Products by id
        app.get('/productbyid/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await produtcsCollection.findOne(query);
            res.send(product)
        })

        // delete product by admin api
        app.delete('/product/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await produtcsCollection.deleteOne(query);
            res.send(result);
        })

        // create user api
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            options = { upsert: true }
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign(user, process.env.ACCESS_SECRET, { expiresIn: '1d' });
            res.send({ result, token });
        })

        // get All Users api
        app.get('/users', verifyJwt, async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users)
        })

        // make admin api
        app.put('/makeadmin/:email', verifyJwt, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const updateDoc = {
                $set: { role: 'admin' }
            }

            const requester = req.decoded.email;
            const requesterAcc = await usersCollection.findOne({ email: requester })

            if (requesterAcc.role === 'admin') {
                const result = await usersCollection.updateOne(filter, updateDoc)
                res.send(result);
            }
            else {
                return res.status(403).send({ message: 'Forviden access' })
            }
        })

        // check isAdmin api
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        // add order api
        app.post('/order', async (req, res) => {
            const order = req.body;
            const id = order.productId;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const orderedProduct = await produtcsCollection.findOne(query);
            const newQuantity = orderedProduct.quantity - order.orderQuantity;
            const updateQuantity = {
                $set: {
                    quantity: newQuantity
                },
            };

            const result = await ordersCollection.insertOne(order);
            const update = await produtcsCollection.updateOne(query, updateQuantity, options)
            res.send(result);
        })

        // get my orders
        app.get('/myorders', verifyJwt, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders)
        })
        // get all orders
        app.get('/allorders', async (req, res) => {
            const orders = await ordersCollection.find().toArray();
            res.send(orders)
        })

        // Cancel order api
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        })
        // Change order status api
        app.put('/changestatus/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updateDoc = {
                $set: { status: 'shipped' }
            }
            const result = await ordersCollection.updateOne(query, updateDoc, options);
            res.send(result);
        })
        // payment api(change order status to pendind)
        app.put('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updateDoc = {
                $set: { status: 'pending' }
            }
            const result = await ordersCollection.updateOne(query, updateDoc, options);
            res.send(result);
        })

        // get user by email
        app.get('/userbyemail', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send(user)
        })

        // update Profile api
        app.put('/updateprofile/:email', async (req, res) => {
            const email = req.params.email;
            const newProfile = req.body;
            const filter = { email: email };
            const updateProfile = {
                $set: newProfile,
            }
            const result = await usersCollection.updateOne(filter, updateProfile);
            res.send(result);

        })

        // add review api
        app.post('/addreview', async (req, res) => {
            const review = req.body;
            const email = review.email;
            const query = { email: email };
            const axist = await reviewsCollection.findOne(query);
            if (axist) {
                return res.send({ success: false })
            }
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        })

        // get all reviews
        app.get('/reviews', async (req, res) => {
            const reviews = await reviewsCollection.find().toArray();
            const users = await usersCollection.find().toArray();
            reviews.forEach(review => {
                const profile = users.find(user => user.email === review.email);
                review.img = profile.profilePic;
            })
            res.send(reviews);
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