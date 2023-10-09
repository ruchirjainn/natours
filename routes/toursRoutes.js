const express = require('express');
const { aliasTopTours, getAllTours, createTour, getTour, updateTour, deleteTour, getTourStats, getMonthlyPlan, getToursWithin, getDistances } = require('../controllers/tourController')
const authController = require('../controllers/authController');
const tourController = require('../controllers/tourController');
const reviewController = require('../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// router.param('id', checkID);    // jumps to tourController.js to check id is valid or not if not it stops the process

// GET tour/4322dcdsvds2/reviews
// POST tour/4322dcdsvds2/reviews
// GET tour/4322dcdsvds2/reviews/32434

// it automatically fill the tour id and user id
// router.route('/:tourId/reviews').post(authController.protect, authController.restrictTo('user'), reviewController.createReview);

// MERGING ROUTES
router.use('/:tourId/reviews', reviewRouter);  // when this type of 'tour/4322dcdsvds2/reviews' URL arrive then it re-directs to reviewRouter.js

// ALIASING THE TOURS - SELECTING CHEAP TOURS 
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);     // CONTAINS A MIDDLEWARE

router.route('/tour-stats').get(getTourStats);

router
    .route('/monthly-plan/:year')
    .get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

// USE TO FIND THE LOCATION WHICH IS INSIDE THE CIRCUMFERENCE
// /tours-within?distance=233&center,-40,45&units=miles
// /tours-distance/233/center/-40,45/mi
router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(getToursWithin);

// USE TO FIND THE DISTANCE OF A LOCATION FROM THE CENTER POINT
router
    .route('/distances/:latlng/unit/:unit')
    .get(getDistances);

// jumps to tourController.js to run all the methods
// reason of middleware(authController.protect) is - the tours should be shown to the user which are logged in
router
    .route('/')
    .get(getAllTours)
    .post(authController.protect, authController.restrictTo("admin", "lead-guide"), createTour);

router
    .route('/:id')
    .get(getTour)
    .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.uploadTourImages, tourController.resizeTourImages, updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), deleteTour);
// the paramter passed in restrict('admin') is that the only the admin has access to delete a tour


module.exports = router;