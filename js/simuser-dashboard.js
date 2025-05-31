// dashboard.js - Main Dashboard Script (IIFE Version)

(function(global) {
  'use strict';
  
  // Get all dependencies from global namespace
  const SimUser = global.SimUser;
  const CONFIG = SimUser.CONFIG;
  const ROUTES = SimUser.ROUTES;
  const UPLOAD = SimUser.UPLOAD;
  const auth = SimUser.auth;
  const api = SimUser.api;
  const ui = SimUser.ui;
  const status = SimUser.status;
  const timeline = SimUser.timeline;
  const notifications = SimUser.notifications;
  const documents = SimUser.documents;
  const upload = SimUser.upload;
  const utils = SimUser.utils;
  
  // Dashboard Class
  function Dashboard() {
    this.proposalData = null;
    this.currentStatus = null;
  }

  /**
   * Initialize dashboard
   */
  Dashboard.prototype.initialize = function() {
    const self = this;
    
    // Show loading
    ui.showLoading('กำลังโหลดข้อมูล...');
    
    // Initialize UI components
    ui.initialize();
    
    // Check authentication
    auth.initialize()
      .then(function(isAuthenticated) {
        if (!isAuthenticated) {
          window.location.href = ROUTES.LOGIN;
          return Promise.reject('Not authenticated');
        }
        
        // Check if user is admin
        if (auth.isAdmin()) {
          window.location.href = ROUTES.ADMIN;
          return Promise.reject('User is admin');
        }
        
        // Check if user has proposal
        if (!auth.hasProposal()) {
          ui.showAlert(
            'ไม่พบข้อเสนอโครงการ',
            'กรุณาส่งข้อเสนอโครงการก่อน',
            'warning'
          );
          setTimeout(function() {
            window.location.href = ROUTES.SUBMIT;
          }, 2000);
          return Promise.reject('No proposal');
        }
        
        // Load proposal data
        return self.loadProposalData();
      })
      .then(function() {
        // Initialize components
        self.initializeComponents();
        
        // Setup event listeners
        self.setupEventListeners();
        
        // Hide loading
        ui.hideLoading();
      })
      .catch(function(error) {
        if (error && typeof error === 'string' && 
            (error === 'Not authenticated' || error === 'User is admin' || error === 'No proposal')) {
          // Expected redirects, don't show error
          return;
        }
        console.error('Dashboard initialization error:', error);
        ui.showAlert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถโหลดข้อมูลได้', 'danger');
        ui.hideLoading();
      });
  };

  /**
   * Load proposal data
   */
  Dashboard.prototype.loadProposalData = function() {
    const self = this;
    
    return api.getProposalData()
      .then(function(response) {
        if (!response.success) {
          throw new Error(response.message || 'ไม่สามารถดึงข้อมูลโครงการได้');
        }
        
        self.proposalData = response;
        self.currentStatus = response.proposal.status;
        
        // Update UI with proposal data
        self.updateProposalInfo();
        self.updateDashboardStats();
        
        // Update components
        status.updateStatusTracker(self.currentStatus);
        timeline.renderTimeline(response.statusHistory);
        notifications.renderNotifications(response.notifications);
        documents.initialize(response);
        
        // Toggle sections based on status
        status.toggleSectionsByStatus(self.currentStatus, response);
      });
  };

  /**
   * Initialize components
   */
  Dashboard.prototype.initializeComponents = function() {
    // Initialize timeline
    timeline.initialize();
    
    // Initialize notifications
    notifications.initialize();
    
    // Initialize file upload if status is preparing
    if (status.canUploadPresentation(this.currentStatus)) {
      this.initializeFileUpload();
    }
  };

  /**
   * Initialize file upload
   */
  Dashboard.prototype.initializeFileUpload = function() {
    upload.initializeUpload('presentationFile', {
      type: 'presentation',
      allowedExtensions: UPLOAD.ALLOWED_EXTENSIONS.PRESENTATION,
      allowedMimeTypes: UPLOAD.ALLOWED_MIME_TYPES.PRESENTATION,
      container: 'presentationContainer',
      onSelect: function(file) {
        const submitBtn = document.getElementById('submitPresentation');
        if (submitBtn) {
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> ส่งเอกสารนำเสนอ (' + file.name + ')';
        }
      }
    });
  };

  /**
   * Update proposal information
   */
  Dashboard.prototype.updateProposalInfo = function() {
    const proposal = this.proposalData.proposal;
    
    // Update basic info
    this.updateElementText('referenceNumber', proposal.proposals_id);
    this.updateElementText('projectTitle', proposal.project_title);
    this.updateElementText('innovationType', proposal.innovation_type);
    this.updateElementText('projectProvince', proposal.province);
    this.updateElementText('requestedBudget', 
      proposal.budget_requested ? utils.formatCurrency(proposal.budget_requested, false) : '-'
    );
    this.updateElementText('beneficiaries', 
      proposal.beneficiaries ? utils.formatNumber(proposal.beneficiaries) + ' คน' : '-'
    );
  };

  /**
   * Update dashboard statistics
   */
  Dashboard.prototype.updateDashboardStats = function() {
    const proposal = this.proposalData.proposal;
    
    // Update submission date
    const submissionDate = proposal.created_at ? new Date(proposal.created_at) : null;
    this.updateElementText('submissionDate', 
      submissionDate ? utils.formatDate(submissionDate) : '-'
    );
    
    // Update project duration
    const duration = utils.calculateDuration(submissionDate);
    this.updateElementText('projectDuration', duration);
    
    // Update next step
    this.updateNextStep();
  };

  /**
   * Update next step
   */
  Dashboard.prototype.updateNextStep = function() {
    const nextSteps = {
      'waiting': 'รอการตรวจรับโดยเจ้าหน้าที่',
      'reviewing': 'รอการรับรองให้นำเสนอผลงาน',
      'preparing': 'อัปโหลดเอกสารนำเสนอ',
      'approved': 'ติดต่อเจ้าหน้าที่เพื่อทำสัญญา',
      'rejected': 'ปรับปรุงโครงการตามข้อเสนอแนะ'
    };
    
    this.updateElementText('nextStep', 
      nextSteps[this.currentStatus] || 'ติดต่อเจ้าหน้าที่'
    );
    
    // Update badge style
    const badge = document.getElementById('nextStepBadge');
    if (badge && this.currentStatus === 'rejected') {
      badge.classList.remove('badge-glow');
    }
  };

  /**
   * Setup event listeners
   */
  Dashboard.prototype.setupEventListeners = function() {
    const self = this;
    
    // FAQ button
    this.addClickListener('faqBtn', function() { self.showFAQModal(); });
    
    // Contact staff button
    this.addClickListener('contactStaffBtn', function() { self.showContactModal(); });
    
    // Send contact message
    this.addClickListener('sendContactBtn', function() { self.sendContactMessage(); });
    
    // Submit presentation
    this.addClickListener('submitPresentation', function() { self.submitPresentation(); });
    
    // Download buttons are handled by documents module
  };

  /**
   * Show FAQ modal
   */
  Dashboard.prototype.showFAQModal = function() {
    const faqModal = document.getElementById('faqModal');
    if (faqModal && typeof bootstrap !== 'undefined') {
      const modal = new bootstrap.Modal(faqModal);
      modal.show();
    }
  };

  /**
   * Show contact modal
   */
  Dashboard.prototype.showContactModal = function() {
    const contactModal = document.getElementById('contactStaffModal');
    if (contactModal && typeof bootstrap !== 'undefined') {
      const modal = new bootstrap.Modal(contactModal);
      modal.show();
    }
  };

  /**
   * Send contact message
   */
  Dashboard.prototype.sendContactMessage = function() {
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;
    
    if (!subject || !message) {
      ui.showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกหัวข้อและข้อความ', 'warning');
      return;
    }
    
    ui.setButtonLoading('sendContactBtn', true, 'กำลังส่ง...');
    
    api.sendMessageToStaff(subject, message)
      .then(function() {
        ui.showAlert('สำเร็จ', 'ส่งข้อความถึงเจ้าหน้าที่เรียบร้อยแล้ว', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('contactStaffModal'));
        if (modal) modal.hide();
        
        // Clear form
        document.getElementById('contactForm').reset();
      })
      .catch(function(error) {
        ui.showAlert('เกิดข้อผิดพลาด', error.message, 'danger');
      })
      .finally(function() {
        ui.setButtonLoading('sendContactBtn', false);
      });
  };

  /**
   * Submit presentation file
   */
  Dashboard.prototype.submitPresentation = function() {
    if (!upload.hasFile('presentationFile')) {
      ui.showAlert('ไม่พบไฟล์', 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด', 'warning');
      return;
    }
    
    const proposalId = this.proposalData.proposal.id;
    
    upload.uploadPresentationFile(proposalId)
      .then(function(response) {
        if (response.success) {
          // Reload page to show updated status
          setTimeout(function() {
            window.location.reload();
          }, 1500);
        }
      })
      .catch(function(error) {
        console.error('Upload error:', error);
      });
  };

  /**
   * Helper function to update element text
   */
  Dashboard.prototype.updateElementText = function(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text || '-';
    }
  };

  /**
   * Helper function to add click listener
   */
  Dashboard.prototype.addClickListener = function(elementId, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener('click', handler);
    }
  };

  /**
   * Refresh dashboard data
   */
  Dashboard.prototype.refresh = function() {
    const self = this;
    
    ui.showLoading('กำลังรีเฟรชข้อมูล...');
    
    this.loadProposalData()
      .then(function() {
        ui.showToast('รีเฟรชข้อมูลเรียบร้อยแล้ว', 'success');
      })
      .catch(function() {
        ui.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถรีเฟรชข้อมูลได้', 'danger');
      })
      .finally(function() {
        ui.hideLoading();
      });
  };

  // Initialize dashboard when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const dashboard = new Dashboard();
    dashboard.initialize();
    
    // Make dashboard available globally for debugging
    global.dashboard = dashboard;
  });
  
})(window);