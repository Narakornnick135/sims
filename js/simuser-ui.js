// ui.js - UI Management Module (IIFE Version)

(function(global) {
  'use strict';
  
  // Get dependencies from global namespace
  const UI_CONFIG = global.SimUser.UI_CONFIG;
  const APP_CONFIG = global.SimUser.APP_CONFIG;
  const auth = global.SimUser.auth;
  
  // UIManager Class
  function UIManager() {
    this.loadingOverlay = null;
    this.alertBox = null;
    this.currentModals = {};
  }

  /**
   * Initialize UI components
   */
  UIManager.prototype.initialize = function() {
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.alertBox = document.getElementById('alertBox');
    this.updateNavbar();
  };

  /**
   * Show loading overlay
   */
  UIManager.prototype.showLoading = function(message) {
    message = message || 'กำลังโหลด...';
    
    if (!this.loadingOverlay) {
      this.createLoadingOverlay();
    }
    
    const messageElement = this.loadingOverlay.querySelector('.loading-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
    
    this.loadingOverlay.classList.add('show');
  };

  /**
   * Hide loading overlay
   */
  UIManager.prototype.hideLoading = function() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('show');
    }
  };

  /**
   * Create loading overlay if not exists
   */
  UIManager.prototype.createLoadingOverlay = function() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '\
      <div class="spinner-container">\
        <div class="spinner-border text-warning loading-spinner" role="status">\
          <span class="visually-hidden">กำลังโหลด...</span>\
        </div>\
        <div class="loading-message mt-3">กำลังโหลด...</div>\
      </div>\
    ';
    document.body.appendChild(overlay);
    this.loadingOverlay = overlay;
  };

  /**
   * Show alert message
   */
  UIManager.prototype.showAlert = function(title, message, type, duration) {
    type = type || 'success';
    duration = duration !== undefined ? duration : UI_CONFIG.ALERT_DURATION;
    
    if (!this.alertBox) {
      this.createAlertBox();
    }
    
    const alertElement = this.alertBox.querySelector('.alert');
    const alertTitle = this.alertBox.querySelector('#alertTitle');
    const alertMessage = this.alertBox.querySelector('#alertMessage');
    
    // Update alert content
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    
    // Update alert type
    alertElement.className = 'alert alert-' + type + ' alert-dismissible fade show';
    
    // Show alert
    this.alertBox.classList.add('show');
    
    // Auto hide after duration
    if (duration > 0) {
      const self = this;
      setTimeout(function() {
        self.hideAlert();
      }, duration);
    }
  };

  /**
   * Hide alert
   */
  UIManager.prototype.hideAlert = function() {
    if (this.alertBox) {
      this.alertBox.classList.remove('show');
    }
  };

  /**
   * Create alert box if not exists
   */
  UIManager.prototype.createAlertBox = function() {
    const alertBox = document.createElement('div');
    alertBox.id = 'alertBox';
    alertBox.className = 'alert-box';
    alertBox.innerHTML = '\
      <div class="alert alert-success alert-dismissible fade show" role="alert">\
        <strong id="alertTitle">สำเร็จ!</strong> \
        <span id="alertMessage">บันทึกข้อมูลเรียบร้อยแล้ว</span>\
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>\
      </div>\
    ';
    document.body.appendChild(alertBox);
    this.alertBox = alertBox;
    
    // Add close button listener
    const closeBtn = alertBox.querySelector('.btn-close');
    const self = this;
    closeBtn.addEventListener('click', function() {
      self.hideAlert();
    });
  };

  /**
   * Update navbar based on authentication status
   */
  UIManager.prototype.updateNavbar = function() {
    const loginMenuItem = document.getElementById('loginMenuItem');
    if (!loginMenuItem) return;
    
    const userData = auth.getUserData();
    
    if (auth.isAuthenticated() && userData) {
      loginMenuItem.className = 'nav-item dropdown';
      loginMenuItem.innerHTML = '\
        <a class="nav-link dropdown-toggle btn btn-login" href="#" id="navbarDropdown" \
           role="button" data-bs-toggle="dropdown" aria-expanded="false">\
          <i class="fas fa-user-circle me-1"></i> ' + userData.username + '\
        </a>\
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">\
          <li><a class="dropdown-item" href="/simuser/profile">\
            <i class="fas fa-id-card me-2"></i>โปรไฟล์\
          </a></li>\
          <li><a class="dropdown-item" href="/simuser/proposals">\
            <i class="fas fa-file-alt me-2"></i>โครงการของฉัน\
          </a></li>\
          <li><hr class="dropdown-divider"></li>\
          <li><a class="dropdown-item text-danger" href="#" onclick="SimUser.ui.handleLogout(event)">\
            <i class="fas fa-sign-out-alt me-2"></i>ออกจากระบบ\
          </a></li>\
        </ul>\
      ';
    } else {
      loginMenuItem.className = 'nav-item';
      loginMenuItem.innerHTML = '\
        <a class="btn btn-login" href="/sims/login">\
          <i class="fas fa-sign-in-alt me-1"></i> เข้าสู่ระบบ\
        </a>\
      ';
    }
  };

  /**
   * Handle logout
   */
  UIManager.prototype.handleLogout = function(event) {
    event.preventDefault();
    
    if (confirm('ต้องการออกจากระบบหรือไม่?')) {
      this.showLoading('กำลังออกจากระบบ...');
      
      const self = this;
      auth.logout()
        .then(function() {
          self.showAlert('ออกจากระบบสำเร็จ', 'คุณได้ออกจากระบบเรียบร้อยแล้ว', 'success');
        })
        .catch(function(error) {
          console.error('Logout error:', error);
          self.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้', 'danger');
          self.hideLoading();
        });
    }
  };

  /**
   * Create modal
   */
  UIManager.prototype.createModal = function(id, title, content, options) {
    options = options || {};
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = id;
    modal.tabIndex = -1;
    modal.setAttribute('aria-labelledby', id + 'Label');
    modal.setAttribute('aria-hidden', 'true');
    
    const size = options.size ? 'modal-' + options.size : '';
    const centered = options.centered ? 'modal-dialog-centered' : '';
    
    modal.innerHTML = '\
      <div class="modal-dialog ' + size + ' ' + centered + '">\
        <div class="modal-content">\
          <div class="modal-header">\
            <h5 class="modal-title" id="' + id + 'Label">' + title + '</h5>\
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>\
          </div>\
          <div class="modal-body">\
            ' + content + '\
          </div>\
          ' + (options.footer ? '\
            <div class="modal-footer">\
              ' + options.footer + '\
            </div>\
          ' : '') + '\
        </div>\
      </div>\
    ';
    
    document.body.appendChild(modal);
    
    const bsModal = new bootstrap.Modal(modal);
    this.currentModals[id] = bsModal;
    
    // Clean up on hide
    const self = this;
    modal.addEventListener('hidden.bs.modal', function() {
      delete self.currentModals[id];
      modal.remove();
    });
    
    return bsModal;
  };

  /**
   * Show modal
   */
  UIManager.prototype.showModal = function(id) {
    const modal = this.currentModals[id];
    if (modal) {
      modal.show();
    }
  };

  /**
   * Hide modal
   */
  UIManager.prototype.hideModal = function(id) {
    const modal = this.currentModals[id];
    if (modal) {
      modal.hide();
    }
  };

  /**
   * Update badge
   */
  UIManager.prototype.updateBadge = function(elementId, text, type) {
    type = type || 'primary';
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
      element.className = 'badge bg-' + type;
    }
  };

  /**
   * Show confirmation dialog
   */
  UIManager.prototype.showConfirm = function(title, message, options) {
    options = options || {};
    const self = this;
    
    return new Promise(function(resolve) {
      const modalId = 'confirm-' + Date.now();
      const confirmBtn = options.confirmText || 'ยืนยัน';
      const cancelBtn = options.cancelText || 'ยกเลิก';
      const type = options.type || 'primary';
      
      const footer = '\
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">' + cancelBtn + '</button>\
        <button type="button" class="btn btn-' + type + '" id="' + modalId + '-confirm">' + confirmBtn + '</button>\
      ';
      
      const modal = self.createModal(modalId, title, message, { footer: footer });
      
      // Add confirm button listener
      document.getElementById(modalId + '-confirm').addEventListener('click', function() {
        resolve(true);
        modal.hide();
      });
      
      // Add cancel listener
      document.getElementById(modalId).addEventListener('hidden.bs.modal', function() {
        resolve(false);
      });
      
      modal.show();
    });
  };

  /**
   * Show toast notification
   */
  UIManager.prototype.showToast = function(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    
    const toastContainer = this.getOrCreateToastContainer();
    
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-' + type + ' border-0';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = '\
      <div class="d-flex">\
        <div class="toast-body">' + message + '</div>\
        <button type="button" class="btn-close btn-close-white me-2 m-auto" \
                data-bs-dismiss="toast" aria-label="Close"></button>\
      </div>\
    ';
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { delay: duration });
    bsToast.show();
    
    // Remove after hidden
    toast.addEventListener('hidden.bs.toast', function() {
      toast.remove();
    });
  };

  /**
   * Get or create toast container
   */
  UIManager.prototype.getOrCreateToastContainer = function() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(container);
    }
    return container;
  };

  /**
   * Update page title
   */
  UIManager.prototype.updatePageTitle = function(title) {
    document.title = title + ' - ' + APP_CONFIG.NAME;
  };

  /**
   * Toggle element visibility
   */
  UIManager.prototype.toggleElement = function(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = show ? 'block' : 'none';
    }
  };

  /**
   * Enable/disable element
   */
  UIManager.prototype.setElementEnabled = function(elementId, enabled) {
    const element = document.getElementById(elementId);
    if (element) {
      element.disabled = !enabled;
    }
  };

  /**
   * Scroll to element
   */
  UIManager.prototype.scrollToElement = function(elementId, options) {
    options = options || {};
    const element = document.getElementById(elementId);
    if (element) {
      const defaultOptions = { behavior: 'smooth', block: 'start' };
      const scrollOptions = Object.assign({}, defaultOptions, options);
      element.scrollIntoView(scrollOptions);
    }
  };

  /**
   * Add loading state to button
   */
  UIManager.prototype.setButtonLoading = function(buttonId, loading, text) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (loading) {
      button.disabled = true;
      button.setAttribute('data-original-text', button.innerHTML);
      button.innerHTML = '\
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>\
        ' + (text || 'กำลังดำเนินการ...') + '\
      ';
    } else {
      button.disabled = false;
      const originalText = button.getAttribute('data-original-text');
      if (originalText) {
        button.innerHTML = originalText;
        button.removeAttribute('data-original-text');
      }
    }
  };

  // Create singleton instance
  const uiManager = new UIManager();

  // Export UI functions
  global.SimUser.ui = {
    initialize: function() { return uiManager.initialize(); },
    showLoading: function(message) { return uiManager.showLoading(message); },
    hideLoading: function() { return uiManager.hideLoading(); },
    showAlert: function(title, message, type, duration) { return uiManager.showAlert(title, message, type, duration); },
    hideAlert: function() { return uiManager.hideAlert(); },
    updateNavbar: function() { return uiManager.updateNavbar(); },
    handleLogout: function(event) { return uiManager.handleLogout(event); },
    createModal: function(id, title, content, options) { return uiManager.createModal(id, title, content, options); },
    showModal: function(id) { return uiManager.showModal(id); },
    hideModal: function(id) { return uiManager.hideModal(id); },
    updateBadge: function(elementId, text, type) { return uiManager.updateBadge(elementId, text, type); },
    showConfirm: function(title, message, options) { return uiManager.showConfirm(title, message, options); },
    showToast: function(message, type, duration) { return uiManager.showToast(message, type, duration); },
    updatePageTitle: function(title) { return uiManager.updatePageTitle(title); },
    toggleElement: function(elementId, show) { return uiManager.toggleElement(elementId, show); },
    setElementEnabled: function(elementId, enabled) { return uiManager.setElementEnabled(elementId, enabled); },
    scrollToElement: function(elementId, options) { return uiManager.scrollToElement(elementId, options); },
    setButtonLoading: function(buttonId, loading, text) { return uiManager.setButtonLoading(buttonId, loading, text); }
  };
  
})(window);