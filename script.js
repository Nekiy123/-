// ==========================================
// НАСТРОЙКИ
// ==========================================
const FOUNDER_EMAIL = "s.matvey12@mail.ru";

function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
    }
    return String(h);
}

// ==========================================
// ТЕМА
// ==========================================
(function initTheme() {
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);

    function updateIcons() {
        const theme = document.documentElement.getAttribute("data-theme");
        document.querySelectorAll("#themeToggle").forEach(b => {
            b.textContent = theme === "dark" ? "☀️" : "🌙";
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        updateIcons();
        document.querySelectorAll("#themeToggle").forEach(btn => {
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
// ВСПОМОГАТЕЛЬНОЕ
// ==========================================
function getUsers() {
    const users = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("user_")) {
            try { users.push(JSON.parse(localStorage.getItem(key))); } catch(e) {}
        }
    }
    return users;
}

function saveUser(user) {
    localStorage.setItem("user_" + user.email, JSON.stringify(user));
}

function toast(text) {
    let t = document.querySelector(".toast");
    if (!t) {
        t = document.createElement("div");
        t.className = "toast";
        document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

function isBlocked(user) {
    if (!user || !user.blocked) return false;
    if (user.blockedUntil === "forever") return true;
    if (!user.blockedUntil) return false;
    return Date.now() < user.blockedUntil;
}

// ==========================================
// РЕГИСТРАЦИЯ / ВХОД
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("authForm");
    if (!form) return;

    let mode = "reg";
    const tabReg = document.getElementById("tabReg");
    const tabLogin = document.getElementById("tabLogin");
    const loginField = document.getElementById("loginField");
    const submitBtn = document.getElementById("submitBtn");
    const msg = document.getElementById("msg");
    const loginInput = document.getElementById("login");
    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("password");

    tabReg.onclick = () => {
        mode = "reg";
        tabReg.classList.add("active"); tabLogin.classList.remove("active");
        loginField.style.display = "block";
        submitBtn.textContent = "Зарегистрироваться";
        msg.textContent = "";
    };
    tabLogin.onclick = () => {
        mode = "login";
        tabLogin.classList.add("active"); tabReg.classList.remove("active");
        loginField.style.display = "none";
        submitBtn.textContent = "Войти";
        msg.textContent = "";
    };

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        msg.style.color = "var(--danger)";
        const login = loginInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passInput.value;

        if (!email || !password) { msg.textContent = "Заполните все поля"; return; }

        if (mode === "reg") {
            if (!login) { msg.textContent = "Введите логин"; return; }
            if (localStorage.getItem("user_" + email)) {
                msg.textContent = "Такая почта уже зарегистрирована"; return;
            }
            const user = {
                login, email,
                password: hash(password),
                verified: false,
                founder: email === FOUNDER_EMAIL,
                blocked: false,
                blockedUntil: null,
                blockHistory: [],
                avatar: null,
                createdAt: Date.now()
            };
            saveUser(user);
            localStorage.setItem("currentUser", email);
            msg.style.color = "var(--success)";
            msg.textContent = "Успешно! Переход...";
            setTimeout(() => location.href = "profile.html", 600);
        } else {
            const stored = localStorage.getItem("user_" + email);
            if (!stored) { msg.textContent = "Пользователь не найден"; return; }
            const user = JSON.parse(stored);
            if (user.password !== hash(password)) { msg.textContent = "Неверный пароль"; return; }
            if (isBlocked(user)) {
                const until = user.blockedUntil === "forever" ? "навсегда" : new Date(user.blockedUntil).toLocaleString();
                msg.textContent = `Аккаунт заблокирован (${until}). Причина: ${user.blockReason || "—"}`;
                return;
            }
            localStorage.setItem("currentUser", email);
            msg.style.color = "var(--success)";
            msg.textContent = "Вход выполнен!";
            setTimeout(() => location.href = "profile.html", 600);
        }
    });
});

// ==========================================
// ПРОФИЛЬ
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const card = document.getElementById("profileCard");
    if (!card) return;

    const current = localStorage.getItem("currentUser");
    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");
    const avatar = document.getElementById("avatar");
    const badge = document.getElementById("badge");
    const verifiedBadge = document.getElementById("verifiedBadge");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginBtn = document.getElementById("loginBtn");
    const adminBtn = document.getElementById("adminBtn");
    const settingsSection = document.getElementById("settingsSection");
    const avatarEdit = document.getElementById("avatarEdit");
    const changeAvatarBtn = document.getElementById("changeAvatarBtn");
    const modal = document.getElementById("avatarModal");
    const fileInput = document.getElementById("avatarFile");
    const avatarCancel = document.getElementById("avatarCancel");
    const avatarSave = document.getElementById("avatarSave");

    if (!current) return;

    let user = JSON.parse(localStorage.getItem("user_" + current));
    if (!user) { localStorage.removeItem("currentUser"); location.reload(); return; }

    // Блокировка
    if (isBlocked(user)) {
        userName.textContent = user.login;
        userEmail.textContent = "Аккаунт заблокирован";
        badge.textContent = "🚫 Заблокирован";
        badge.style.background = "var(--danger)";
        badge.style.color = "#fff";
        avatar.textContent = "🚫";
        logoutBtn.style.display = "block";
        logoutBtn.onclick = () => { localStorage.removeItem("currentUser"); location.reload(); };
        return;
    }

    // Заполнение
    userName.textContent = user.login;
    userEmail.textContent = user.email;

    if (user.avatar) {
        avatar.innerHTML = `<img src="${user.avatar}" alt="avatar">`;
    } else {
        avatar.textContent = user.login[0].toUpperCase();
    }

    if (user.verified) verifiedBadge.style.display = "inline-block";

    if (user.founder || user.email === FOUNDER_EMAIL) {
        badge.textContent = "👑 Основатель";
        badge.classList.add("founder");
        adminBtn.style.display = "block";
    } else {
        badge.textContent = user.verified ? "✅ Верифицирован" : "Пользователь";
        if (user.verified) badge.classList.add("verified");
    }

    logoutBtn.style.display = "block";
    loginBtn.style.display = "none";
    settingsSection.style.display = "block";
    avatarEdit.style.display = "flex";

    logoutBtn.onclick = () => {
        localStorage.removeItem("currentUser");
        location.reload();
    };

    // Аватар
    function openModal() { modal.classList.add("active"); }
    function closeModal() { modal.classList.remove("active"); fileInput.value = ""; }

    avatarEdit.onclick = openModal;
    changeAvatarBtn.onclick = openModal;
    avatarCancel.onclick = closeModal;
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    avatarSave.onclick = () => {
        const file = fileInput.files[0];
        if (!file) { toast("Выберите файл"); return; }
        if (file.size > 1.5 * 1024 * 1024) { toast("Максимум 1.5 МБ"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            user.avatar = ev.target.result;
            saveUser(user);
            closeModal();
            toast("Фото обновлено");
            setTimeout(() => location.reload(), 500);
        };
        reader.readAsDataURL(file);
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
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modalTitle");
    const modalReason = document.getElementById("modalReason");
    const modalDuration = document.getElementById("modalDuration");
    const modalDurationField = document.getElementById("modalDurationField");
    const modalCancel = document.getElementById("modalCancel");
    const modalConfirm = document.getElementById("modalConfirm");

    const me = current ? JSON.parse(localStorage.getItem("user_" + current)) : null;
    if (!me || me.email !== FOUNDER_EMAIL) {
        notFounder.style.display = "block";
        return;
    }
    adminContent.style.display = "block";

    let pendingAction = null;

    function openModal(title, action, showDuration) {
        pendingAction = action;
        modalTitle.textContent = title;
        modalReason.value = "";
        modalDurationField.style.display = showDuration ? "block" : "none";
        modal.classList.add("active");
    }
    function closeModal() { modal.classList.remove("active"); pendingAction = null; }

    modalCancel.onclick = closeModal;
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    modalConfirm.onclick = () => {
        const reason = modalReason.value.trim();
        if (!reason) { toast("Укажите причину"); return; }
        const duration = modalDuration.value;
        if (pendingAction) pendingAction(reason, duration);
        closeModal();
        renderUsers();
    };

    function formatUntil(duration) {
        if (duration === "forever") return "forever";
        const ms = { "1h": 3600e3, "1d": 86400e3, "7d": 604800e3, "30d": 2592000e3 }[duration];
        return Date.now() + ms;
    }

    function renderUsers() {
        usersList.innerHTML = "";
        const users = getUsers();
        users.sort((a, b) => (b.founder ? 1 : 0) - (a.founder ? 1 : 0));

        document.getElementById("statTotal").textContent = users.length;
        document.getElementById("statVerified").textContent = users.filter(u => u.verified).length;
        document.getElementById("statBlocked").textContent = users.filter(u => isBlocked(u)).length;

        if (!users.length) {
            usersList.innerHTML = "<p style='color:var(--text-muted);text-align:center;padding:30px'>Нет пользователей</p>";
            return;
        }

        users.forEach(u => {
            const isFounder = u.email === FOUNDER_EMAIL;
            const blocked = isBlocked(u);
            const row = document.createElement("div");
            row.className = "user-row" + (blocked ? " blocked" : "");

            const avatarHtml = u.avatar
                ? `<div class="user-avatar"><img src="${u.avatar}"></div>`
                : `<div class="user-avatar">${u.login[0].toUpperCase()}</div>`;

            let blockInfo = "";
            if (blocked) {
                const until = u.blockedUntil === "forever" ? "навсегда"
                    : new Date(u.blockedUntil).toLocaleDateString();
                blockInfo = `<div style="font-size:11px;color:var(--danger);margin-top:4px">🚫 до ${until} · ${u.blockReason}</div>`;
            }

            row.innerHTML = `
                <div class="user-info">
                    ${avatarHtml}
                    <div class="user-meta">
                        <div class="user-name">
                            ${u.login}
                            ${u.verified ? '<span class="verified-badge small"></span>' : ''}
                            ${isFounder ? '<span>👑</span>' : ''}
                        </div>
                        <div class="user-email">${u.email}</div>
                        ${blockInfo}
                    </div>
                </div>
                <div class="user-actions">
                    ${isFounder ? '<span style="font-size:12px;color:var(--text-muted)">Основатель</span>' : `
                        <button class="btn-mini ${u.verified ? 'gray' : 'green'}" data-act="verify" data-email="${u.email}">
                            ${u.verified ? 'Снять ✓' : 'Выдать ✓'}
                        </button>
                        ${blocked
                            ? `<button class="btn-mini green" data-act="unblock" data-email="${u.email}">Разблокировать</button>`
                            : `<button class="btn-mini red" data-act="block" data-email="${u.email}">Заблокировать</button>`}
                        <button class="btn-mini red" data-act="delete" data-email="${u.email}">Удалить</button>
                    `}
                </div>
            `;
            usersList.appendChild(row);
        });

        usersList.querySelectorAll("[data-act]").forEach(btn => {
            btn.onclick = () => {
                const email = btn.dataset.email;
                const act = btn.dataset.act;
                const user = JSON.parse(localStorage.getItem("user_" + email));
                if (!user) return;

                if (act === "verify") {
                    user.verified = !user.verified;
                    saveUser(user);
                    renderUsers();
                    toast(user.verified ? "Верификация выдана" : "Верификация снята");
                }
                if (act === "block") {
                    openModal(`Блокировка: ${user.login}`, (reason, duration) => {
                        user.blocked = true;
                        user.blockedUntil = formatUntil(duration);
                        user.blockReason = reason;
                        user.blockedBy = me.email;
                        user.blockedAt = Date.now();
                        saveUser(user);
                        toast("Пользователь заблокирован");
                    }, true);
                }
                if (act === "unblock") {
                    user.blocked = false;
                    user.blockedUntil = null;
                    user.blockReason = null;
                    saveUser(user);
                    renderUsers();
                    toast("Разблокирован");
                }
                if (act === "delete") {
                    openModal(`Удалить: ${user.login}?`, (reason) => {
                        user.blockHistory = user.blockHistory || [];
                        user.blockHistory.push({
                            type: "delete",
                            reason,
                            by: me.email,
                            at: Date.now()
                        });
                        localStorage.removeItem("user_" + email);
                        toast("Аккаунт удалён");
                    }, false);
                }
            };
        });
    }

    renderUsers();
});

// ==========================================
// ПОИСК
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("searchInput");
    if (!input) return;
    const results = document.getElementById("searchResults");

    const items = [
        { title: "Первый фильм", type: "🎬 Фильм", color: "#ff6b6b" },
        { title: "Новый сериал", type: "📺 Сериал", color: "#4ecdc4" },
        { title: "Хиты недели", type: "🎵 Музыка", color: "#a29bfe" },
        { title: "Топ игр", type: "🎮 Игра", color: "#fdcb6e" },
        { title: "Новости дня", type: "📰 Новости", color: "#74b9ff" },
        { title: "Комедия вечера", type: "🎬 Фильм", color: "#ff6b6b" },
        { title: "Драма года", type: "🎬 Фильм", color: "#ff6b6b" },
        { title: "Подкаст о кино", type: "🎵 Музыка", color: "#a29bfe" },
        { title: "Космическая одиссея", type: "🎬 Фильм", color: "#ff6b6b" },
        { title: "Игровые новинки", type: "🎮 Игра", color: "#fdcb6e" }
    ];

    function render(list) {
        if (!list.length) {
            results.innerHTML = `<div class="search-empty"><i class="fas fa-face-frown"></i>Ничего не найдено</div>`;
            return;
        }
        results.innerHTML = list.map(i => `
            <div class="search-result">
                <div class="sr-icon" style="background:${i.color}20;color:${i.color}">${i.type.split(" ")[0]}</div>
                <div class="sr-info"><b>${i.title}</b><small>${i.type}</small></div>
            </div>
        `).join("");
    }

    input.addEventListener("input", () => {
        const q = input.value.trim().toLowerCase();
        if (!q) {
            results.innerHTML = `<div class="search-empty"><i class="fas fa-magnifying-glass"></i>Начните вводить запрос</div>`;
            return;
        }
        render(items.filter(i => i.title.toLowerCase().includes(q)));
    });
});

// ==========================================
// ЧИПЫ КАТЕГОРИЙ
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const chips = document.querySelectorAll(".chip");
    chips.forEach(chip => {
        chip.onclick = () => {
            chips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
        };
    });
});
