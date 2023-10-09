import { showAlert } from './alert.js';

const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

// Type is either 'password' or 'data'
const updateSettings = async (data, type) => {

    try {

        const url = type === 'password' ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword' : 'http://127.0.0.1:3000/api/v1/users/updateMe';

        const res = await axios({
            method: 'PATCH',
            url: url,
            data: data
        });

        console.log(res);

        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} Data Updated Successfully!`);
        }
    }
    catch (err) {
        showAlert('error', err.response.data.message);
    }
}


console.log(userDataForm);

if (userDataForm) {
    userDataForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const form = new FormData();  // form works an object here
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);

        updateSettings(form, 'data');
    });
}


console.log(userPasswordForm);

if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async e => {
        e.preventDefault();

        document.querySelector('.btn--save-password').textContent = 'Updating...';

        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;

        await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');

        document.querySelector('.btn--save-password').textContent = 'Save Password';
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';

    });
} 
