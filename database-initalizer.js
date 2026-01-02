//data
const userNames = ["winnifred", "lorene", "cyril", "vella", "erich", "pedro", "madaline", "leoma", "merrill",  "jacquie"];
const users = [];
userNames.forEach(name =>{
	let u = {};
	u.username = name;
	u.password = name;
	u.privacy = false;
	users.push(u);
});

//config
const config = {
	dbIp: "mongodb://localhost:27017/",
	dbName:'a4'
}
//mongo
const mongo = require('mongodb');
const mongoClient = new mongo.MongoClient(config.dbIp);

//connects to a database and resolves with the db object
async function connectToDatabase() {	
	try {	
		console.log("Connecting to database...");
		await mongoClient.connect();
		let db = mongoClient.db(config.dbName);
		console.log("Connected to database:", config.dbName);

		return db; //resolve with the db object
	} catch (err) {
		console.error("Error connecting to database:", err);
		throw err;
	}
}

//CRUD
async function insertUsers(db){
	console.log("Inserting users...");
	try{
		let result = await db.collection("users").insertMany(users);
		console.log(result.insertedCount + ` users successfully added (should be ${userNames.length}).`);
	} catch (err) {
		console.error("Error inserting users:", err);
		throw err;
	}
}

//main chain
connectToDatabase()														//open
	.then(async (db) => {
		await db.dropDatabase(); 										//reset
		await insertUsers(db);											//initialize
	})			
	.then(() => console.log("Database initialization complete."))
	.catch((err) => console.error("Database initialization failed:", err))
	.finally(() => mongoClient.close());								//close		
	

