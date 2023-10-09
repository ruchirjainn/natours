const mongoose = require('mongoose');
const Tour = require('./tourModel');

// review / rating / createAt / ref to Tour / ref to User

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review cannot be empty!']
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user']
        }
    },
    {                            // this is 2nd parameter of mongoose.Schema its used for adding the virtual properties
        toJSON: { virtuals: true }, // we cant get the virtual property example Tour.find(durationWeeks) coz its not save in db
        toObject: { virtuals: true }  // can be calculated to using diff. value -> derived values
    }
);

// reviews containing the user name who written it and the tour in which the user has written
reviewSchema.pre(/^find/, function (next) {
    // this
    //     .populate({
    //         path: 'tour',
    //         select: 'name'
    //     })
    //     .populate({
    //         path: 'user',
    //         select: 'name photo'
    //     });

    this
        .populate({
            path: 'user',
            select: 'name photo'
        });

    next();
});

// After every new rating or deletion of rating -> calculate the avg and quantity of ratings and update in the tourModel
reviewSchema.statics.calcAverageRatings = async function (tourId) {    // it is a static method
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRatings: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    // console.log(stats);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRatings,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });   // one user can post a single review on a single tour

reviewSchema.post('save', function () {

    this.constructor.calcAverageRatings(this.tour);   // this.constructor points to current Model

});

// findByIdAndUpdate
// findByIdAndDelete

// Query Middleware
reviewSchema.pre(/^findOneAnd/, async function (next) {

    // with the help of 'this.r' we are passing data from pre to post middleware below
    // this points to the query 
    this.r = await this.findOne();    // by this line with the help of query we get access to document       
    // console.log(this.r);
    next();

});

reviewSchema.post(/^findOneAnd/, async function () {

    // this.r = await this.findOne();   // does not work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);   // this.r is used because we need to get access to Tour but it is in above pre middleware so we made a global 'r'

});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
