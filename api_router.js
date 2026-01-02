const express = require('express');
const { ObjectId } = require('mongodb');

const router = express.Router();

// This will be injected by server.js
let db;
let restaurantData;

// Middleware to set db and restaurantData
router.use((req, res, next) => {
    db = req.app.locals.db;
    restaurantData = req.app.locals.restaurantData;
    next();
});

// GET /api/restaurants - Get all restaurant names and IDs
router.get('/restaurants', (req, res) => {
    console.log(restaurantData);
    const restaurantNames = [];
    for (var id in Object.keys(restaurantData)) {
        restaurantNames.push({ name: restaurantData[id].name, id: id });
    }
    console.log(restaurantNames);
    res.json(restaurantNames);
});

// GET /api/restaurants/:rid - Get specific restaurant details
router.get('/restaurants/:rid', (req, res) => {
    let rid = req.params.rid;
    try {
        rid = Number(rid);
        console.log(rid);
        console.log(restaurantData[rid]);
        let found = restaurantData[rid];
        
        if (found != null) {
            res.json(found);
        } else {
            res.status(404).json({ message: "No restaurant with id " + rid + " found!" });
        }
    } catch (err) {
        res.status(404).json({ message: "Restaurant with ID " + rid + " not found" });
    }
});

// POST /api/order - Submit an order
router.post('/order', async (req, res) => {
    if(!req.session.user){
        return res.status(401).json({message: "Please log in to place orders!"});
    }
    console.log(req.body);
    let order = req.body;
    order.userId = req.session.user._id;
    order.username = req.session.user.username;



    try {
        const result = await db.collection("orders").insertOne(
            {orders: order}
        );
        console.log(result)
        if(!result.insertedId){
            return res.status(500).json({message: "order wasn't added successfully"});
        }

        const userResult = await db.collection("users").updateOne(
            {_id: new ObjectId(req.session.user._id)},
            {$push: {orders: result.insertedId}}
        )
        
        if (!req.session.user.orders) {
            req.session.user.orders = [];
        }
        req.session.user.orders.push(result.insertedId);
        
        res.json({ success: true });
    } catch (err) {
        console.log("Could not add order to database: " + err);
        res.status(500).json({ success: false, message: "Failed to save order" });
    }
});

module.exports = router;