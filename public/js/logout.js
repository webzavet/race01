document.querySelector('.btn.logout').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    });