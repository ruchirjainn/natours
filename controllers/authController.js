const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { promisify } = require('util');
const Email = require('../utils/email');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

// cookie is a small text of line
// server send to client
// client store it and send it with future request to the server
// browser stores all the cookies

const createAndSendToken = (user, statusCode, res) => {

    const token = signToken(user._id);

    const cookieOption = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true       // browser can never edit / destroy the cookie 
    }

    if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

    // HERE THE COOKIE HAS SAME NAME SO IT WILL OVER RIDE THE OLD COOKIE
    res.cookie('jwt', token, cookieOption);

    // REMOVE THE PASSWORD FROM THE OUTPUT
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {

    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();

    createAndSendToken(newUser, 201, res);

});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password'), 400);
    }

    // 2) check if user exist && password is correct
    const user = await User.findOne({ email: email }).select('+password');
    // by default the password is select: false check userModel. so for findOne() it wont get stored in user so we are chossing it expicitely

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect Email or Password', 401));
    }

    // 3) if everything is correct send token to client
    createAndSendToken(user, 200, res);

});

// We're sending a cookie with same name as browser generated but we r overwriting the old cookie with empty cookie
// from this the current user will logout
// exports.logout = (req, res) => {
//     res.cookie('jwt', 'null', {
//         expires: new Date(date.now() + 10 * 1000),
//         httpOnly: true
//     });
//     res.status(200).json({ status: 'success' })
// }

exports.logout = (req, res) => {
    res.clearCookie('jwt');
    res.status(200).json({ status: 'success' });
}


// METHOD FOR CHECKING THAT THE DATA IS UPDATED BY CURRENT USER OR NOT
exports.protect = catchAsync(async (req, res, next) => {

    let token;

    // 1) Getting token and check of it's there
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in. Please login to get access', 401));
    }

    // 2) Verification token 
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exist
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
        return next(new AppError('The user belonging to this token doesnt exist anymore', 401));
    }

    // 4) Check if user change password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed the password. Please Login again.', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// ONLY FOR RENDERED PAGES, NO ERROS!
exports.isLoggedIn = async (req, res, next) => {

    if (req.cookies.jwt) {

        try {
            // 1) Verifies the token 
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            // 2) Check if user still exist
            const currentUser = await User.findById(decoded.id);

            if (!currentUser) {
                return next();
            }

            // 3) Check if user change password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            // res.locals is used by every pug file to get the access of .user (user acts a variable for every pug file)
            // we can say it is used for passing the data
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();

};

// MIDDLEWARE FOR CERTAIN USERS TO DELETE A TOUR
exports.restrictTo = (...roles) => {        // ...roles -> array of roles -> ['admin', 'lead-guide'] , default-> ['user']
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {   // req.user.role is coming from first middleware that is protect middleware
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        next();
    };
};

// forgotPassword only sends the resetPassword mail 
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError('There is no user with email address', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    try {

        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        console.log(resetURL);

        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        });
    } catch (err) {          // if mail not sent then clear all the tokens
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;
        await user.save({ validateBeforeSave: false });
        
        // console.log(err);
        return next(new AppError('There was an error sending an email. Try again later!', 500));
    }
});

// actual resetPassword in mail sent by forgotPassword
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpire: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;

    await user.save();

    // 3) Update changePasswordAt property for the user
    // we did this step in middleware in userMode.js


    // 4) Log the user in, send JWT
    createAndSendToken(user, 200, res);

});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed password is correct
    if (!user || !(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong! Re-Enter your password', 401));
    }

    // 3) If so, update Password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    // NOTE: User.findByIdAndUpdate will NOT work as intended 
    // BCZ the userModel validators are not meant for update() methods and the userSchema.pre middlewares arent apply means the password wont encrypt

    await user.save();

    // 4) Log user in, send JWT
    createAndSendToken(user, 200, res);

});

