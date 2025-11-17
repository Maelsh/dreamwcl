// =========================================
// CREATE CHALLENGE JAVASCRIPT
// Challenge Creation Page Functionality
// =========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Create Challenge initialized');
    
    // Initialize multi-step form
    initializeSteps();
    
    // Initialize form validation
    initializeValidation();
    
    // Initialize dynamic content
    initializeDynamicContent();
    
    // Initialize form interactions
    initializeFormInteractions();
    
    // Initialize progress tracking
    initializeProgressTracking();
});

let currentStep = 1;
const totalSteps = 4;

// =========================================
// MULTI-STEP FORM MANAGEMENT
// =========================================

function initializeSteps() {
    // Step navigation
    const nextButtons = ['nextBtn1', 'nextBtn2', 'nextBtn3'].map(id => document.getElementById(id));
    const prevButtons = ['prevBtn2', 'prevBtn3', 'prevBtn4'].map(id => document.getElementById(id));
    
    nextButtons.forEach((btn, index) => {
        if (btn) {
            btn.addEventListener('click', () => goToNextStep());
        }
    });
    
    prevButtons.forEach((btn, index) => {
        if (btn) {
            btn.addEventListener('click', () => goToPreviousStep());
        }
    });
    
    // Create challenge button
    const createBtn = document.getElementById('createChallenge');
    if (createBtn) {
        createBtn.addEventListener('click', handleCreateChallenge);
    }
    
    // Step indicators clickable
    const stepIndicators = document.querySelectorAll('.step');
    stepIndicators.forEach((step, index) => {
        step.addEventListener('click', () => {
            const stepNumber = parseInt(step.getAttribute('data-step'));
            if (stepNumber < currentStep) {
                goToStep(stepNumber);
            }
        });
    });
    
    // Load saved form data
    loadSavedFormData();
}

function goToNextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            updateStepDisplay();
            updateProgressIndicators();
            saveFormData();
        }
    }
}

function goToPreviousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
        updateProgressIndicators();
    }
}

function goToStep(stepNumber) {
    if (stepNumber >= 1 && stepNumber <= totalSteps) {
        currentStep = stepNumber;
        updateStepDisplay();
        updateProgressIndicators();
    }
}

function updateStepDisplay() {
    // Hide all steps
    const steps = document.querySelectorAll('.form-step');
    steps.forEach(step => step.classList.add('hidden'));
    
    // Show current step
    const currentStepElement = document.getElementById(`step${currentStep}`);
    if (currentStepElement) {
        currentStepElement.classList.remove('hidden');
        currentStepElement.classList.add('fade-in');
    }
    
    // Update progress indicators
    updateProgressIndicators();
    
    // Scroll to top of form
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

function updateProgressIndicators() {
    const steps = document.querySelectorAll('.step');
    
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        
        if (stepNumber < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    // Update progress bar
    const progressBar = document.querySelector('.time-progress .progress-fill');
    if (progressBar) {
        const progress = (currentStep / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

// =========================================
// VALIDATION SYSTEM
// =========================================

function initializeValidation() {
    // Real-time validation for required fields
    const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
    
    requiredFields.forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => clearFieldError(field.id));
    });
    
    // Specific validations
    initializeSpecificValidations();
}

function validateCurrentStep() {
    let isValid = true;
    
    switch (currentStep) {
        case 1:
            isValid = validateStep1();
            break;
        case 2:
            isValid = validateStep2();
            break;
        case 3:
            isValid = validateStep3();
            break;
        case 4:
            isValid = validateStep4();
            break;
    }
    
    return isValid;
}

function validateStep1() {
    // Validate category selection
    const category = document.querySelector('input[name="category"]:checked');
    if (!category) {
        showNotification('يرجى اختيار نوع المنافسة', 'error');
        return false;
    }
    
    // Validate sub-category selection
    const subCategory = document.querySelector('.sub-category-item.selected');
    if (!subCategory) {
        showNotification('يرجى اختيار المجال الفرعي', 'error');
        return false;
    }
    
    return true;
}

function validateStep2() {
    let isValid = true;
    
    // Validate title
    const title = document.getElementById('challengeTitle');
    if (!title.value || title.value.trim().length < 10) {
        showFieldError('challengeTitle', 'عنوان المنافسة يجب أن يكون 10 أحرف على الأقل');
        isValid = false;
    }
    
    // Validate description
    const description = document.getElementById('challengeDescription');
    if (!description.value || description.value.trim().length < 50) {
        showFieldError('challengeDescription', 'وصف المنافسة يجب أن يكون 50 حرف على الأقل');
        isValid = false;
    }
    
    // Validate rules
    const rules = document.getElementById('challengeRules');
    if (!rules.value || rules.value.trim().length < 30) {
        showFieldError('challengeRules', 'قوانين المنافسة يجب أن تكون 30 حرف على الأقل');
        isValid = false;
    }
    
    return isValid;
}

function validateStep3() {
    const scheduleType = document.querySelector('input[name="scheduleType"]:checked');
    if (!scheduleType) {
        showNotification('يرجى اختيار نوع الجدولة', 'error');
        return false;
    }
    
    if (scheduleType.value === 'scheduled') {
        const date = document.getElementById('scheduleDate');
        const time = document.getElementById('scheduleTime');
        
        if (!date.value || !time.value) {
            showNotification('يرجى تحديد تاريخ ووقت المنافسة', 'error');
            return false;
        }
        
        // Validate future date
        const scheduledDateTime = new Date(`${date.value}T${time.value}`);
        if (scheduledDateTime <= new Date()) {
            showNotification('يرجى اختيار تاريخ ووقت مستقبلي', 'error');
            return false;
        }
    }
    
    return true;
}

function validateStep4() {
    // Final validation before creation
    return validateCurrentStep();
}

function validateField(field) {
    const fieldId = field.id;
    const value = field.value.trim();
    
    // Clear previous errors
    clearFieldError(fieldId);
    
    switch (fieldId) {
        case 'challengeTitle':
            if (value.length < 10) {
                showFieldError(fieldId, 'العنوان قصير جداً');
                return false;
            }
            break;
        case 'challengeDescription':
            if (value.length < 50) {
                showFieldError(fieldId, 'الوصف قصير جداً');
                return false;
            }
            break;
        case 'challengeRules':
            if (value.length < 30) {
                showFieldError(fieldId, 'القوانين غير واضحة');
                return false;
            }
            break;
        case 'email':
            if (!isValidEmail(value)) {
                showFieldError(fieldId, 'بريد إلكتروني غير صحيح');
                return false;
            }
            break;
    }
    
    return true;
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
    
    // Add error styling
    formGroup.classList.add('error');
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    formGroup.appendChild(errorDiv);
    
    // Focus on field
    field.focus();
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

function initializeSpecificValidations() {
    // Password strength for financial setup
    const maxViewersField = document.getElementById('maxViewers');
    if (maxViewersField) {
        maxViewersField.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (value > 10000) {
                showNotification('الحد الأقصى للمشاهدين هو 10,000', 'warning');
            }
        });
    }
    
    // Date validation for scheduled challenges
    const scheduleDateField = document.getElementById('scheduleDate');
    if (scheduleDateField) {
        const today = new Date().toISOString().split('T')[0];
        scheduleDateField.setAttribute('min', today);
    }
}

// =========================================
// DYNAMIC CONTENT MANAGEMENT
// =========================================

function initializeDynamicContent() {
    // Category-based sub-category loading
    const categoryRadios = document.querySelectorAll('input[name="category"]');
    
    categoryRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            loadSubCategories(this.value);
        });
    });
    
    // Load initial sub-categories
    const initialCategory = document.querySelector('input[name="category"]:checked');
    if (initialCategory) {
        loadSubCategories(initialCategory.value);
    }
    
    // Prize type visibility
    const prizeTypeRadios = document.querySelectorAll('input[name="prizeType"]');
    prizeTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            togglePrizeFields(this.value);
        });
    });
    
    // Schedule type visibility
    const scheduleTypeRadios = document.querySelectorAll('input[name="scheduleType"]');
    scheduleTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            toggleScheduleFields(this.value);
        });
    });
    
    // Invite methods change handling
    const inviteMethodCheckboxes = document.querySelectorAll('input[name="inviteMethods"]');
    inviteMethodCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateInvitationOptions();
        });
    });
}

function loadSubCategories(category) {
    const subCategoryGrid = document.getElementById('subCategoryGrid');
    const subCategorySelection = document.getElementById('subCategorySelection');
    
    // Define sub-categories for each main category
    const subCategories = {
        dialogue: [
            { id: 'religious', name: 'حوارات الأديان والمذاهب' },
            { id: 'political', name: 'الأيديولوجيات السياسية' },
            { id: 'economic', name: 'الأنظمة الاقتصادية' },
            { id: 'current', name: 'قضايا الساعة' },
            { id: 'disputes', name: 'النزاعات الأخرى' }
        ],
        science: [
            { id: 'physics', name: 'الفيزياء' },
            { id: 'mathematics', name: 'الرياضيات' },
            { id: 'medicine', name: 'الطب' },
            { id: 'chemistry', name: 'الكيمياء' },
            { id: 'biology', name: 'علم الأحياء' },
            { id: 'technology', name: 'التكنولوجيا' }
        ],
        talent: [
            { id: 'physical', name: 'المواهب البدنية' },
            { id: 'vocal', name: 'المواهب الصوتية' },
            { id: 'mental', name: 'المواهب النفسية' },
            { id: 'artistic', name: 'المواهب الفنية' },
            { id: 'sport', name: 'المواهب الرياضية' }
        ]
    };
    
    const categories = subCategories[category] || [];
    
    // Clear existing sub-categories
    subCategoryGrid.innerHTML = '';
    
    // Add new sub-categories
    categories.forEach(subCat => {
        const subCategoryItem = document.createElement('div');
        subCategoryItem.className = 'sub-category-item';
        subCategoryItem.setAttribute('data-category', subCat.id);
        subCategoryItem.textContent = subCat.name;
        
        subCategoryItem.addEventListener('click', function() {
            // Remove previous selection
            subCategoryGrid.querySelectorAll('.sub-category-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Add selection to clicked item
            this.classList.add('selected');
            
            // Store selection
            storeSubCategorySelection(subCat.id, subCat.name);
        });
        
        subCategoryGrid.appendChild(subCategoryItem);
    });
    
    // Show sub-category selection
    subCategorySelection.style.display = 'block';
}

function storeSubCategorySelection(id, name) {
    // Store in form data
    const formData = getFormData();
    formData.subCategory = { id, name };
    setFormData(formData);
}

function togglePrizeFields(prizeType) {
    // Show/hide prize-related fields based on selection
    // This would hide/show additional prize configuration fields
    console.log('Prize type changed to:', prizeType);
}

function toggleScheduleFields(scheduleType) {
    const scheduledOptions = document.getElementById('scheduledOptions');
    const invitationOptions = document.getElementById('invitationOptions');
    
    // Show/hide scheduled options
    if (scheduleType === 'scheduled') {
        scheduledOptions.classList.remove('hidden');
    } else {
        scheduledOptions.classList.add('hidden');
    }
    
    // Show/hide invitation options
    if (scheduleType === 'open') {
        invitationOptions.classList.add('hidden');
    } else {
        invitationOptions.classList.remove('hidden');
    }
}

function updateInvitationOptions() {
    // Update invitation options based on selected methods
    const selectedMethods = Array.from(document.querySelectorAll('input[name="inviteMethods"]:checked'))
        .map(cb => cb.value);
    
    console.log('Selected invite methods:', selectedMethods);
}

// =========================================
// FORM INTERACTIONS
// =========================================

function initializeFormInteractions() {
    // Character counters
    initializeCharacterCounters();
    
    // Auto-save functionality
    initializeAutoSave();
    
    // Form reset
    initializeFormReset();
    
    // Tag suggestions
    initializeTagSuggestions();
}

function initializeCharacterCounters() {
    const textFields = [
        { id: 'challengeTitle', max: 100 },
        { id: 'challengeDescription', max: 500 },
        { id: 'challengeRules', max: 300 }
    ];
    
    textFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            const counter = document.createElement('span');
            counter.className = 'char-count';
            counter.textContent = `0/${field.max}`;
            
            // Position counter
            const formGroup = element.closest('.form-group');
            const existingCounter = formGroup.querySelector('.char-count');
            if (!existingCounter) {
                formGroup.appendChild(counter);
            }
            
            // Update counter on input
            element.addEventListener('input', function() {
                const currentLength = this.value.length;
                counter.textContent = `${currentLength}/${field.max}`;
                
                // Color coding
                if (currentLength > field.max * 0.9) {
                    counter.style.color = '#FF6B6B';
                } else if (currentLength > field.max * 0.7) {
                    counter.style.color = '#FFA500';
                } else {
                    counter.style.color = '#B0B0B0';
                }
            });
        }
    });
}

function initializeAutoSave() {
    // Auto-save form data every 10 seconds
    setInterval(() => {
        saveFormData();
    }, 10000);
    
    // Save on form changes
    const form = document.getElementById('createForm');
    if (form) {
        form.addEventListener('input', debounce(() => {
            saveFormData();
        }, 2000));
    }
}

function initializeFormReset() {
    // Reset button functionality
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-outline';
    resetBtn.textContent = 'مسح النموذج';
    resetBtn.type = 'button';
    resetBtn.style.position = 'absolute';
    resetBtn.style.top = '1rem';
    resetBtn.style.right = '1rem';
    resetBtn.addEventListener('click', resetForm);
    
    const formHeader = document.querySelector('.form-header-section');
    if (formHeader) {
        formHeader.appendChild(resetBtn);
    }
}

function resetForm() {
    if (confirm('هل أنت متأكد من مسح النموذج؟ سيتم فقدان جميع البيانات المدخلة.')) {
        const form = document.getElementById('createForm');
        if (form) {
            form.reset();
        }
        
        // Reset to first step
        goToStep(1);
        
        // Clear saved data
        localStorage.removeItem('createChallengeFormData');
        
        showNotification('تم مسح النموذج', 'info');
    }
}

function initializeTagSuggestions() {
    const tagInput = document.getElementById('challengeTags');
    const suggestedTags = document.querySelectorAll('.suggested-tag');
    
    suggestedTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const tagText = this.getAttribute('data-tag');
            addTag(tagInput, tagText);
        });
    });
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
// PROGRESS TRACKING
// =========================================

function initializeProgressTracking() {
    // Track form completion progress
    updateFormProgress();
    
    // Update progress on form changes
    const form = document.querySelector('.challenge-form');
    if (form) {
        form.addEventListener('input', debounce(updateFormProgress, 500));
    }
}

function updateFormProgress() {
    // Calculate completion percentage
    const form = document.querySelector('.challenge-form');
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
    const completedFields = Array.from(requiredFields).filter(field => field.value.trim() !== '');
    
    const progress = (completedFields.length / requiredFields.length) * 100;
    
    // Update progress indicator
    const progressIndicator = document.querySelector('.form-progress');
    if (progressIndicator) {
        progressIndicator.style.width = `${progress}%`;
    }
}

// =========================================
// DATA PERSISTENCE
// =========================================

function saveFormData() {
    const formData = getFormData();
    
    // Save to localStorage
    localStorage.setItem('createChallengeFormData', JSON.stringify(formData));
    
    console.log('Form data saved');
}

function loadSavedFormData() {
    const savedData = localStorage.getItem('createChallengeFormData');
    
    if (savedData) {
        try {
            const formData = JSON.parse(savedData);
            populateFormData(formData);
            console.log('Form data loaded');
        } catch (e) {
            console.error('Error loading saved form data:', e);
        }
    }
}

function getFormData() {
    const form = document.getElementById('createForm') || document;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Add additional form state
    data.currentStep = currentStep;
    
    return data;
}

function populateFormData(data) {
    // Populate form fields
    Object.keys(data).forEach(key => {
        const field = document.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'radio' || field.type === 'checkbox') {
                const targetField = document.querySelector(`[name="${key}"][value="${data[key]}"]`);
                if (targetField) {
                    targetField.checked = true;
                }
            } else {
                field.value = data[key];
            }
        }
    });
    
    // Restore current step
    if (data.currentStep) {
        goToStep(data.currentStep);
    }
    
    // Load sub-categories if category is set
    if (data.category) {
        loadSubCategories(data.category);
    }
}

// =========================================
// CHALLENGE CREATION
// =========================================

function handleCreateChallenge() {
    if (!validateCurrentStep()) {
        return;
    }
    
    const createBtn = document.getElementById('createChallenge');
    showLoading(createBtn);
    
    // Collect final form data
    const formData = getFormData();
    
    // Validate all steps one final time
    if (!validateAllSteps(formData)) {
        hideLoading(createBtn);
        return;
    }
    
    // Simulate API call to create challenge
    setTimeout(() => {
        const challengeId = createChallenge(formData);
        
        hideLoading(createBtn);
        
        if (challengeId) {
            showNotification('تم إنشاء المنافسة بنجاح!', 'success');
            
            // Clear saved form data
            localStorage.removeItem('createChallengeFormData');
            
            // Redirect to challenge room or dashboard
            setTimeout(() => {
                window.location.href = `challenge-room.html?id=${challengeId}`;
            }, 2000);
        } else {
            showNotification('حدث خطأ أثناء إنشاء المنافسة', 'error');
        }
    }, 3000);
}

function validateAllSteps(formData) {
    for (let step = 1; step <= totalSteps; step++) {
        goToStep(step);
        if (!validateCurrentStep()) {
            goToStep(currentStep); // Return to current step
            return false;
        }
    }
    
    goToStep(currentStep); // Return to original step
    return true;
}

function createChallenge(formData) {
    // Simulate challenge creation
    console.log('Creating challenge with data:', formData);
    
    // Generate challenge ID
    const challengeId = 'challenge_' + Date.now();
    
    // Store in localStorage for demo purposes
    const challenges = JSON.parse(localStorage.getItem('userChallenges') || '[]');
    challenges.push({
        id: challengeId,
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'created'
    });
    localStorage.setItem('userChallenges', JSON.stringify(challenges));
    
    return challengeId;
}

// =========================================
// UTILITY FUNCTIONS
// =========================================

function showLoading(button) {
    button.classList.add('loading');
    button.disabled = true;
    button.textContent = 'جاري الإنشاء...';
}

function hideLoading(button) {
    button.classList.remove('loading');
    button.disabled = false;
    button.textContent = 'إنشاء وتشغيل المنافسة';
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
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.95)',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        borderLeft: `4px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#FF6B6B' : type === 'warning' ? '#FFA500' : '#0A84FF'}`,
        zIndex: '1000',
        maxWidth: '350px',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    });
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #B0B0B0;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
        margin-left: 1rem;
    `;
    
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

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =========================================
// KEYBOARD SHORTCUTS
// =========================================

document.addEventListener('keydown', function(e) {
    // Ctrl+Enter to go to next step
    if (e.ctrlKey && e.key === 'Enter') {
        if (currentStep < totalSteps) {
            e.preventDefault();
            goToNextStep();
        } else {
            e.preventDefault();
            handleCreateChallenge();
        }
    }
    
    // Ctrl+ArrowLeft to go to previous step
    if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousStep();
    }
    
    // Ctrl+ArrowRight to go to next step
    if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextStep();
    }
    
    // Escape to reset form
    if (e.key === 'Escape' && e.ctrlKey) {
        e.preventDefault();
        resetForm();
    }
});

// =========================================
// ACCESSIBILITY ENHANCEMENTS
// =========================================

// Add ARIA labels for better screen reader support
function enhanceAccessibility() {
    // Step indicators
    const stepIndicators = document.querySelectorAll('.step');
    stepIndicators.forEach((step, index) => {
        const stepNumber = index + 1;
        step.setAttribute('aria-label', `الخطوة ${stepNumber} من ${totalSteps}`);
        step.setAttribute('role', 'button');
        step.setAttribute('tabindex', stepNumber <= currentStep ? '0' : '-1');
    });
    
    // Form fields
    const formFields = document.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        if (!field.getAttribute('aria-label') && !field.getAttribute('aria-labelledby')) {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) {
                field.setAttribute('aria-labelledby', label.id || `label-${field.id}`);
            }
        }
    });
    
    // Progress indicator
    const progressContainer = document.querySelector('.progress-steps');
    if (progressContainer) {
        progressContainer.setAttribute('role', 'progressbar');
        progressContainer.setAttribute('aria-valuemin', '0');
        progressContainer.setAttribute('aria-valuemax', totalSteps.toString());
        progressContainer.setAttribute('aria-valuenow', currentStep.toString());
    }
}

// Initialize accessibility enhancements
enhanceAccessibility();