// const STRIPE_SECRET_KEY = 'sk_test_51NysM2SC9sQ9Q8LzlzhMcdGAFeBzM2XjYLbO3bILHkfTyU27fsvdmY6bkWC0flDWwhtFr3HIqnZIuD00BO8wN1Xm00tVI8kbgN';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');


exports.getCheckoutSession = catchAsync(async (req, res, next) => {

    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourID);

    // 2) Create Checkout Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourID,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                    },
                    unit_amount: tour.price * 100
                },
                quantity: 1
            }
        ],
        mode: 'payment'
    });


    // 3) Create session as response
    res.status(200).json({
        status: 'success',
        session
    });

});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // This is only temporary bcz its UNSECURE: everyone can make booking without paying
    const { tour, user, price } = req.query;

    // If one is also not there go to next() middleware
    if (!tour && !user && !price) return next();

    await Booking.create({ tour, user, price });

    // Doing this for securing the success_url above so a user can directly go to that url and say booking is done
    res.redirect(req.originalUrl.split('?')[0]);

});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);