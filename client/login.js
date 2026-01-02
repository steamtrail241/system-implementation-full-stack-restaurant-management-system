document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('name').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (response.ok) {
            const data = await response.json();
            // Redirect to home page or dashboard after successful login
            window.location.href = '/users/'+data.id;
        } else {
            const error = await response.json();
            alert(error.message || 'Invalid username or password');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error logging in');
    }
});