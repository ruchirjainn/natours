const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
    {      // creation of schema in mongoose
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A tour name must have less or equal 40 characters'],
            minlength: [10, 'A tour name must have more or equal 10 characters'],
            // CUSTOM VALIDATOR - external library
            // validate: [validator.isAlpha, 'Tour name must only contains characters']
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, "A tour must have a direction"]
        },
        maxGroupSize: {
            type: Number,
            required: [true, "A tour must have a group size"]
        },
        difficulty: {
            type: String,
            required: [true, "A tour must have a group size"],
            enum: {             // enum is only for string
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either easy, medium or difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,     // rating nahi diya to 4.5
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            set: val => Math.round(val * 10) / 10    // 4.66666666 => 46.66 => 47 => 4.7
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price']
        },
        priceDiscount: {
            type: Number,
            // CUSTOM VALIDATOR
            validate: {
                validator: function (val) {   // val -> priceDiscount which is inputed
                    // this only points to current doc on NEW document creation
                    return val < this.price;
                },
                message: 'Discount price ({VALUE}) should be below the regular price'  // VALUE has access to val inputed
            }
        },
        summary: {
            type: String,
            trim: true,    // remove all white space in start and end is removed
            required: [true, "A tour must have a description"]
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, "A tour must have a cover image"]
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false   // user will not get the createdAt Property - permanently hide this field
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],   // expect array of numbers
            address: String,
            description: String
        },
        locations: [       // tour <-> locations - few:few - embedding
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number
            }
        ],
        guides: [     // tour <-> user - few:few - child referencing
            {
                type: mongoose.Schema.ObjectId,   // when we get the tours we only want the user guide id and not guide info
                ref: 'User'
            }
        ],
        // reviews: [     // we cant implement it bcz its a array of 16mb so for tons of review for a single tour this can break down
        //     {
        //         type: mongoose.Schema.ObjectId,
        //         ref: 'Review'
        //     }
        // ]
    },
    {                            // this is 2nd parameter of mongoose.Schema its used for adding the virtual properties
        toJSON: { virtuals: true }, // we cant get the virtual property example Tour.find(durationWeeks) coz its not save in db
        toObject: { virtuals: true },
    }
);

// THE INDEXES ARE STORED IN DATABASE DIRECTLY
// tourSchema.index({ price: 1 }); // index helps the mongodb engine to find the document
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: '2dsphere'});

// VIRTUAL PROPERTIES - used when we dont want to save the property in database
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// VIRTUAL POPULATE - the tour and review that is the tour virtually contains the reviews of that tour 
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',   // review model mai naam iss field ka 'tour' hai which consist the tour id
    localField: '_id'
});

// 1) DOCUMENT MIDDLEWARE - runs before the .save(), .create(), .remove(), .validate() command but not in .insertMany()
tourSchema.pre('save', function (next) {    // pre-save-hook
    // console.log(this);        // this -> points to currently save document
    this.slug = slugify(this.name, { lower: true });
    next();
});

// TOURS MODELS WANTS TO SAVE ARRAYS OF USERS WHO ARE GUIDES IN THE TOUR
// tourSchema.pre('save', async function (next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

/*
tourSchema.pre('save', function (next) {
    console.log('will save document');
    next();
});

tourSchema.post('save', function (doc, next) {    // it executes when all the middleware are overed
    console.log(doc);
    next();
});
*/

// 2) QUERY MIDDLEWARE - works for .find() method - not works for .findById()
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {    // can be use for hiding the secret data
    this.find({ secretTour: { $ne: true } });       // this -> points to queries
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    // database will only contains the id of user-guides but while querying it will show the user details also 
    this.populate({     // Tour.findOne({_id:req.params.id}); in mongodb
        path: 'guides',
        select: '-__v -passwordChangedAt'   // it doesn't show __v & passwordChangedAt while querying
    });
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds`);
    // console.log(docs);
    next();
});

// 3) AGGREGATION MIDDLEWARE 
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });  // unshift - shifts all the obj of array one step ahead and add the obj at start
//     console.log(this.pipeline());     // this -> points to current aggregation object
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);      // creation of model for schema

module.exports = Tour;