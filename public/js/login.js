import { showAlert } from './alert.js';

const login = async (email, password) => {

    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {     // variables name is same that is in postman login body
                email: email,
                password: password,
            }
        });

        // console.log(res);

        if (res.data.status === 'success') {
            showAlert('success', 'Logged in Successfully');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    }
    catch (err) {
        showAlert('error', err.response.data.message);
    }
}

const loginBtn = document.querySelector('#loginbtn');

if (loginBtn && !loginBtn.hasListener) {
    loginBtn.hasListener = true; // Set a flag to indicate that the listener is attached
    loginBtn.addEventListener('click', (e) => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
        e.preventDefault();
    });
}

// document.querySelector('.form').addEventListener('submit', e => {

//     e.preventDefault();
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;
//     login(email, password);

// });

const logOutBtn = document.querySelector('.nav__el--logout');

const logout = async () => {
    
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout'
            // http://127.0.0.1:3000
        });

        if ((res.data.status === 'success')) location.reload(true);

    } catch (err) {
        console.log(err.response);
        showAlert('error', 'Error Logging out! Try again.')
    }
}
if (logOutBtn) logOutBtn.addEventListener('click', logout);

