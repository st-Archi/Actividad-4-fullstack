const loginForm = document.getElementById('loginForm');
const message = document.getElementById('message');
const chestSound = document.getElementById('chestSound');

message.style.display = 'none';


const token = localStorage.getItem('token');
if (token) {
    window.location.href = 'products.html';
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        message.style.display = 'block';

        if (res.ok) {

            message.style.color = '#7CFC00';
            message.innerText = 'Iniciando sesión..';

           
            chestSound.currentTime = 0;
            await chestSound.play();

            localStorage.setItem('token', data.token);

            
            document.body.style.transition = "all 3s ease";
            document.body.style.filter = "brightness(1.5) blur(6px) hue-rotate(40deg)";

          
            setTimeout(() => {
                window.location.href = 'products.html';
            }, 3000);

        } else {
            message.style.color = '#ff4d4d';
            message.innerText = data.message;
        }

    } catch (err) {
        message.style.display = 'block';
        message.style.color = '#ff4d4d';
        message.innerText = 'Error en el servidor';
    }
});