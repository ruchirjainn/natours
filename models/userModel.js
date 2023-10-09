const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell your name']
    },
    email: {
        type: String,
        required: [true, 'Your email is required'],
        unique: true,
        lowercase: true,      // transform the email in lowercase automatically
        validate: [validator.isEmail, 'please provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please re-enter the password for confirmation'],
        validate: {
            // This only works on CREATE and SAVE!!! && won't work for update()
            validator: function (el) {
                return el === this.password;  // the value in confirmPassword
            },
            message: 'Password and confirm Password are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

// PASSWORD ENCRYPTION
userSchema.pre('save', async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();    // password change ni kiya to

    // Hash the password withcost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete the confirmPassword
    this.passwordConfirm = undefined;
    next();
});

// UPDATING changePasswordAt
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();       // if password is not modified or user is new

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// QUERY MIDDLEWARE BECAUSE THE INACTIVE USER SHOULDN'T BE SEEN IN THE OUTPUT active: false
userSchema.pre(/^find/, function (next) {
    // this points to current query
    this.find({ active: { $ne: false } });
    next();
});

// USED FOR CHECKING PASSWORD WHILE LOGIN
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {  // this function can be use directly if we import the file - file.correctPassword()
    // this.password    // not possible bcz password is select: false
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimeStamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');  // we should never store the resetToken in database

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // console.log(resetToken);
    // console.log(this.passwordResetToken);

    this.passwordResetExpire = Date.now() + 10 * 60 * 1000;    // expire after 10 minutes
    // console.log(this.passwordResetExpire);

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;