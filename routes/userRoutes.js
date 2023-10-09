const express = require('express');
const { getAllUsers, createUser, getUser, updateUser, deleteUser } = require('../controllers/userController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');


const router = express.Router();

// router.route('/signup').post(authController.signup);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);


// MIDDLEWARE FOR BELOW FUNCTIONS ONLY USED BY LOGGED IN USER
router.use(authController.protect);   // PROTECT ALL ROUTES AFTER THIS MIDDLEWARE

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeuserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);


// ALL ROUTES AFTER THIS ARE ONLY ACCESSED BY ADMIN
router.use(authController.restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;