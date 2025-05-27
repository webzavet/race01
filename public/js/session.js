const messageBox = document.getElementById('message');

function showMessage(text, type = 'success') {
    messageBox.className = type;
    messageBox.textContent = text;
}

document.getElementById('btn_confirm').addEventListener('click', async (e) => {
    e.preventDefault();

    console.log('[DEBUG] Button confirm clicked');

    const sessionType = document.querySelector(
        'input[name="session"]:checked'
    )?.value;
    const lobbyName = document.getElementById('name_for_lobby').value;
    const lobbyPassword = document.getElementById('password_for_lobby').value;
    const token = localStorage.getItem('token');

    if (!sessionType || !lobbyName || !lobbyPassword || !token) {
        showMessage(
            'Fill all fields and make sure you are logged in.',
            'error'
        );
        return;
    }

    try {
        console.log('[DEBUG] Trying to create room');
        let url = '';
        let body = {};

        if (sessionType === 'create') {
            url = '/rooms';
            body = {
                data: {
                    id: lobbyName,
                    type: 'create_room',
                    attributes: {
                        password: lobbyPassword,
                    },
                },
            };
        } else if (sessionType === 'connect') {
            console.log('[DEBUG] Trying to connect room');
            url = `/rooms/${encodeURIComponent(lobbyName)}/player`;
            body = {
                data: {
                    id: lobbyName,
                    type: 'join_room',
                    attributes: {
                        password: lobbyPassword,
                    },
                },
            };
        } else {
            showMessage('Invalid session type', 'error');
            return;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(
                `Room ${
                    sessionType === 'create' ? 'created' : 'joined'
                } successfully!`,
                'success'
            );
            console.log(result);
            connectSocket(); // connect soket
            window.location.href = '/loading.html'; // редирект на страницу загрузки
        } else {
            const error = result?.errors?.[0]?.detail || 'Unknown error';
            showMessage(`${error}`, 'error');
        }
    } catch (err) {
        console.error(err);
        showMessage('Server error', 'error');
    }
});
