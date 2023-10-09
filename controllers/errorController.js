const AppError = require("./../utils/appError");

const sendErrorDev = (err, req, res) => {

    // A) API
    if (req.originalUrl.startsWith('/api')) {    // originalUrl contains the router without the host that is /api/v1/.... not 127.0.0.1:3000
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    // B) RENDERED WEBSITE
    console.error('ERROR 💓');

    return res.status(err.statusCode).render('error', {
        title: 'Something Went Wrong!',
        msg: err.message
    });

};

const sendErrorProd = (err, req, res) => {

    // console.log(err.isOperational);

    // A) API
    if (req.originalUrl.startsWith('/api')) {

        // A) Operational, trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }

        // B) Programming or other unknown error: don't leak error details
        // 1) Log error
        console.error('ERROR 💓');

        // 2)Send generic message 
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        });

    }

    // B) RENDERED WEBSITE
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something Went Wrong!',
            msg: err.message
        });
    }

    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💓');

    // 2)Send generic message 
    return res.status(err.statusCode).render('error', {
        title: 'Something Went Wrong!',
        msg: 'Please try again later.'
    });

};

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateDieldsDB = (err) => {
    const value = err.keyValue.name;
    const message = `Duplicate Field Value ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join(', ')}`;
    // const message = `Please correct the following errors: ${err.message}`;

    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid Token Please Login Again', 401);

const handleJWTExpiredError = () => new AppError('Your Token has expired. Please login again', 401)

module.exports = (err, req, res, next) => {

    // console.log(err.stack);       // tells the exact location n file of error

    err.statusCode = err.statusCode || 500; // 500 -> internal server error
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {    // in production we need to send meaningful msg to client

        // let error = { ...err };
        let error = { ...err, name: err.name };
        error.message = err.message;
        // let error = Object.create(err);

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateDieldsDB(error);
        if (error.name === 'ValidatorError') error = handleValidationErrorDB(error);

        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);

    }
    // next();
}