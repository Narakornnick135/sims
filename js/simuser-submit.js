// submit.js - Submit Proposal Page Script (IIFE Version)

(function(global) {
  'use strict';
  
  // Get all dependencies from global namespace
  const SimUser = global.SimUser;
  const CONFIG = SimUser.CONFIG;
  const ROUTES = SimUser.ROUTES;
  const UPLOAD = SimUser.UPLOAD;
  const INNOVATION_TYPES = SimUser.INNOVATION_TYPES;
  const PROVINCES = SimUser.PROVINCES;
  const auth = SimUser.auth;
  const api = SimUser.api;
  const ui = SimUser.ui;
  const upload = SimUser.upload;
  const utils = SimUser.utils;
  
  // SubmitProposal Class
  function SubmitProposal() {
    this.formData = {};
    this.currentStep = 1;
    this.totalSteps = 4;
    this.isDraft = false;
  }

  /**
   * Initialize submit proposal page
   */
  SubmitProposal.prototype.initialize = function() {
    const self = this;
    
    ui.showLoading('กำลังเตรียมแบบฟอร์ม...');
    
    // Initialize UI
    ui.initialize();
    
    // Check authentication
    auth.initialize()
      .then(function(isAuthenticated) {
        if (!isAuthenticated) {
          window.location.href = ROUTES.LOGIN;
          return Promise.reject('Not authenticated');
        }
        
        // Check if user already has a proposal
        if (auth.hasProposal()) {
          return ui.showConfirm(
            'มีข้อเสนอโครงการอยู่แล้ว',
            'คุณมีข้อเสนอโครงการอยู่แล้ว ต้องการดูสถานะโครงการหรือไม่?',
            { confirmText: 'ดูสถานะโครงการ', cancelText: 'ส่งข้อเสนอใหม่' }
          );
        }
        
        return false;
      })
      .then(function(shouldRedirect) {
        if (shouldRedirect) {
          window.location.href = ROUTES.HOME;
          return;
        }
        
        // Initialize form
        self.initializeForm();
        
        // Load draft if exists
        self.loadDraft();
        
        // Setup event listeners
        self.setupEventListeners();
        
        // Initialize file uploads
        self.initializeFileUploads();
        
        ui.hideLoading();
      })
      .catch(function(error) {
        if (error === 'Not authenticated') {
          return; // Expected redirect
        }
        console.error('Submit page initialization error:', error);
        ui.showAlert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถโหลดแบบฟอร์มได้', 'danger');
        ui.hideLoading();
      });
  };

  /**
   * Initialize form elements
   */
  SubmitProposal.prototype.initializeForm = function() {
    // Populate innovation types
    const innovationSelect = document.getElementById('innovationType');
    if (innovationSelect) {
      INNOVATION_TYPES.forEach(function(type) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        innovationSelect.appendChild(option);
      });
    }
    
    // Populate provinces
    const provinceSelect = document.getElementById('province');
    if (provinceSelect) {
      PROVINCES.forEach(function(province) {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        provinceSelect.appendChild(option);
      });
    }
    
    // Initialize date pickers
    this.initializeDatePickers();
  };

  /**
   * Initialize date pickers
   */
  SubmitProposal.prototype.initializeDatePickers = function() {
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('projectStartDate');
    const endDateInput = document.getElementById('projectEndDate');
    
    if (startDateInput) {
      startDateInput.min = today;
      startDateInput.addEventListener('change', function() {
        if (endDateInput) {
          endDateInput.min = startDateInput.value;
        }
      });
    }
  };

  /**
   * Initialize file uploads
   */
  SubmitProposal.prototype.initializeFileUploads = function() {
    const self = this;
    
    // Word file upload
    upload.initializeUpload('wordFile', {
      type: 'proposal',
      allowedExtensions: UPLOAD.ALLOWED_EXTENSIONS.PROPOSAL,
      allowedMimeTypes: UPLOAD.ALLOWED_MIME_TYPES.PROPOSAL,
      container: 'wordFileContainer',
      onSelect: function(file) {
        self.updateFileStatus('word', file);
      }
    });
    
    // PDF file upload
    upload.initializeUpload('pdfFile', {
      type: 'proposal',
      allowedExtensions: ['.pdf'],
      allowedMimeTypes: ['application/pdf'],
      container: 'pdfFileContainer',
      onSelect: function(file) {
        self.updateFileStatus('pdf', file);
      }
    });
    
    // Business file upload
    upload.initializeUpload('businessFile', {
      type: 'business',
      allowedExtensions: UPLOAD.ALLOWED_EXTENSIONS.BUSINESS,
      allowedMimeTypes: UPLOAD.ALLOWED_MIME_TYPES.BUSINESS,
      container: 'businessFileContainer',
      onSelect: function(file) {
        self.updateFileStatus('business', file);
      }
    });
  };

  /**
   * Setup event listeners
   */
  SubmitProposal.prototype.setupEventListeners = function() {
    const self = this;
    
    // Form navigation
    this.addClickListener('nextBtn', function() { self.nextStep(); });
    this.addClickListener('prevBtn', function() { self.previousStep(); });
    this.addClickListener('submitBtn', function() { self.submitProposal(); });
    
    // Save draft
    this.addClickListener('saveDraftBtn', function() { self.saveDraft(); });
    
    // Form validation on input
    this.setupFormValidation();
    
    // Budget calculation
    this.setupBudgetCalculation();
    
    // Auto-save draft
    this.setupAutoSave();
  };

  /**
   * Setup form validation
   */
  SubmitProposal.prototype.setupFormValidation = function() {
    const self = this;
    
    // Project title validation
    const titleInput = document.getElementById('projectTitle');
    if (titleInput) {
      titleInput.addEventListener('input', function() {
        const isValid = titleInput.value.length >= 10;
        self.setFieldValidity(titleInput, isValid, 'ชื่อโครงการต้องมีอย่างน้อย 10 ตัวอักษร');
      });
    }
    
    // Email validation
    const emailInput = document.getElementById('contactEmail');
    if (emailInput) {
      emailInput.addEventListener('input', function() {
        const isValid = utils.isValidEmail(emailInput.value);
        self.setFieldValidity(emailInput, isValid, 'รูปแบบอีเมลไม่ถูกต้อง');
      });
    }
    
    // Phone validation
    const phoneInput = document.getElementById('contactPhone');
    if (phoneInput) {
      phoneInput.addEventListener('input', function() {
        const isValid = utils.isValidPhone(phoneInput.value);
        self.setFieldValidity(phoneInput, isValid, 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
      });
    }
  };

  /**
   * Setup budget calculation
   */
  SubmitProposal.prototype.setupBudgetCalculation = function() {
    const budgetInput = document.getElementById('budgetRequested');
    if (budgetInput) {
      budgetInput.addEventListener('input', function() {
        const value = parseFloat(budgetInput.value) || 0;
        const maxBudget = 500000;
        
        if (value > maxBudget) {
          ui.showAlert('งบประมาณเกิน', 'งบประมาณรวมต้องไม่เกิน ' + utils.formatCurrency(maxBudget), 'warning');
          budgetInput.value = maxBudget;
        }
      });
    }
  };

  /**
   * Setup auto-save draft
   */
  SubmitProposal.prototype.setupAutoSave = function() {
    const self = this;
    let autoSaveTimer;
    
    // Listen to all form inputs
    const form = document.getElementById('proposalForm');
    if (form) {
      form.addEventListener('input', function() {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(function() {
          self.saveDraft(true); // Silent save
        }, 30000); // Auto-save every 30 seconds
      });
    }
  };

  /**
   * Go to next step
   */
  SubmitProposal.prototype.nextStep = function() {
    if (!this.validateCurrentStep()) {
      return;
    }
    
    this.collectStepData();
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateStepDisplay();
      
      // If moving to review step, generate review content
      if (this.currentStep === 4) {
        this.generateReviewContent();
      }
    }
  };

  /**
   * Go to previous step
   */
  SubmitProposal.prototype.previousStep = function() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepDisplay();
    }
  };

  /**
   * Update step display
   */
  SubmitProposal.prototype.updateStepDisplay = function() {
    const self = this;
    
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(function(step) {
      step.style.display = 'none';
    });
    
    // Show current step
    const currentStepElement = document.getElementById('step' + self.currentStep);
    if (currentStepElement) {
      currentStepElement.style.display = 'block';
    }
    
    // Update progress bar
    const progress = (this.currentStep / this.totalSteps) * 100;
    const progressBar = document.getElementById('formProgress');
    if (progressBar) {
      progressBar.style.width = progress + '%';
    }
    
    // Update step indicator
    this.updateStepIndicator();
    
    // Update buttons
    this.updateNavigationButtons();
  };

  /**
   * Update step indicator
   */
  SubmitProposal.prototype.updateStepIndicator = function() {
    const self = this;
    
    document.querySelectorAll('.step-indicator').forEach(function(indicator, index) {
      if (index < self.currentStep - 1) {
        indicator.classList.add('completed');
        indicator.classList.remove('active');
      } else if (index === self.currentStep - 1) {
        indicator.classList.add('active');
        indicator.classList.remove('completed');
      } else {
        indicator.classList.remove('active', 'completed');
      }
    });
  };

  /**
   * Update navigation buttons
   */
  SubmitProposal.prototype.updateNavigationButtons = function() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) {
      prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-block';
    }
    
    if (nextBtn && submitBtn) {
      if (this.currentStep === this.totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
      } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
      }
    }
  };

  /**
   * Validate current step
   */
  SubmitProposal.prototype.validateCurrentStep = function() {
    const currentStepElement = document.getElementById('step' + this.currentStep);
    if (!currentStepElement) return true;
    
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(function(field) {
      if (!field.value || field.value.trim() === '') {
        isValid = false;
        field.classList.add('is-invalid');
      } else {
        field.classList.remove('is-invalid');
      }
    });
    
    if (!isValid) {
      ui.showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
    }
    
    return isValid;
  };

  /**
   * Collect step data
   */
  SubmitProposal.prototype.collectStepData = function() {
    const self = this;
    const currentStepElement = document.getElementById('step' + this.currentStep);
    if (!currentStepElement) return;
    
    const inputs = currentStepElement.querySelectorAll('input, select, textarea');
    inputs.forEach(function(input) {
      if (input.name) {
        if (input.type === 'checkbox') {
          self.formData[input.name] = input.checked;
        } else if (input.type === 'radio') {
          if (input.checked) {
            self.formData[input.name] = input.value;
          }
        } else {
          self.formData[input.name] = input.value;
        }
      }
    });
  };

  /**
   * Generate review content
   */
  SubmitProposal.prototype.generateReviewContent = function() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;
    
    // Collect all data first
    this.collectAllData();
    
    // Generate HTML
    let html = '';
    
    // General Information
    html += '<h5><i class="fas fa-info-circle me-2"></i>ข้อมูลทั่วไป</h5>';
    html += '<div class="review-item"><span class="review-label">ชื่อโครงการ:</span> ' + (this.formData.projectTitle || '-') + '</div>';
    html += '<div class="review-item"><span class="review-label">ประเภทนวัตกรรม:</span> ' + (this.formData.innovationType || '-') + '</div>';
    html += '<div class="review-item"><span class="review-label">จังหวัด:</span> ' + (this.formData.province || '-') + '</div>';
    html += '<div class="review-item"><span class="review-label">องค์กร:</span> ' + (this.formData.organizationName || '-') + '</div>';
    html += '<div class="review-item"><span class="review-label">ผู้ติดต่อ:</span> ' + (this.formData.contactName || '-') + '</div>';
    html += '<div class="review-item"><span class="review-label">อีเมล:</span> ' + (this.formData.contactEmail || '-') + '</div>';
    html += '<div class="review-item"><span class="review-label">โทรศัพท์:</span> ' + (this.formData.contactPhone || '-') + '</div>';
    
    // Project Details
    html += '<h5><i class="fas fa-file-alt me-2"></i>รายละเอียดโครงการ</h5>';
    html += '<div class="review-item"><span class="review-label">ระยะเวลา:</span> ' + 
            utils.formatDate(this.formData.projectStartDate) + ' ถึง ' + 
            utils.formatDate(this.formData.projectEndDate) + '</div>';
    html += '<div class="review-item"><span class="review-label">งบประมาณ:</span> ' + 
            utils.formatCurrency(this.formData.budgetRequested || 0) + '</div>';
    html += '<div class="review-item"><span class="review-label">ผู้ได้รับประโยชน์:</span> ' + 
            utils.formatNumber(this.formData.beneficiaries || 0) + ' คน</div>';
    
    // Files
    html += '<h5><i class="fas fa-upload me-2"></i>เอกสารที่แนบ</h5>';
    html += '<div class="review-item"><span class="review-label">ข้อเสนอโครงการ (Word):</span> ' + 
            (upload.hasFile('wordFile') ? 'อัปโหลดแล้ว' : 'ยังไม่ได้อัปโหลด') + '</div>';
    html += '<div class="review-item"><span class="review-label">ข้อเสนอโครงการ (PDF):</span> ' + 
            (upload.hasFile('pdfFile') ? 'อัปโหลดแล้ว' : 'ยังไม่ได้อัปโหลด') + '</div>';
    html += '<div class="review-item"><span class="review-label">หลักฐานประกอบกิจการ:</span> ' + 
            (upload.hasFile('businessFile') ? 'อัปโหลดแล้ว' : 'ไม่มี') + '</div>';
    
    reviewContent.innerHTML = html;
  };

  /**
   * Submit proposal
   */
  SubmitProposal.prototype.submitProposal = function() {
    const self = this;
    
    // Validate all steps
    if (!this.validateAllSteps()) {
      return;
    }
    
    // Check confirmation
    const confirmCheckbox = document.getElementById('confirmAccuracy');
    if (!confirmCheckbox || !confirmCheckbox.checked) {
      ui.showAlert('ยังไม่ได้ยืนยัน', 'กรุณายืนยันความถูกต้องของข้อมูล', 'warning');
      return;
    }
    
    // Confirm submission
    ui.showConfirm(
      'ยืนยันการส่งข้อเสนอ',
      'คุณต้องการส่งข้อเสนอโครงการหรือไม่? เมื่อส่งแล้วจะไม่สามารถแก้ไขได้',
      { confirmText: 'ส่งข้อเสนอ', type: 'primary' }
    ).then(function(confirmed) {
      if (!confirmed) return;
      
      ui.showLoading('กำลังส่งข้อเสนอโครงการ...');
      
      // Collect all form data
      self.collectAllData();
      
      // Create FormData
      const formData = new FormData();
      
      // Add form fields
      Object.keys(self.formData).forEach(function(key) {
        formData.append(key, self.formData[key]);
      });
      
      // Add files
      const wordFile = upload.getSelectedFile('wordFile');
      const pdfFile = upload.getSelectedFile('pdfFile');
      const businessFile = upload.getSelectedFile('businessFile');
      
      if (wordFile) formData.append('wordFile', wordFile);
      if (pdfFile) formData.append('pdfFile', pdfFile);
      if (businessFile) formData.append('businessFile', businessFile);
      
      // Submit to API
      api.submitProposal(formData)
        .then(function(response) {
          if (response.success) {
            // Clear draft
            self.clearDraft();
            
            // Update user data
            auth.updateUserData({ proposals: response.proposal });
            
            ui.showAlert(
              'ส่งข้อเสนอสำเร็จ',
              'ข้อเสนอโครงการของคุณได้รับการบันทึกเรียบร้อยแล้ว',
              'success'
            );
            
            // Redirect to dashboard
            setTimeout(function() {
              window.location.href = ROUTES.HOME;
            }, 2000);
          } else {
            throw new Error(response.message || 'ไม่สามารถส่งข้อเสนอได้');
          }
        })
        .catch(function(error) {
          console.error('Submit error:', error);
          ui.showAlert('เกิดข้อผิดพลาด', error.message, 'danger');
        })
        .finally(function() {
          ui.hideLoading();
        });
    });
  };

  /**
   * Validate all steps
   */
  SubmitProposal.prototype.validateAllSteps = function() {
    // Check required files
    if (!upload.hasFile('wordFile')) {
      ui.showAlert('ไฟล์ไม่ครบ', 'กรุณาอัปโหลดไฟล์ข้อเสนอโครงการ (Word)', 'warning');
      this.goToStep(3); // Go to file upload step
      return false;
    }
    
    if (!upload.hasFile('pdfFile')) {
      ui.showAlert('ไฟล์ไม่ครบ', 'กรุณาอัปโหลดไฟล์ข้อเสนอโครงการ (PDF)', 'warning');
      this.goToStep(3); // Go to file upload step
      return false;
    }
    
    return true;
  };

  /**
   * Collect all form data
   */
  SubmitProposal.prototype.collectAllData = function() {
    for (let i = 1; i <= this.totalSteps; i++) {
      this.currentStep = i;
      this.collectStepData();
    }
  };

  /**
   * Go to specific step
   */
  SubmitProposal.prototype.goToStep = function(step) {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      this.updateStepDisplay();
    }
  };

  /**
   * Save draft
   */
  SubmitProposal.prototype.saveDraft = function(silent) {
    silent = silent || false;
    
    try {
      this.collectAllData();
      utils.storage.set('draftProposal', {
        data: this.formData,
        savedAt: new Date().toISOString(),
        currentStep: this.currentStep
      });
      
      if (!silent) {
        ui.showToast('แบบร่างถูกบันทึกแล้ว', 'success');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (!silent) {
        ui.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกแบบร่างได้', 'danger');
      }
    }
  };

  /**
   * Load draft
   */
  SubmitProposal.prototype.loadDraft = function() {
    const draft = utils.storage.get('draftProposal');
    if (draft && draft.data) {
      this.formData = draft.data;
      this.currentStep = draft.currentStep || 1;
      
      // Populate form with draft data
      this.populateForm();
      
      // Update display
      this.updateStepDisplay();
      
      ui.showToast('โหลดแบบร่างเรียบร้อยแล้ว', 'info');
    }
  };

  /**
   * Clear draft
   */
  SubmitProposal.prototype.clearDraft = function() {
    utils.storage.remove('draftProposal');
  };

  /**
   * Populate form with data
   */
  SubmitProposal.prototype.populateForm = function() {
    const self = this;
    
    Object.keys(this.formData).forEach(function(key) {
      const element = document.querySelector('[name="' + key + '"]');
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = self.formData[key];
        } else if (element.type === 'radio') {
          const radio = document.querySelector('[name="' + key + '"][value="' + self.formData[key] + '"]');
          if (radio) radio.checked = true;
        } else {
          element.value = self.formData[key];
        }
      }
    });
  };

  /**
   * Update file status display
   */
  SubmitProposal.prototype.updateFileStatus = function(type, file) {
    const statusElement = document.getElementById(type + 'FileStatus');
    if (statusElement) {
      statusElement.innerHTML = '\
        <i class="fas fa-check-circle text-success"></i> \
        ' + file.name + ' (' + utils.formatFileSize(file.size) + ')\
      ';
    }
  };

  /**
   * Set field validity
   */
  SubmitProposal.prototype.setFieldValidity = function(field, isValid, message) {
    if (isValid) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
    } else {
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');
      
      const feedback = field.nextElementSibling;
      if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = message;
      }
    }
  };

  /**
   * Helper function to add click listener
   */
  SubmitProposal.prototype.addClickListener = function(elementId, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener('click', handler);
    }
  };

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const submitProposal = new SubmitProposal();
    submitProposal.initialize();
    
    // Make available globally for debugging
    global.submitProposal = submitProposal;
  });
  
})(window);