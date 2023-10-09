const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {

    // 1) Get tour data from collection
    const tours = await Tour.find();

    // 2) Build template

    // 3) Render that template using tour data from 1)

    res.status(200).render('overview.pug', {
        title: 'All Tours',
        tours: tours
    });

    next();
});

exports.getTour = catchAsync(async (req, res, next) => {

    // 1) GET DATA FOR THE REQUESTED TOUR (INCLUDING REVIEWS AND TOUR GUIDES)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });
    // console.log(req.params.slug);

    if (!tour) {
        return next(new AppError('There is no tour with that name.', 404));
    }
    // 2) Build template

    // 3) Render template using data from step 1)

    res.status(200).render('tour.pug', {
        title: `${tour.name} Tour`,
        tour: tour
    });

    next();
});

exports.getLoginForm = catchAsync(async (req, res) => {

    // 1) GET DATA FOR THE REQUESTED TOUR (INCLUDING REVIEWS AND TOUR GUIDES)



    // 3) Render template using data from step 1) 
    res.status(200).render('login.pug', {
        title: `Log into your account`,
    });

});

exports.getAccount = catchAsync(async (req, res) => {

    res.status(200).render('account.pug', {
        title: 'Your Account',
    });

});

exports.getMyTours = catchAsync(async (req, res, next) => {

    // 1) Find all the booking registered for a user
    const bookings = await Booking.find({ user: req.user.id });
    // console.log(bookings);

    // 2) Find tours in all the booking
    const tourIDs = bookings.map((el) => el.tour);

    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview.pug', {
        title: 'My Tours',
        tours
    });

});

exports.updateUserData = catchAsync(async (req, res, next) => {

    const updatedUser = await User.findByIdAndUpdate(req.user.id,
        {
            name: req.body.name,
            email: req.body.email
        },
        {
            new: true,
            runValidator: true
        }
    );

    res.status(200).render('account.pug', {
        title: 'Your Account',
        user: updatedUser
    });

    next();
});

