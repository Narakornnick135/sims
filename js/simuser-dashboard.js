// dashboard.js - Main Dashboard Script (IIFE Version) - FIXED VERSION

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
    this.loadAttempts = 0;
    this.maxLoadAttempts = 3;
  }

  /**
   * Initialize dashboard
   */
  Dashboard.prototype.initialize = function() {
    const self = this;
    
    console.log('Dashboard: Starting initialization...');
    
    // Show loading
    ui.showLoading('กำลังโหลดข้อมูล...');
    
    // Initialize UI components
    ui.initialize();
    
    // Check authentication
    auth.initialize()
      .then(function(isAuthenticated) {
        console.log('Dashboard: Auth check result:', isAuthenticated);
        
        if (!isAuthenticated) {
          window.location.href = ROUTES.LOGIN;
          return Promise.reject('Not authenticated');
        }
        
        // Check if user is admin
        if (auth.isAdmin()) {
          window.location.href = ROUTES.ADMIN;
          return Promise.reject('User is admin');
        }
        
        // Log user data for debugging
        const userData = auth.getUserData();
        console.log('Dashboard: User data:', userData);
        
        // Check if user has proposal
        const hasProposal = auth.hasProposal();
        console.log('Dashboard: hasProposal check:', hasProposal);
        
        // ถ้า hasProposal return null หมายความว่าไม่มี cached data
        // ให้ไปเรียก API เพื่อตรวจสอบ
        if (hasProposal === null) {
          console.log('Dashboard: No cached proposal, will check via API');
          // Continue to load proposal data
        } else if (hasProposal === false) {
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
        console.log('Dashboard: Data loaded successfully');
        
        // Initialize components
        self.initializeComponents();
        
        // Setup event listeners
        self.setupEventListeners();
        
        // Hide loading
        ui.hideLoading();
        console.log('Dashboard: Initialization complete');
      })
      .catch(function(error) {
        console.error('Dashboard: Initialization error:', error);
        
        if (error && typeof error === 'string' && 
            (error === 'Not authenticated' || error === 'User is admin' || error === 'No proposal')) {
          // Expected redirects, don't show error
          return;
        }
        
        if (error && error.message === 'No proposal found') {
          // Already handled in loadProposalData
          return;
        }
        
        // Show error and hide loading
        ui.showAlert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถโหลดข้อมูลได้', 'danger');
        ui.hideLoading();
        
        // Add retry button
        self.showRetryButton();
      });
  };

  /**
   * Load proposal data with retry mechanism
   */
  Dashboard.prototype.loadProposalData = function() {
    const self = this;
    self.loadAttempts++;
    
    console.log('Dashboard: Loading proposal data (attempt ' + self.loadAttempts + ')...');
    
    return api.getProposalData()
      .then(function(response) {
        console.log('Dashboard: API response received:', response);
        
        if (!response) {
          throw new Error('ไม่ได้รับข้อมูลจาก server');
        }
        
        if (!response.success) {
          throw new Error(response.message || 'ไม่สามารถดึงข้อมูลโครงการได้');
        }
        
        // Validate response structure
        if (!response.proposal) {
          throw new Error('ข้อมูลโครงการไม่ถูกต้อง');
        }
        
        self.proposalData = response;
        self.currentStatus = response.proposal.status;
        
        // Cache proposal data
        localStorage.setItem('proposalData', JSON.stringify(response));
        
        console.log('Dashboard: Current status:', self.currentStatus);
        
        // Update UI with proposal data
        self.updateProposalInfo();
        self.updateDashboardStats();
        
        // Update components with error handling
        try {
          status.updateStatusTracker(self.currentStatus);
        } catch (e) {
          console.error('Dashboard: Error updating status tracker:', e);
        }
        
        try {
          timeline.renderTimeline(response.statusHistory);
        } catch (e) {
          console.error('Dashboard: Error rendering timeline:', e);
        }
        
        try {
          notifications.renderNotifications(response.notifications);
        } catch (e) {
          console.error('Dashboard: Error rendering notifications:', e);
        }
        
        try {
          documents.initialize(response);
        } catch (e) {
          console.error('Dashboard: Error initializing documents:', e);
        }
        
        // Toggle sections based on status
        try {
          status.toggleSectionsByStatus(self.currentStatus, response);
        } catch (e) {
          console.error('Dashboard: Error toggling sections:', e);
        }
        
        // Reset load attempts on success
        self.loadAttempts = 0;
      })
      .catch(function(error) {
        console.error('Dashboard: Error loading proposal data:', error);
        
        // ถ้าเป็น 404 หรือไม่พบข้อมูล proposal
        if (error.message && error.message.includes('ไม่พบข้อมูลโครงการ')) {
          ui.showAlert(
            'ไม่พบข้อเสนอโครงการ',
            'กรุณาส่งข้อเสนอโครงการก่อน',
            'warning'
          );
          setTimeout(function() {
            window.location.href = ROUTES.SUBMIT;
          }, 2000);
          throw new Error('No proposal found');
        }
        
        // Retry if attempts remaining
        if (self.loadAttempts < self.maxLoadAttempts) {
          console.log('Dashboard: Retrying in 2 seconds...');
          return new Promise(function(resolve, reject) {
            setTimeout(function() {
              self.loadProposalData()
                .then(resolve)
                .catch(reject);
            }, 2000);
          });
        }
        
        // Max attempts reached, throw error
        throw error;
      });
  };

  /**
   * Initialize components
   */
  Dashboard.prototype.initializeComponents = function() {
    console.log('Dashboard: Initializing components...');
    
    try {
      // Initialize timeline
      timeline.initialize();
      
      // Initialize notifications
      notifications.initialize();
      
      // Initialize file upload if status is preparing
      if (status.canUploadPresentation(this.currentStatus)) {
        this.initializeFileUpload();
      }
    } catch (error) {
      console.error('Dashboard: Error initializing components:', error);
    }
  };

  /**
   * Initialize file upload
   */
  Dashboard.prototype.initializeFileUpload = function() {
    try {
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
    } catch (error) {
      console.error('Dashboard: Error initializing file upload:', error);
    }
  };

  /**
   * Update proposal information
   */
  Dashboard.prototype.updateProposalInfo = function() {
    try {
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
    } catch (error) {
      console.error('Dashboard: Error updating proposal info:', error);
    }
  };

  /**
   * Update dashboard statistics
   */
  Dashboard.prototype.updateDashboardStats = function() {
    try {
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
    } catch (error) {
      console.error('Dashboard: Error updating dashboard stats:', error);
    }
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
   * Show retry button when loading fails
   */
  Dashboard.prototype.showRetryButton = function() {
    const container = document.getElementById('currentStatusCard');
    if (container) {
      container.innerHTML = '\
        <div class="text-center">\
          <h5 class="text-danger"><i class="fas fa-exclamation-circle"></i> เกิดข้อผิดพลาด</h5>\
          <p>ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>\
          <button class="btn btn-primary" onclick="window.location.reload()">\
            <i class="fas fa-redo"></i> โหลดใหม่\
          </button>\
        </div>\
      ';
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
    console.log('Dashboard: DOM loaded, initializing...');
    const dashboard = new Dashboard();
    dashboard.initialize();
    
    // Make dashboard available globally for debugging
    global.dashboard = dashboard;
  });
  
})(window);
