const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' });         // the reading of .env files only happens once so read at the most top lvl 

// first read the .env file the call app.js
// const app = require('./app');

// CONNECTION OF DATABASE WITH PROJECT
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log("DB connected successful"));

// READ JSON FILE
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// IMPORT DATA INTO DATABASE
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log("Data successfully loaded");
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

// DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("Data deleted successfully loaded");
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

// how t0 use -> $ node ./dev-data/data/import-dev-data.js --import 
if (process.argv[2] == "--import") {
    importData();
} else if (process.argv[2] == "--delete") {
    deleteData();
}


// console.log(process.argv);