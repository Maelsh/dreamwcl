// =========================================
// REGISTRATION JAVASCRIPT
// Registration Page Functionality
// =========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Registration system initialized');
    
    // Initialize user type selection
    initializeUserTypeSelection();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize password features
    initializePasswordFeatures();
    
    // Initialize tag suggestions
    initializeTagSuggestions();
    
    // Initialize character counters
    initializeCharacterCounters();
});

// =========================================
// USER TYPE SELECTION
// =========================================

function initializeUserTypeSelection() {
    const userTypeCards = document.querySelectorAll('.user-type-card');
    
    userTypeCards.forEach(card => {
        card.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            // Update card appearance
            userTypeCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            // Show relevant fields based on user type
            updateFormFieldsByUserType(radio.value);
        });
    });
}

function updateFormFieldsByUserType(userType) {
    const registerForm = document.getElementById('registerForm');
    
    // Add user type to form data
    const userTypeInput = document.createElement('input');
    userTypeInput.type = 'hidden';
    userTypeInput.name = 'userType';
    userTypeInput.value = userType;
    
    // Remove existing user type input
    const existingInput = registerForm.querySelector('input[name="userType"]');
    if (existingInput) {
        existingInput.remove();
    }
    
    registerForm.appendChild(userTypeInput);
}

// =========================================
// FORM VALIDATION
// =========================================

function initializeFormValidation() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    
    // Real-time validation
    const fields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'country'];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', () => validateField(fieldId, field.value));
            field.addEventListener('input', () => clearFieldError(fieldId));
        }
    });
    
    // Confirm password validation
    const confirmPasswordField = document.getElementById('confirmPassword');
    const passwordField = document.getElementById('password');
    
    if (confirmPasswordField && passwordField) {
        confirmPasswordField.addEventListener('input', validatePasswordMatch);
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Collect form data
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        country: document.getElementById('country').value,
        language: document.getElementById('language').value,
        userType: document.querySelector('input[name="userType"]:checked')?.value || 'competitor',
        terms: document.querySelector('input[name="terms"]').checked,
        notifications: document.querySelector('input[name="notifications"]').checked
    };
    
    // Validate entire form
    if (!validateRegistrationForm(formData)) {
        return;
    }
    
    // Show loading state
    showLoading(submitBtn);
    
    try {
        // Prepare API data
        const apiData = {
            username: `${formData.firstName}.${formData.lastName}`.toLowerCase().replace(/\s+/g, ''),
            email: formData.email,
            password: formData.password,
            fullName: `${formData.firstName} ${formData.lastName}`,
            country: formData.country,
            language: formData.language,
            userType: formData.userType,
            preferences: {
                emailNotifications: formData.notifications,
                termsAccepted: formData.terms
            }
        };
        
        // Make API request
        const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, apiData);
        
        if (response.success && response.data.success) {
            showNotification('تم إنشاء الحساب بنجاح!', 'success');
            
            // Redirect to login or dashboard based on user type
            setTimeout(() => {
                if (formData.userType === 'viewer') {
                    window.location.href = 'login.html';
                } else {
                    window.location.href = '../dashboard.html';
                }
            }, 2000);
        } else {
            throw new Error(response.data.message || 'فشل في إنشاء الحساب');
        }
    } catch (error) {
        console.error('Registration error:', error);
        hideLoading(submitBtn);
        showNotification(error.message || 'حدث خطأ أثناء إنشاء الحساب', 'error');
    }
}

function validateRegistrationForm(data) {
    let isValid = true;
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'country'];
    
    requiredFields.forEach(fieldId => {
        if (!data[fieldId] || data[fieldId].trim() === '') {
            showFieldError(fieldId, 'هذا الحقل مطلوب');
            isValid = false;
        }
    });
    
    // Validate email
    if (data.email && !isValidEmail(data.email)) {
        showFieldError('email', 'يرجى إدخال بريد إلكتروني صحيح');
        isValid = false;
    }
    
    // Validate password strength
    if (data.password && !isValidPassword(data.password)) {
        showFieldError('password', 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل وتتضمن أحرف كبيرة وصغيرة وأرقام');
        isValid = false;
    }
    
    // Validate password match
    if (data.password !== data.confirmPassword) {
        showFieldError('confirmPassword', 'كلمات المرور غير متطابقة');
        isValid = false;
    }
    
    // Validate terms acceptance
    if (!data.terms) {
        showNotification('يجب الموافقة على شروط الاستخدام', 'error');
        isValid = false;
    }
    
    return isValid;
}

function validateField(fieldId, value) {
    let isValid = true;
    
    switch (fieldId) {
        case 'firstName':
        case 'lastName':
            if (value && value.length < 2) {
                showFieldError(fieldId, 'الاسم يجب أن يكون حرفين على الأقل');
                isValid = false;
            }
            break;
        case 'email':
            if (value && !isValidEmail(value)) {
                showFieldError(fieldId, 'يرجى إدخال بريد إلكتروني صحيح');
                isValid = false;
            }
            break;
        case 'password':
            if (value && !isValidPassword(value)) {
                showFieldError(fieldId, 'كلمة المرور ضعيفة جداً');
                isValid = false;
            }
            break;
        case 'confirmPassword':
            const password = document.getElementById('password').value;
            if (value && value !== password) {
                showFieldError(fieldId, 'كلمات المرور غير متطابقة');
                isValid = false;
            }
            break;
        case 'country':
            if (!value) {
                showFieldError(fieldId, 'يرجى اختيار دولتك');
                isValid = false;
            }
            break;
    }
    
    return isValid;
}

function validatePasswordMatch(e) {
    const confirmPassword = e.target.value;
    const password = document.getElementById('password').value;
    
    if (confirmPassword && password && confirmPassword !== password) {
        showFieldError('confirmPassword', 'كلمات المرور غير متطابقة');
    } else {
        clearFieldError('confirmPassword');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 digit
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// =========================================
// PASSWORD FEATURES
// =========================================

function initializePasswordFeatures() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', updatePasswordStrength);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
}

function updatePasswordStrength(e) {
    const password = e.target.value;
    const strengthMeter = document.querySelector('.strength-meter');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthMeter || !strengthText) return;
    
    let strength = 0;
    let strengthLabel = 'ضعيفة جداً';
    let strengthColor = '#FF6B6B';
    
    // Check password criteria
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Update visual indicator
    const percentage = (strength / 5) * 100;
    
    // Update meter color
    if (strength <= 2) {
        strengthLabel = 'ضعيفة';
        strengthColor = '#FF6B6B';
    } else if (strength <= 3) {
        strengthLabel = 'متوسطة';
        strengthColor = '#FFA500';
    } else if (strength <= 4) {
        strengthLabel = 'قوية';
        strengthColor = '#0A84FF';
    } else {
        strengthLabel = 'قوية جداً';
        strengthColor = '#4CAF50';
    }
    
    // Animate meter
    strengthMeter.style.transition = 'width 0.3s ease';
    strengthMeter.style.setProperty('--strength-width', `${percentage}%`);
    strengthMeter.style.setProperty('--strength-color', strengthColor);
    strengthText.textContent = strengthLabel;
    strengthText.style.color = strengthColor;
}

// =========================================
// TAG SUGGESTIONS
// =========================================

function initializeTagSuggestions() {
    const tagInput = document.getElementById('challengeTags');
    const suggestedTags = document.querySelectorAll('.suggested-tag');
    
    if (tagInput && suggestedTags) {
        suggestedTags.forEach(tag => {
            tag.addEventListener('click', function() {
                const tagText = this.getAttribute('data-tag');
                addTag(tagInput, tagText);
            });
        });
        
        // Handle manual tag input
        tagInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const tagText = this.value.trim();
                if (tagText) {
                    addTag(this, tagText);
                    this.value = '';
                }
            }
        });
    }
}

function addTag(input, tagText) {
    if (!tagText) return;
    
    // Remove existing tag
    const existingTag = input.parentNode.querySelector(`.tag[data-tag="${tagText}"]`);
    if (existingTag) return;
    
    // Create tag element
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.setAttribute('data-tag', tagText);
    tagElement.innerHTML = `
        ${tagText}
        <button type="button" class="tag-remove">×</button>
    `;
    
    // Add remove functionality
    tagElement.querySelector('.tag-remove').addEventListener('click', function() {
        tagElement.remove();
        updateInputValue(input);
    });
    
    // Insert tag
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'selected-tags';
    tagsContainer.appendChild(tagElement);
    
    input.parentNode.insertBefore(tagsContainer, input.nextSibling);
    updateInputValue(input);
}

function updateInputValue(input) {
    const tags = input.parentNode.querySelectorAll('.tag[data-tag]');
    const tagValues = Array.from(tags).map(tag => tag.getAttribute('data-tag'));
    input.value = tagValues.join(', ');
}

// =========================================
// CHARACTER COUNTERS
// =========================================

function initializeCharacterCounters() {
    const fieldsWithCounters = ['firstName', 'lastName'];
    
    fieldsWithCounters.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            const counter = document.createElement('div');
            counter.className = 'char-count';
            counter.textContent = `${field.value.length}/50`;
            field.parentNode.appendChild(counter);
            
            field.addEventListener('input', function() {
                counter.textContent = `${this.value.length}/50`;
                
                if (this.value.length > 50) {
                    counter.style.color = '#FF6B6B';
                } else {
                    counter.style.color = '#B0B0B0';
                }
            });
        }
    });
}

// =========================================
// UTILITY FUNCTIONS
// =========================================

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
    
    // Update ARIA
    field.setAttribute('aria-invalid', 'true');
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    formGroup.classList.remove('error');
    
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Update ARIA
    field.setAttribute('aria-invalid', 'false');
}

function simulateRegistration(formData) {
    // Simulate API validation
    const registeredEmails = ['test@example.com', 'admin@dueli.com'];
    
    // Check if email already exists
    if (registeredEmails.includes(formData.email)) {
        showFieldError('email', 'هذا البريد الإلكتروني مسجل بالفعل');
        return false;
    }
    
    // Simulate successful registration
    return true;
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
        backdrop-filter: blur(10px);
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
// FORM AUTOFILL HELPERS
// =========================================

// Auto-fill for demo purposes
function setupDemoData() {
    const demoData = {
        firstName: 'أحمد',
        lastName: 'محمد',
        email: 'demo@dueli.com',
        password: 'DemoPass123',
        country: 'SA',
        language: 'ar'
    };
    
    // Add demo button (for testing)
    const demoBtn = document.createElement('button');
    demoBtn.className = 'btn btn-secondary';
    demoBtn.textContent = 'ملء البيانات التجريبية';
    demoBtn.style.position = 'absolute';
    demoBtn.style.top = '1rem';
    demoBtn.style.left = '1rem';
    demoBtn.style.zIndex = '10';
    
    demoBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        Object.keys(demoData).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                field.value = demoData[key];
                field.dispatchEvent(new Event('input'));
            }
        });
        
        showNotification('تم ملء البيانات التجريبية', 'success');
    });
    
    document.querySelector('.auth-card').appendChild(demoBtn);
}

// Initialize demo data in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(setupDemoData, 1000);
}

// =========================================
// KEYBOARD SHORTCUTS
// =========================================

document.addEventListener('keydown', function(e) {
    // Ctrl+Enter to submit form
    if (e.ctrlKey && e.key === 'Enter') {
        const form = e.target.closest('form');
        if (form && form.id === 'registerForm') {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.click();
            }
        }
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
        const form = document.getElementById('registerForm');
        if (form) {
            form.reset();
            
            // Clear all errors
            const errorMessages = form.querySelectorAll('.error-message');
            errorMessages.forEach(error => error.remove());
            
            const errorGroups = form.querySelectorAll('.form-group.error');
            errorGroups.forEach(group => group.classList.remove('error'));
        }
    }
});

// =========================================
// FOCUS MANAGEMENT
// =========================================

// Auto-focus first name field on page load
window.addEventListener('load', function() {
    const firstNameField = document.getElementById('firstName');
    if (firstNameField) {
        firstNameField.focus();
    }
});

// Enhanced focus management
document.addEventListener('focusin', function(e) {
    const formGroup = e.target.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('focused');
        
        // Add floating label effect
        const label = formGroup.querySelector('label');
        if (label) {
            label.classList.add('floating');
        }
    }
});

document.addEventListener('focusout', function(e) {
    const formGroup = e.target.closest('.form-group');
    if (formGroup) {
        formGroup.classList.remove('focused');
        
        // Remove floating label effect if field is empty
        const label = formGroup.querySelector('label');
        if (label && !e.target.value) {
            label.classList.remove('floating');
        }
    }
});