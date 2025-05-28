const avatars = document.querySelectorAll('.avatar');
let selectedAvatar = '';
let socket = null;


//username
const username = localStorage.getItem('username');
if (username) {
    document.querySelector('.username').textContent = `Welcome, ${username}`;
}

//avatar
avatars.forEach((avatar) => {
    avatar.addEventListener('click', () => {
        avatars.forEach((a) => a.classList.remove('selected'));
        avatar.classList.add('selected');

        const src = avatar.getAttribute('src');
        selectedAvatar = src.split('/').pop();
        localStorage.setItem('selectedAvatar', selectedAvatar);

        console.log('Selected avatar:', selectedAvatar);
    });
});

//logout
document.getElementById('btn_back').addEventListener('click', () => {
    document.querySelector('.game_starting').style.display = 'none';
    document.querySelector('.menu-box').style.display = 'block';
});

function connectSocket() {
    const token = localStorage.getItem('token');
    console.log('[DEBUG] Token from localStorage:', token); 
    if (!token) {
        window.location.href = '/login';
        return;
    }

    socket = io('http://localhost:8123', {
        transports: ['websocket'],
        auth: {
            token: `Bearer ${token}`,
        },
    });

    socket.on('connect', () => {
        console.log('[WS] Connected');
    });

    socket.on('userConnect', (data) => {
        console.log(`${data.username} joined`);
    });

    socket.on('waitingOpponent', (data) => {
        console.log('Waiting opponent:', data);
    });

    socket.on('startGame', (data) => {
        console.log('Game started', data);
    });

    socket.on('error', (err) => {
        console.error('[WS] Error:', err.message || err);
    });

    socket.on('disconnect', () => {
        console.log('[WS] Disconnected');
    });
}

//play
document.querySelector('.btn.play').addEventListener('click', () => {
    document.querySelector('.menu-box').style.display = 'none';
    document.querySelector('.game_starting').style.display = 'block';
});

// connect socket
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('token')) {
        window.location.href = '/login';
    }
});
