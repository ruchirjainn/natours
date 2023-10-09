const fs = require("fs");
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');


// Naming of the photo file which is uploaded
// const multerStorage = multer.diskStorage({

//     destination: (req, file, cb) => {     // cb works as next() function in express
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
// user-76767abc76dba-342342324-jpeg  /  user-id-time-extension
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     }

// });

// Storing Image as a Buffer that is available at req.file.buffer 
const multerStorage = multer.memoryStorage();

// The goal of this function is to check the uploaded file is an image -> if yes then true or else false along with error
const multerFilter = (req, file, cb) => {

    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image. Please Upload only images!', 400), false);
    }

}

// Actual uploading of Photo file
const upload = multer({   // All the Images will be uploaded here in this folder path 
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

// RESIZING OF IMAGE - 202
exports.resizeuserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    // Not adding the time id -> coz a user can upload unlimited id which we dont want 
    req.file.filename = `user-${req.user.id}.jpeg`;    // overwriting of images with id only

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
});

// READING THE FILE AND SAVING THE JSON FILE IN TOURS
const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));    // og content in the tours-simple file with using JSON.parse()

// FUNCTION FOR FILTERING THE OBJECT MEANS ONLY TAKING THE FIELDS WHICH ARE NEEDED
const filterObj = (obj, ...allowedFields) => {       // 'name' and 'email' is considered as array

    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
};

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {

    // 1) Create error is user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use updateMyPassword', 400));
    }


    // 2) Filtered out unwanted field name that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');

    if (req.file) filteredBody.photo = req.file.filename;

    // 3) Update user Document

    // NOTE: User.findById() wont work here coz we need to mention the required fields also in User
    // const user = await User.findById(req.user.id);
    // user.name = 'Ruchir';

    // NOTE: SO WE NEED TO USE User.findByIdAndUpdate()

    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });

});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });    // it wont get deleted from db but only get deactivated 

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: "This route is not yet defined! Please use sign up instead"
    });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);     // NOTE -> Do not update password with this!
exports.deleteUser = factory.deleteOne(User);
