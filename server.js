// Import required modules
const express = require('express');
const session = require('express-session')
const { MongoClient, ObjectId } = require('mongodb');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();
const fs = require("fs");

const apiRouter = require('./api_router');

let db;

MongoClient.connect("mongodb://localhost:27017")
	.then(client=> {
		console.log("Connected to MongoDB");
		db = client.db('a4');
		app.locals.db = db;
	}).catch(err=>console.error("MongoDB connection error: ", err))

function requireDB(req, res, next){
	if(!db) {
		return res.status(502).json({error: "Database not avaliable"});
	}
	next();
}

// Initialize restaurant tracking variables
var restaurantData = {};

// Load all existing restaurant JSON files from the restaurants directory
const files = fs.readdirSync(`./restaurants/`);
files.forEach(file=>{
    if (file.endsWith('.json'))
    {
        const data = require('./restaurants/' + file);
        restaurantData[data.id] = data;
    }
});

app.locals.restaurantData = restaurantData

app.set("view engine", "pug");
app.set('views', './client');
app.use(express.static('./client'))

app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Set up session handling
app.use(session(
	{
		secret: 'This-Assignment-Was-Really-time-consuimg-2406',
		resave: false,
		saveUninitialized: false,
		cookie: {maxAge: 3600000}
		// store: new MongoDBStore({
		// 	uri: "mongodb://localhost:27017",
		// 	collection: 'sessiondata' })
	}
)); 

app.use((req, res, next) => {
	res.locals.user = req.session.user || null;
	next();
})

// Middleware: Log all incoming requests for debugging
app.use(function(req, res, next){
	console.log(req.method);
	console.log(req.url);
	next();
})

app.use('/api', apiRouter)

// Route: GET / - Serve the home page
app.get("/", (req, res, next)=> {
	res.render("home", {user: res.locals.user});
});


app.get("/login", (req, res, next) => {
	res.render("login");
})

app.get("/register", (req, res, next) => {
	res.render("register");
})

app.get("/order", (req, res) => {
	if(!req.session.user){
		return res.status(401).send("Please log in to place orders");
	}
	res.render("order");
})

app.get("/orders/:orderId", async(req, res) => {
	try{
		const result = await db.collection("orders").findOne(
			{
				_id: new ObjectId(req.params.orderId)
			}
		)
		if(!result){
			return res.status(404).send("Order not found");
		}
		const orderer = await db.collection("users").findOne(
			{
				_id: new ObjectId(result.orders.userId)
			}
		)

		if(orderer.privacy && !(req.session.user && req.session.user._id.toString() === result.orders.userId.toString())){
			return res.status(403).send("This Order's owner is private");
		}

		res.render("orderSummary", {order: result})
	}catch(err){
		console.error("Error loading order: ", err);
		res.status(500).send("Error loading order");
	}
})

app.get("/users", async (req, res, next) => {
	const searchTerms = req.query.name || '';

	try{
		const usersArr = await db.collection("users").find(
			{
				privacy: false,
				username: {$regex: searchTerms, $options: "i"}
			},
		).toArray();
		res.render("users", {users: usersArr});
	}catch(err){
		console.error("Error searching users: ", err);
		res.status(500).send("Error searching users!");
	}
})

app.get("/users/:userId", async (req, res) => {
	try{
		const user = await db.collection("users").findOne({
			_id: new ObjectId(req.params.userId)
		});
		if(!user){
			return res.status(404).send("user not found");
		}
		if(user.privacy && !(req.session.user && req.session.user._id.toString() == user._id.toString())){
			return res.status(403).send("This profile is private");
		}
		let orders = [];
		if(user.orders){
			for(var id of user.orders){
				const orderObj = await db.collection("orders").find(
					{
						_id: id
					}
				).project({orders: 1}).toArray();
				orders.push(orderObj[0])
		}}

		res.render('profile', {
			profileUser: user,
			orders: orders,
			isOwner: req.session.user && req.session.user._id.toString() === user._id.toString()
		})

	}catch(err){
		console.error(err);
		res.status(500).send("error loading profile");
	}
})


app.get("/logout", (req, res) => {
	req.session.destroy();
	res.redirect("/");
})

app.post("/login", async (req, res, next) => {
	try{		
		let user = await db.collection("users").findOne({username: req.body.username, password: req.body.password})
		if(user){
			req.session.user = user;

			res.json({id: user._id});
		}else{
			res.status(401).json({message: " Invalid Credentials"})
		}
	}catch(err){
		console.error("Login not completed: ", err);
		res.status(500).send("Login failed due to server error");
	}
})

app.post("/register", async (req, res, next) => {
	let user = await db.collection("users").findOne({username: req.body.username})
	if(user){
		res.status(409).json({message: "User already exists!"})
		return;
	}
	try{
		const newUser = {
			username: req.body.username,
			password: req.body.password,
			privacy: false,
			orders: []
		}
		const result = await db.collection("users").insertOne(newUser);
		newUser._id = result.insertedId;
		req.session.user = newUser;

		res.json({id: result.insertedId});
	}catch(err){
		console.error("Registration error: ", err);
		res.status(500).json({message:"Registration failed."})
	}
	// res.json({id: user._id});
})

app.post("/users/:userId/privacy", async (req, res, next) => {
	if(!(req.session.user && req.session.user._id.toString() === req.params.userId.toString())){
		return res.status(403).json({message: "Forbidden"});
	}
	try{
		const newPrivacy = req.body.privacy === "true";
		const result = await db.collection("users").updateOne(
			{
				_id: new ObjectId(req.session.user._id)
			},
			{
				$set: {privacy: newPrivacy}
			}
		)
		req.session.user.privacy = newPrivacy;
		const user = await db.collection("users").findOne(
			{_id: req.params.userId}
		)
		let orders = [];
		if(user.orders){
			for(var id of user.orders){
				const orderObj = await db.collection("orders").find(
					{
						_id: id
					}
				).project({orders: 1}).toArray();
				orders.push(orderObj[0])
		}}
		res.render('profile', {
			profileUser: user,
			orders: orders,
			isOwner: req.session.user && req.session.user._id.toString() === user._id.toString()
		})
	}catch(err){
		console.error("Privacy update error: ", err);
		res.status(500).send("Error updating privacy settings");
	}
})

app.listen(3000);
console.log("Server listening at http://localhost:3000");
