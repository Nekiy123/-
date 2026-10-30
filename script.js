// ==========================================
// НАСТРОЙКИ
// ==========================================
const FOUNDER_EMAIL = "s.matvey12@mail.ru";

// Простой хэш пароля
function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
    }
    return String(h);
}

// ==========================================
// ТЕМА (светлая / тёмная)
// ==========================================
(function initTheme() {
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);

    // Ставим иконку после загрузки DOM
    document.addEventListener("DOMContentLoaded", () => {
        const btns = document.querySelectorAll("#themeToggle");
        const updateIcons = () => {
            const theme = document.documentElement.getAttribute("data-theme");
            btns.forEach(b => b.textContent = theme === "dark" ? "☀️" : "🌙");
        };
        updateIcons();

        btns.forEach(btn => {
            btn.addEventListener("click", () => {
                const cur = document.documentElement.getAttribute("data-theme");
                const next = cur === "dark" ? "light" : "dark";
                document.documentElement.setAttribute("data-theme", next);
                localStorage.setItem("theme", next);
                updateIcons();
            });
        });
    });
})();

// ==========================================
// РЕГИСТРАЦИЯ / ВХОД
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const authForm = document.getElementById("authForm");
    if (!authForm) return;

    let mode = "reg";

    const tabReg = document.getElementById("tabReg");
    const tabLogin = document.getElementById("tabLogin");
    const loginField = document.getElementById("loginField");
    const submitBtn = document.getElementById("submitBtn");
    const msg = document.getElementById("msg");
    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("password");
    const loginInput = document.getElementById("login");

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

    authForm.addEventListener("submit", (e) => {
        e.preventDefault();
        msg.style.color = "#e53935";

        const login = loginInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passInput.value;

        if (!email || !password) {
            msg.textContent = "Заполните все поля";
            return;
        }

        if (mode === "reg") {
            if (!login) { msg.textContent = "Введите логин"; return; }

            const existing = localStorage.getItem("user_" + email);
            if (existing) {
                msg.textContent = "Такая почта уже зарегистрирована";
                return;
            }

            const user = {
                login: login,
                email: email,
                password: hash(password),
                verified: false,
                founder: email === FOUNDER_EMAIL,
                createdAt: Date.now()
            };
            localStorage.setItem("user_" + email, JSON.stringify(user));
            localStorage.setItem("currentUser", email);

            msg.style.color = "#22c55e";
            msg.textContent = "Успешно! Переход в профиль...";
            setTimeout(() => location.href = "profile.html", 700);

        } else {
            // Вход
            const stored = localStorage.getItem("user_" + email);
            if (!stored) {
                msg.textContent = "Пользователь с такой почтой не найден";
                return;
            }
            const user = JSON.parse(stored);
            if (user.password !== hash(password)) {
                msg.textContent = "Неверный пароль";
                return;
            }
            localStorage.setItem("currentUser", email);
            msg.style.color = "#22c55e";
            msg.textContent = "Вход выполнен!";
            setTimeout(() => location.href = "profile.html", 700);
        }
    });
});

// ==========================================
// ПРОФИЛЬ
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const profileCard = document.getElementById("profileCard");
    if (!profileCard) return;

    const current = localStorage.getItem("currentUser");
    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");
    const avatar = document.getElementById("avatar");
    const badge = document.getElementById("badge");
    const verifiedBadge = document.getElementById("verifiedBadge");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginBtn = document.getElementById("loginBtn");
    const adminBtn = document.getElementById("adminBtn");

    if (!current) return;

    const user = JSON.parse(localStorage.getItem("user_" + current));
    if (!user) {
        localStorage.removeItem("currentUser");
        location.reload();
        return;
    }

    userName.textContent = user.login;
    userEmail.textContent = user.email;
    avatar.textContent = user.login[0].toUpperCase();

    if (user.verified) {
        verifiedBadge.style.display = "inline-block";
    }

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
});

// ==========================================
// ПАНЕЛЬ ОСНОВАТЕЛЯ
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const adminContent = document.getElementById("adminContent");
    if (!adminContent) return;

    const current = localStorage.getItem("currentUser");
    const notFounder = document.getElementById("notFounder");
    const usersList = document.getElementById("usersList");

    const me = current ? JSON.parse(localStorage.getItem("user_" + current)) : null;

    if (!me || me.email !== FOUNDER_EMAIL) {
        notFounder.style.display = "block";
        return;
    }

    adminContent.style.display = "block";

    function renderUsers() {
        usersList.innerHTML = "";
        const users = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("user_")) {
                try {
                    users.push(JSON.parse(localStorage.getItem(key)));
                } catch (e) {}
            }
        }

        if (users.length === 0) {
            usersList.innerHTML = "<p>Нет пользователей.</p>";
            return;
        }

        users.sort((a, b) => (b.founder ? 1 : 0) - (a.founder ? 1 : 0));

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
});

// ==========================================
// ПОИСК (главная страница)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("searchOverlay");
    if (!overlay) return;

    const searchNav = document.getElementById("searchNav");
    const searchClose = document.getElementById("searchClose");
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");

    // Демо-данные для поиска
    const items = [
        { title: "Первый фильм", type: "🎬 Фильм" },
        { title: "Новый сериал", type: "📺 Сериал" },
        { title: "Хиты недели", type: "🎵 Музыка" },
        { title: "Топ игр", type: "🎮 Игра" },
        { title: "Новости дня", type: "📰 Новости" },
        { title: "Комедия вечера", type: "🎬 Фильм" },
        { title: "Драма года", type: "🎬 Фильм" },
        { title: "Подкаст о кино", type: "🎵 Музыка" }
    ];

    function openSearch() {
        overlay.classList.add("active");
        setTimeout(() => searchInput.focus(), 100);
    }
    function closeSearch() {
        overlay.classList.remove("active");
        searchInput.value = "";
        searchResults.innerHTML = '<p class="search-hint">Начните вводить запрос...</p>';
    }

    searchNav.addEventListener("click", (e) => {
        e.preventDefault();
        openSearch();
    });
    searchClose.addEventListener("click", closeSearch);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeSearch();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeSearch();
    });

    searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) {
            searchResults.innerHTML = '<p class="search-hint">Начните вводить запрос...</p>';
            return;
        }
        const found = items.filter(i => i.title.toLowerCase().includes(q));
        if (found.length === 0) {
            searchResults.innerHTML = '<p class="search-hint">Ничего не найдено 😔</p>';
            return;
        }
        searchResults.innerHTML = found.map(i => `
            <div class="search-item">
                <span>${i.type}</span>
                <b>${i.title}</b>
            </div>
        `).join("");
    });

    // Открыть поиск после перехода с других страниц
    if (sessionStorage.getItem("openSearch") === "1") {
        sessionStorage.removeItem("openSearch");
        openSearch();
    }
});

// ==========================================
// КАТЕГОРИИ (переключение активного чипа)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const chips = document.querySelectorAll(".chip");
    if (!chips.length) return;
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
        });
    });
});
