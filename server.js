const mongoose = require('mongoose');

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });         // the reading of .env files only happens once so read at the most top lvl 

// first read the .env file the call app.js
const app = require('./app');

// CONNECTION OF DATABASE WITH PROJECT
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
    // .connect(process.env.DATABASE_LOCAL, {
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log("DB collection successful"));
// .catch(err => console.log('ERROR'));            // local unhandles error rejection

// console.log(app.get('env'));     // development - gives the environment in which the program is running

// const port = process.env.PORT || 3000;
const port = 3000;

const server = app.listen(port, () => {
    console.log(`Server started at port ${port}`);
});

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION ! 🤞 Shutting down');
    console.log(err.name, err.message);

    server.close(() => {   // we giving time to server for completing the pending request when it completes then process is exited
        process.exit(1);    // immediately stops all the process and everything
    });
});

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION ! 🤞 Shutting down');
    console.log(err.name, err.message);
    process.exit(1);
});

// console.log(x);  // uncaught exception, this error occur in every file, it will also occur in middleware if middleware is called
