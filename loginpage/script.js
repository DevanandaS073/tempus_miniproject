document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const createRipple = (event) => {
        const button = event.currentTarget;
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
        circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
        circle.classList.add("ripple");

        const ripple = button.getElementsByClassName("ripple")[0];

        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    };

    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', createRipple);
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!emailInput.value || !passwordInput.value) {
            alert('Please fill in all fields.');
            return;
        }

        const loginBtn = document.querySelector('.login-btn');
        const btnText = loginBtn.querySelector('span');
        const originalText = btnText.innerText;

        loginBtn.disabled = true;
        btnText.innerText = 'Signing In...';
        loginBtn.style.opacity = '0.8';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('tempus_user', JSON.stringify(data.user));
                window.location.href = '/dashboard';
            } else {
                alert(data.error || 'Login failed');

                const mascot = document.querySelector('.mascot');
                if (mascot) {
                    mascot.classList.add('shake', 'sad');
                    setTimeout(() => {
                        mascot.classList.remove('shake');
                    }, 600);
                    setTimeout(() => {
                        mascot.classList.remove('sad');
                    }, 2000);
                }

                loginBtn.disabled = false;
                btnText.innerText = originalText;
                loginBtn.style.opacity = '1';
            }
        } catch (err) {
            console.error(err);
            alert('Connection error');
            loginBtn.disabled = false;
            btnText.innerText = originalText;
            loginBtn.style.opacity = '1';
        }
    });

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('fullname');
            const emailInput = document.getElementById('signup-email');
            const passwordInput = document.getElementById('signup-password');
            const confirmPasswordInput = document.getElementById('signup-confirm-password');

            if (passwordInput.value !== confirmPasswordInput.value) {
                alert('Passwords do not match!');
                return;
            }

            const signupBtn = signupForm.querySelector('.login-btn');
            const btnText = signupBtn.querySelector('span');
            const originalText = btnText.innerText;

            signupBtn.disabled = true;
            btnText.innerText = 'Creating Account...';

            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: nameInput.value,
                        email: emailInput.value,
                        password: passwordInput.value
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Account created! Please login.');
                    switchView('login');
                } else {
                    alert(data.error || 'Signup failed');
                }
            } catch (err) {
                console.error(err);
                alert('Connection error');
            } finally {
                signupBtn.disabled = false;
                btnText.innerText = originalText;
            }
        });
    }

    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('forgot-email');

            const forgotBtn = forgotForm.querySelector('.login-btn');
            const btnText = forgotBtn.querySelector('span');
            const originalText = btnText.innerText;

            forgotBtn.disabled = true;
            btnText.innerText = 'Sending...';

            try {
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailInput.value })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    switchView('login');
                } else {
                    alert('Something went wrong.');
                }
            } catch (err) {
                console.error(err);
                alert('Connection error');
            } finally {
                forgotBtn.disabled = false;
                btnText.innerText = originalText;
                forgotForm.reset();
            }
        });
    }
});

function switchView(viewName) {
    const views = ['login', 'signup', 'forgot'];

    views.forEach(v => {
        const el = document.getElementById(`${v}-view`);
        if (!el) return;

        if (v === viewName) {
            el.classList.remove('hidden');
            el.classList.add('active');
        } else {
            el.classList.add('hidden');
            el.classList.remove('active');
        }
    });

    document.querySelectorAll('form').forEach(f => f.reset());
}

function randomizeBlobs() {
    const blobs = document.querySelectorAll('.blob');

    blobs.forEach(blob => {
        const randomX = Math.random() * 20 - 10;
        const randomY = Math.random() * 20 - 10;
        const randomScale = 0.8 + Math.random() * 0.4;

        blob.style.transform = `translate(${randomX}%, ${randomY}%) scale(${randomScale})`;
    });
}

setInterval(randomizeBlobs, 2500);
randomizeBlobs();

function initMascotEvents() {
    const mascotContainer = document.querySelector('.mascot-container');
    const mascot = document.querySelector('.mascot');
    const eyes = document.querySelectorAll('.eye');
    const passwordFields = document.querySelectorAll('input[type="password"]');
    const allInputs = document.querySelectorAll('input');

    if (!mascot || !eyes.length) return;

    function updateMascotState() {
        if (mascot.classList.contains('waving')) return;

        mascot.classList.remove('cover-eyes', 'close-eyes', 'look-away');

        const activeEl = document.activeElement;

        let isAnyPasswordVisibleAndNotEmpty = false;
        let isAnyPasswordVisible = false;

        passwordFields.forEach(field => {
            if (field.type === 'text') {
                isAnyPasswordVisible = true;
                if (field.value.length > 0) isAnyPasswordVisibleAndNotEmpty = true;
            }
        });

        if (isAnyPasswordVisibleAndNotEmpty) {
            mascot.classList.add('close-eyes', 'cover-eyes');
            resetEyeTransforms();
            return;
        }

        if (activeEl && activeEl.tagName === 'INPUT') {
            const type = activeEl.type;
            if (type === 'email' || type === 'text') {
                const isProfileInput = activeEl.id === 'fullname' || activeEl.id.includes('email');

                if (isProfileInput) {
                    lookAtBar(activeEl);
                    return;
                }
            }
        }

        trackMouse();
    }

    function resetEyeTransforms() {
        eyes.forEach(eye => {
            eye.style.transform = '';
        });
    }

    function updateEyes(targetX, targetY) {
        eyes.forEach(eye => {
            const rect = eye.getBoundingClientRect();
            const eyeCenterX = rect.left + rect.width / 2;
            const eyeCenterY = rect.top + rect.height / 2;

            const dx = targetX - eyeCenterX;
            const dy = targetY - eyeCenterY;

            const dist = Math.sqrt(dx * dx + dy * dy);

            const maxRadius = 3.5;

            const clampedDist = Math.min(dist, maxRadius);

            const angle = Math.atan2(dy, dx);
            const x = Math.cos(angle) * clampedDist;
            const y = Math.sin(angle) * clampedDist;

            eye.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    function lookAtBar(element) {
        const rect = element.getBoundingClientRect();
        const targetY = rect.top + rect.height / 2;

        const valLength = element.value.length;
        const progress = Math.min(1, valLength / 25);
        const targetX = rect.left + (rect.width * progress * 0.9) + 10;

        updateEyes(targetX, targetY);
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    function trackMouse() {
        updateEyes(mouseX, mouseY);
    }

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    mascot.addEventListener('click', () => {
        if (!mascot.classList.contains('waving')) {
            mascot.classList.add('waving');
            setTimeout(() => {
                mascot.classList.remove('waving');
                updateMascotState();
            }, 2000);
        }
    });

    window.togglePassword = function (id, icon) {
        const input = document.getElementById(id);
        if (!input) return;

        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = '🙈';
        } else {
            input.type = 'password';
            icon.textContent = '👁️';
        }
        updateMascotState();
    };

    const originalSwitchView = window.switchView || null;

    window.switchView = function (viewName) {
        mascotContainer.classList.add('hide');
        setTimeout(() => {
            const views = ['login', 'signup', 'forgot'];
            views.forEach(v => {
                const el = document.getElementById(`${v}-view`);
                if (el) {
                    if (v === viewName) { el.classList.remove('hidden'); el.classList.add('active'); }
                    else { el.classList.add('hidden'); el.classList.remove('active'); }
                }
            });
            document.querySelectorAll('form').forEach(f => f.reset());

            mascotContainer.classList.remove('look-up', 'hide');
            mascot.classList.remove('party', 'confused');

            if (viewName === 'login') {
                mascotContainer.classList.add('look-up');
            } else if (viewName === 'signup') {
                mascotContainer.classList.add('look-up');
                mascot.classList.add('party');
            } else if (viewName === 'forgot') {
                mascotContainer.classList.add('look-up');
                mascot.classList.add('confused');
            }

            updateMascotState();
        }, 300);
    };

    setInterval(updateMascotState, 100);

    setTimeout(() => {
        const firstInput = document.getElementById('email');
        if (firstInput) firstInput.focus();
        updateMascotState();
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMascotEvents);
} else {
    initMascotEvents();
}
