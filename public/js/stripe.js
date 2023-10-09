// directly if we import stripe for frontend it wont work
// thats why for front end we need to write a script of stripe in html file that is tour.pug

// const { showAlert } = require("./alert");

const stripe = Stripe('pk_test_51NysM2SC9sQ9Q8LzQB7BYOXZmxv4kIaGQDXrOCpYo6DW57rIqFDn2IYg2xvcVm0xHNIyaqQq1UbUC5vrK5lnYTpX00aCNtLNZM')

const bookTour = async tourId => {

    try {
        // 1) Get Checkout session from API
        const session = await axios(
            `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
        );

        console.log(session);

        // 2) Create checkout form + charge the credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    } catch (err) {
        console.log("ERROR LATEST WALAALALALAL", err);
        // showAlert('Error', err);
    }

}

const bookBtn = document.getElementById('book-tour');

if (bookBtn) {
    bookBtn.addEventListener('click', (e) => {
        e.target.textContent = 'Processing...';
        const tourId = e.target.dataset.tourId;
        console.log(tourId);
        bookTour(tourId);
    });
}
