const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
        return next(new AppError(`No Document found with that ID`, 404));
    }

    res.status(204).json({
        status: 'deleted',
        data: null
    });

});

exports.updateOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {      // if the updated value is string then it is converted to integer
        new: true,
        runValidators: true
    });

    if (!doc) {
        return next(new AppError(`No Document found with that ID`, 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc          // also we can write tour : tour
        }
    });

});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);    // any attribute which is not in our schema is removed and not considered

    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {              // /:y? - ? means optional

    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query   // for a single tour we need all the reviews in that tour 

    if (!doc) {
        return next(new AppError(`No Document found with that ID`, 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });

});

exports.getAll = Model => catchAsync(async (req, res, next) => {

    // To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // 2) EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();    // jumps to apiFeatures.js - query middleware
    const doc = await features.query;
    // const doc = await features.query.explain();

    // 3) SEND RESPONSE
    res.status(200).send({
        status: 'success',
        results: doc.length,
        data: {
            data: doc
        }
    });

});
