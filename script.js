// ==========================================
// НАСТРОЙКИ
// ==========================================
const FOUNDER_EMAIL = "s.matvey12@mail.ru";

// Хэш пароля (простая имитация — не для продакшена)
function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
    }
    return String(h);
}

// ==========================================
// РЕГИСТРАЦИЯ / ВХОД
// ==========================================
const authForm = document.getElementById("authForm");

if (authForm) {
    let mode = "reg";

    const tabReg = document.getElementById("tabReg");
    const tabLogin = document.getElementById("tabLogin");
    const loginField = document.getElementById("loginField");
    const submitBtn = document.getElementById("submitBtn");
    const msg = document.getElementById("msg");

    tabReg.onclick = () => {
        mode = "reg";
        tabReg.classList.add("active");
        tabLogin.classList.remove("active");
        loginField.style.display = "block";
        submitBtn.textContent = "Зарегистрироваться";
        msg.textContent = "";
    };

    tabLogin.onclick = () => {
        mode = "login";
        tabLogin.classList.add("active");
        tabReg.classList.remove("active");
        loginField.style.display = "none";
        submitBtn.textContent = "Войти";
        msg.textContent = "";
    };

    authForm.onsubmit = (e) => {
        e.preventDefault();
        const login = document.getElementById("login").value.trim();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;

        if (mode === "reg") {
            if (!login) { msg.textContent = "Введите логин"; return; }
            if (localStorage.getItem("user_" + email)) {
                msg.textContent = "Такая почта уже зарегистрирована";
                return;
            }
            const user = {
                login,
                email,
                password: hash(password),
                verified: false,
                founder: email === FOUNDER_EMAIL
            };
            localStorage.setItem("user_" + email, JSON.stringify(user));
            localStorage.setItem("currentUser", email);
            msg.style.color = "green";
            msg.textContent = "Успешно! Переход в профиль...";
            setTimeout(() => location.href = "profile.html", 800);
        } else {
            const stored = localStorage.getItem("user_" + email);
            if (!stored) { msg.textContent = "Пользователь не найден"; return; }
            const user = JSON.parse(stored);
            if (user.password !== hash(password)) { msg.textContent = "Неверный пароль"; return; }
            localStorage.setItem("currentUser", email);
            msg.style.color = "green";
            msg.textContent = "Вход выполнен!";
            setTimeout(() => location.href = "profile.html", 800);
        }
    };
}

// ==========================================
// ПРОФИЛЬ
// ==========================================
const profileCard = document.getElementById("profileCard");

if (profileCard) {
    const current = localStorage.getItem("currentUser");
    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");
    const avatar = document.getElementById("avatar");
    const badge = document.getElementById("badge");
    const verifiedBadge = document.getElementById("verifiedBadge");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginBtn = document.getElementById("loginBtn");
    const adminBtn = document.getElementById("adminBtn");

    if (current) {
        const user = JSON.parse(localStorage.getItem("user_" + current));
        if (!user) { localStorage.removeItem("currentUser"); location.reload(); return; }

        userName.textContent = user.login;
        userEmail.textContent = user.email;
        avatar.textContent = user.login[0].toUpperCase();

        // Показ верификации (зелёная галочка)
        if (user.verified) {
            verifiedBadge.style.display = "inline-block";
        }

        // Значок основателя
        if (user.founder || user.email === FOUNDER_EMAIL) {
            badge.textContent = "👑 Основатель";
            badge.classList.add("founder");
            adminBtn.style.display = "block";
        } else {
            badge.textContent = user.verified ? "✅ Верифицирован" : "Пользователь";
        }

        logoutBtn.style.display = "block";
        loginBtn.style.display = "none";

        logoutBtn.onclick = () => {
            localStorage.removeItem("currentUser");
            location.reload();
        };
    }
}

// ==========================================
// ПАНЕЛЬ ОСНОВАТЕЛЯ
// ==========================================
const adminContent = document.getElementById("adminContent");

if (adminContent) {
    const current = localStorage.getItem("currentUser");
    const notFounder = document.getElementById("notFounder");
    const usersList = document.getElementById("usersList");

    let me = current ? JSON.parse(localStorage.getItem("user_" + current)) : null;

    if (!me || me.email !== FOUNDER_EMAIL) {
        notFounder.style.display = "block";
    } else {
        adminContent.style.display = "block";

        function renderUsers() {
            usersList.innerHTML = "";
            const users = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith("user_")) {
                    users.push(JSON.parse(localStorage.getItem(key)));
                }
            }

            if (users.length === 0) {
                usersList.innerHTML = "<p>Нет пользователей.</p>";
                return;
            }

            users.forEach(u => {
                const row = document.createElement("div");
                row.className = "user-row";

                const isFounder = u.email === FOUNDER_EMAIL;

                row.innerHTML = `
                    <div class="user-info">
                        <div class="user-avatar">${u.login[0].toUpperCase()}</div>
                        <div>
                            <div class="user-name">
                                ${u.login}
                                ${u.verified ? '<span class="verified-badge small" title="Верифицирован"></span>' : ''}
                                ${isFounder ? '<span class="crown">👑</span>' : ''}
                            </div>
                            <div class="user-email">${u.email}</div>
                        </div>
                    </div>
                    <div class="user-actions">
                        ${isFounder ? '<span class="hint">Основатель</span>' :
                        `<button class="btn-verify ${u.verified ? 'revoke' : ''}" data-email="${u.email}">
                            ${u.verified ? 'Снять' : 'Выдать'}
                        </button>`}
                    </div>
                `;
                usersList.appendChild(row);
            });

            // Обработчики кнопок
            document.querySelectorAll(".btn-verify").forEach(btn => {
                btn.onclick = () => {
                    const email = btn.dataset.email;
                    const user = JSON.parse(localStorage.getItem("user_" + email));
                    user.verified = !user.verified;
                    localStorage.setItem("user_" + email, JSON.stringify(user));
                    renderUsers();
                };
            });
        }

        renderUsers();
    }
  }
