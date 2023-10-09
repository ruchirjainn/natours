const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);
router
    .route('/checkout-session/:tourID')  // ye path postman m hai
    .get(bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));

// NOT YET IMPLEMENTED IN FRONT END
router
    .route('/')
    .get(bookingController.getAllBookings)
    .post(bookingController.createBooking);

router
    .route('/:id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking);

module.exports = router;


