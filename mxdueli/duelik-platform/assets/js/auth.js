// =========================================
// AUTHENTICATION JAVASCRIPT
// Login Page Functionality
// =========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth system initialized');
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize social login
    initializeSocialLogin();
    
    // Initialize password features
    initializePasswordFeatures();
});

// =========================================
// FORM VALIDATION
// =========================================

function initializeFormValidation() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Real-time validation
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
        emailInput.addEventListener('input', clearFieldError);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePassword);
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.querySelector('input[name="remember"]').checked;
    
    // Validate form
    if (!validateLoginForm(email, password)) {
        return;
    }
    
    // Show loading state
    showLoading(submitBtn);
    
    try {
        // Make API request
        const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            email: email,
            password: password
        });
        
        if (response.success && response.data.success) {
            // Store tokens
            const { token, user } = response.data;
            localStorage.setItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
            localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
            
            if (remember) {
                localStorage.setItem(API_CONFIG.STORAGE_KEYS.REMEMBER_ME, 'true');
                localStorage.setItem('rememberEmail', email);
            } else {
                localStorage.removeItem(API_CONFIG.STORAGE_KEYS.REMEMBER_ME);
                localStorage.removeItem('rememberEmail');
            }
            
            showNotification('تم تسجيل الدخول بنجاح!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '../dashboard.html';
            }, 1500);
        } else {
            throw new Error(response.data.message || 'فشل في تسجيل الدخول');
        }
    } catch (error) {
        console.error('Login error:', error);
        hideLoading(submitBtn);
        showNotification(error.message || 'حدث خطأ في تسجيل الدخول', 'error');
    }
}

function validateLoginForm(email, password) {
    let isValid = true;
    
    // Validate email
    if (!email || !isValidEmail(email)) {
        showFieldError('email', 'يرجى إدخال بريد إلكتروني صحيح');
        isValid = false;
    }
    
    // Validate password
    if (!password || password.length < 6) {
        showFieldError('password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        isValid = false;
    }
    
    return isValid;
}

function validateEmail(e) {
    const email = e.target.value;
    
    if (email && !isValidEmail(email)) {
        showFieldError('email', 'يرجى إدخال بريد إلكتروني صحيح');
    } else {
        clearFieldError('email');
    }
}

function validatePassword(e) {
    const password = e.target.value;
    
    if (password.length < 6) {
        showFieldError('password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    } else {
        clearFieldError('password');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    // Remove existing error
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error styles
    formGroup.classList.add('error');
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    formGroup.appendChild(errorDiv);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    formGroup.classList.remove('error');
    
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

// =========================================
// PASSWORD FEATURES
// =========================================

function initializePasswordFeatures() {
    const passwordInput = document.getElementById('password');
    
    if (passwordInput) {
        // Remember saved email
        loadRememberedEmail();
        
        // Password strength indicator
        passwordInput.addEventListener('input', updatePasswordStrength);
    }
}

function loadRememberedEmail() {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    
    if (rememberedEmail) {
        const emailInput = document.getElementById('email');
        const rememberCheckbox = document.querySelector('input[name="remember"]');
        
        if (emailInput) {
            emailInput.value = rememberedEmail;
        }
        
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
}

function updatePasswordStrength(e) {
    const password = e.target.value;
    const strengthMeter = document.querySelector('.strength-meter');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthMeter || !strengthText) return;
    
    let strength = 0;
    let strengthLabel = 'ضعيفة جداً';
    
    // Check password criteria
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Update visual indicator
    const percentage = (strength / 4) * 100;
    strengthMeter.style.setProperty('--strength-width', `${percentage}%`);
    
    // Update text
    if (strength <= 1) {
        strengthLabel = 'ضعيفة جداً';
        strengthText.style.color = '#FF6B6B';
    } else if (strength <= 2) {
        strengthLabel = 'ضعيفة';
        strengthText.style.color = '#FFA500';
    } else if (strength <= 3) {
        strengthLabel = 'متوسطة';
        strengthText.style.color = '#0A84FF';
    } else {
        strengthLabel = 'قوية';
        strengthText.style.color = '#4CAF50';
    }
    
    strengthText.textContent = strengthLabel;
}

// =========================================
// SOCIAL LOGIN
// =========================================

function initializeSocialLogin() {
    const googleBtn = document.querySelector('.btn-google');
    const appleBtn = document.querySelector('.btn-apple');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', () => handleSocialLogin('google'));
    }
    
    if (appleBtn) {
        appleBtn.addEventListener('click', () => handleSocialLogin('apple'));
    }
}

function handleSocialLogin(provider) {
    const button = document.querySelector(`.btn-${provider}`);
    
    if (button) {
        showLoading(button);
    }
    
    // In real app, this would redirect to OAuth provider
    setTimeout(() => {
        if (button) {
            hideLoading(button);
        }
        
        // Simulate successful social login
        showNotification(`تم تسجيل الدخول عبر ${provider} بنجاح!`, 'success');
        
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 1500);
    }, 2000);
}

// =========================================
// UTILITY FUNCTIONS
// =========================================

function simulateLogin(email, password) {
    // Simulate API validation
    const validEmails = ['test@example.com', 'admin@dueli.com', 'user@dueli.com'];
    const validPassword = 'password123';
    
    return validEmails.includes(email) && password === validPassword;
}

function showLoading(button) {
    button.classList.add('loading');
    button.disabled = true;
}

function hideLoading(button) {
    button.classList.remove('loading');
    button.disabled = false;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">×</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        border-left: 4px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#FF6B6B' : '#0A84FF'};
        z-index: 1000;
        max-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// =========================================
// KEYBOARD SHORTCUTS
// =========================================

document.addEventListener('keydown', function(e) {
    // Enter to submit form
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const form = e.target.closest('form');
        if (form && form.id === 'loginForm') {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.click();
            }
        }
    }
});

// =========================================
// FOCUS MANAGEMENT
// =========================================

// Auto-focus email field on page load
window.addEventListener('load', function() {
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.focus();
    }
});

// Smooth focus transitions
document.addEventListener('focusin', function(e) {
    const formGroup = e.target.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('focused');
    }
});

document.addEventListener('focusout', function(e) {
    const formGroup = e.target.closest('.form-group');
    if (formGroup) {
        formGroup.classList.remove('focused');
    }
});

// =========================================
// ACCESSIBILITY ENHANCEMENTS
// =========================================

// Add ARIA labels and descriptions
function enhanceAccessibility() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (emailInput) {
        emailInput.setAttribute('aria-describedby', 'email-error');
        emailInput.setAttribute('aria-invalid', 'false');
    }
    
    if (passwordInput) {
        passwordInput.setAttribute('aria-describedby', 'password-help');
        passwordInput.setAttribute('aria-invalid', 'false');
    }
    
    if (submitBtn) {
        submitBtn.setAttribute('aria-describedby', 'login-help');
    }
}

// Initialize accessibility enhancements
enhanceAccessibility();