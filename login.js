const USERS_KEY    = "cropSetuUsers";
const LOGGED_KEY   = "cropSetuLoggedIn";
const CURRENT_KEY  = "cropSetuCurrentUser";
const REMEMBER_KEY = "cropSetuRememberPhone";

function loadUsers() {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        if (!raw) { return []; }
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        localStorage.removeItem(USERS_KEY);
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function isValidPhone(phone) {
    return /^[0-9]{10}$/.test(phone);
}

function showMessage(box, text, isSuccess) {
    if (!box) { return; }
    box.textContent = text;
    if (isSuccess) {
        box.classList.add("success");
    } else {
        box.classList.remove("success");
    }
}

const loginScreen  = document.getElementById("loginScreen");
const signupScreen = document.getElementById("signupScreen");
const forgotScreen = document.getElementById("forgotScreen");

function showScreen(screenToShow) {
    [loginScreen, signupScreen, forgotScreen].forEach(function(screen) {
        if (!screen) { return; }
        if (screen === screenToShow) {
            screen.classList.remove("hidden");
        } else {
            screen.classList.add("hidden");
        }
    });
    window.scrollTo(0, 0);
}

// Pehle se logged in hai to seedha dashboard
if (localStorage.getItem(LOGGED_KEY) === "true") {
    window.location.replace("index.html");
}

const loginPhone    = document.getElementById("loginPhone");
const loginPassword = document.getElementById("loginPassword");
const loginError    = document.getElementById("loginError");
const rememberMe    = document.getElementById("rememberMe");

// Remember me wala phone wapas bhar do
const rememberedPhone = localStorage.getItem(REMEMBER_KEY);
if (rememberedPhone && loginPhone) {
    loginPhone.value = rememberedPhone;
    if (rememberMe) { rememberMe.checked = true; }
}

// Screen switching
const showSignupButton = document.getElementById("showSignup");
const backToLoginButton = document.getElementById("backToLogin");
const forgotButton = document.getElementById("forgotPassword");
const backFromForgot = document.getElementById("backFromForgot");

if (showSignupButton) {
    showSignupButton.addEventListener("click", function() { showScreen(signupScreen); });
}
if (backToLoginButton) {
    backToLoginButton.addEventListener("click", function() { showScreen(loginScreen); });
}
if (forgotButton) {
    forgotButton.addEventListener("click", function() { showScreen(forgotScreen); });
}
if (backFromForgot) {
    backFromForgot.addEventListener("click", function() { showScreen(loginScreen); });
}

// Password show/hide
const togglePassword = document.getElementById("togglePassword");
if (togglePassword && loginPassword) {
    togglePassword.addEventListener("click", function() {
        if (loginPassword.type === "password") {
            loginPassword.type = "text";
            togglePassword.textContent = "🙈";
        } else {
            loginPassword.type = "password";
            togglePassword.textContent = "👁";
        }
    });
}

// ========== SIGNUP ==========
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const errorBox = document.getElementById("signupError");

        const name = document.getElementById("signupName").value.trim();
        const phone = document.getElementById("signupPhone").value.trim();
        const village = document.getElementById("signupVillage") ? document.getElementById("signupVillage").value.trim() : "";
        const crops = document.getElementById("signupCrops") ? document.getElementById("signupCrops").value.trim() : "";
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("signupConfirmPassword").value;

        showMessage(errorBox, "", false);

        if (name.length < 2) {
            showMessage(errorBox, "Please enter your full name.", false);
            return;
        }
        if (!isValidPhone(phone)) {
            showMessage(errorBox, "Please enter a valid 10-digit mobile number.", false);
            return;
        }
        if (password.length < 8) {
            showMessage(errorBox, "Password must contain at least 8 characters.", false);
            return;
        }
        if (password !== confirmPassword) {
            showMessage(errorBox, "Passwords do not match.", false);
            return;
        }

        const users = loadUsers();
        const alreadyExists = users.some(function(user) {
            return user.phone === phone;
        });

        if (alreadyExists) {
            showMessage(errorBox, "An account with this number already exists.", false);
            return;
        }

        const newUser = {
            name: name,
            phone: phone,
            village: village,
            crops: crops,
            password: password,
            joinedAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        // Auto profile save — dashboard mein seedha dikhega
        localStorage.setItem(
            "farmerProfile__" + phone,
            JSON.stringify({
                name: name,
                phone: phone,
                village: village,
                crops: crops
            })
        );

        // Current user save
        localStorage.setItem(CURRENT_KEY, JSON.stringify({
            name: name,
            phone: phone
        }));

        showMessage(errorBox, "✓ Account created successfully!", true);
        signupForm.reset();

        setTimeout(function() {
            showScreen(loginScreen);
            showMessage(errorBox, "", false);
            if (loginPhone) { loginPhone.value = phone; }
            if (loginPassword) { loginPassword.focus(); }
        }, 1200);
    });
}

// ========== LOGIN ==========
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const phone    = loginPhone.value.trim();
        const password = loginPassword.value;

        showMessage(loginError, "", false);

        if (!isValidPhone(phone)) {
            showMessage(loginError, "Please enter a valid 10-digit mobile number.", false);
            return;
        }

        const users = loadUsers();
        if (users.length === 0) {
            showMessage(loginError, "No account found. Please create an account.", false);
            return;
        }

        const matchedUser = users.find(function(user) {
            return user.phone === phone && user.password === password;
        });

        if (!matchedUser) {
            showMessage(loginError, "Invalid mobile number or password.", false);
            return;
        }

        localStorage.setItem(LOGGED_KEY, "true");
        localStorage.setItem(CURRENT_KEY, JSON.stringify({
            name: matchedUser.name,
            phone: matchedUser.phone
        }));

        // Profile bhi save karo (agar signup ke time nahi hua tha)
        const profileKey = "farmerProfile__" + matchedUser.phone;
        if (!localStorage.getItem(profileKey)) {
            localStorage.setItem(profileKey, JSON.stringify({
                name: matchedUser.name,
                phone: matchedUser.phone,
                village: matchedUser.village || "",
                crops: matchedUser.crops || ""
            }));
        }

        if (rememberMe && rememberMe.checked) {
            localStorage.setItem(REMEMBER_KEY, phone);
        } else {
            localStorage.removeItem(REMEMBER_KEY);
        }

        showMessage(loginError, "✓ Welcome, " + matchedUser.name + "! Loading dashboard...", true);

        const submitButton = loginForm.querySelector(".login-button");
        if (submitButton) { submitButton.disabled = true; }

        setTimeout(function() {
            window.location.href = "index.html";
        }, 900);
    });
}

// ========== FORGOT PASSWORD ==========
const forgotForm = document.getElementById("forgotForm");
if (forgotForm) {
    forgotForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const errorBox = document.getElementById("forgotError");

        const phone = document.getElementById("forgotPhone").value.trim();
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmNewPassword").value;

        showMessage(errorBox, "", false);

        if (!isValidPhone(phone)) {
            showMessage(errorBox, "Please enter a valid 10-digit mobile number.", false);
            return;
        }

        const users = loadUsers();
        const index = users.findIndex(function(user) {
            return user.phone === phone;
        });

        if (index === -1) {
            showMessage(errorBox, "No account found with this number.", false);
            return;
        }

        if (newPassword.length < 8) {
            showMessage(errorBox, "Password must contain at least 8 characters.", false);
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage(errorBox, "Passwords do not match.", false);
            return;
        }

        users[index].password = newPassword;
        saveUsers(users);

        showMessage(errorBox, "✓ Password reset successfully!", true);
        forgotForm.reset();

        setTimeout(function() {
            showScreen(loginScreen);
            showMessage(errorBox, "", false);
            if (loginPhone) { loginPhone.value = phone; }
            if (loginPassword) { loginPassword.focus(); }
        }, 1200);
    });
}