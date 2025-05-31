// status.js - Status Management Module (IIFE Version)

(function(global) {
  'use strict';
  
  // Get dependencies from global namespace
  const STATUS_CONFIG = global.SimUser.STATUS_CONFIG;
  const utils = global.SimUser.utils;
  const ui = global.SimUser.ui;
  
  // StatusManager Class
  function StatusManager() {
    this.currentStatus = null;
    this.statusOrder = ['waiting', 'reviewing', 'preparing', 'approved'];
  }

  /**
   * Get status configuration
   */
  StatusManager.prototype.getStatusConfig = function(status) {
    return STATUS_CONFIG[status.toUpperCase()] || null;
  };

  /**
   * Update status tracker UI
   */
  StatusManager.prototype.updateStatusTracker = function(status) {
    this.currentStatus = status;
    
    // Update status items
    const statusItems = document.querySelectorAll('.status-item');
    statusItems.forEach(function(item) {
      item.classList.remove('active', 'completed');
    });
    
    // Handle rejected status by showing it at approved position
    let displayStatus = status;
    if (status === 'rejected') {
      displayStatus = 'approved';
    }
    
    const currentIndex = this.statusOrder.indexOf(displayStatus);
    
    if (currentIndex !== -1) {
      // Mark previous steps as completed
      for (let i = 0; i < currentIndex; i++) {
        const item = document.querySelector('[data-status="' + this.statusOrder[i] + '"]');
        if (item) item.classList.add('completed');
      }
      
      // Mark current step as active
      const currentItem = document.querySelector('[data-status="' + displayStatus + '"]');
      if (currentItem) {
        currentItem.classList.add('active');
        
        // Special handling for rejected status
        if (status === 'rejected') {
          this.updateRejectedStatusItem(currentItem);
        }
      }
      
      // Update progress bar
      this.updateProgressBar(currentIndex);
    }
    
    // Update current status card
    this.updateCurrentStatusCard(status);
    
    // Update action buttons
    this.updateActionButtons(status);
    
    // Update next step
    this.updateNextStep(status);
  };

  /**
   * Update rejected status item appearance
   */
  StatusManager.prototype.updateRejectedStatusItem = function(item) {
    const icon = item.querySelector('.status-icon i');
    const text = item.querySelector('.status-text');
    const statusIcon = item.querySelector('.status-icon');
    
    if (icon) icon.className = 'fas fa-times-circle';
    if (statusIcon) statusIcon.style.backgroundColor = 'var(--status-rejected)';
    if (text) {
      text.textContent = 'ไม่ผ่านการอนุมัติ';
      text.style.color = 'var(--status-rejected)';
    }
  };

  /**
   * Update progress bar
   */
  StatusManager.prototype.updateProgressBar = function(currentIndex) {
    const progressBar = document.getElementById('statusProgressBar');
    if (progressBar) {
      const progress = (currentIndex / (this.statusOrder.length - 1)) * 100;
      progressBar.style.width = progress + '%';
    }
  };

  /**
   * Update current status card
   */
  StatusManager.prototype.updateCurrentStatusCard = function(status) {
    const statusCard = document.getElementById('currentStatusCard');
    const statusTitle = document.getElementById('statusTitle');
    const statusDescription = document.getElementById('statusDescription');
    
    if (!statusCard || !statusTitle || !statusDescription) return;
    
    const config = this.getStatusConfig(status);
    if (!config) return;
    
    // Update card class
    statusCard.className = 'current-status-card';
    statusCard.classList.add('status-' + status);
    
    // Update content
    statusTitle.innerHTML = '<i class="' + config.icon + '"></i> ' + config.title;
    statusDescription.textContent = config.description;
  };

  /**
   * Update action buttons based on status
   */
  StatusManager.prototype.updateActionButtons = function(status) {
    const container = document.getElementById('actionButtonsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const buttons = this.getActionButtons(status);
    
    buttons.forEach(function(button) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-action ' + button.class;
      btn.innerHTML = '<i class="' + button.icon + '"></i> ' + button.text;
      btn.setAttribute('data-action', button.action);
      
      if (button.handler) {
        btn.addEventListener('click', button.handler);
      }
      
      container.appendChild(btn);
    });
  };

  /**
   * Get action buttons for status
   */
  StatusManager.prototype.getActionButtons = function(status) {
    const self = this;
    
    const buttonConfigs = {
      'waiting': [
        { 
          text: 'ติดตามสถานะ', 
          icon: 'fas fa-sync-alt', 
          class: 'btn-warning', 
          action: 'checkStatus',
          handler: function() { window.location.reload(); }
        }
      ],
      'reviewing': [
        { 
          text: 'ติดตามสถานะ', 
          icon: 'fas fa-sync-alt', 
          class: 'btn-primary', 
          action: 'checkStatus',
          handler: function() { window.location.reload(); }
        }
      ],
      'preparing': [
        { 
          text: 'ดาวน์โหลดแบบฟอร์มนำเสนอ', 
          icon: 'fas fa-download', 
          class: 'btn-info', 
          action: 'downloadTemplate',
          handler: function() { self.handleDownloadTemplate(); }
        },
        { 
          text: 'อัพโหลดข้อมูลนำเสนอ', 
          icon: 'fas fa-upload', 
          class: 'btn-primary', 
          action: 'uploadPresentation',
          handler: function() { self.handleUploadPresentation(); }
        }
      ],
      'approved': [
        { 
          text: 'ดาวน์โหลดหนังสือรับรอง', 
          icon: 'fas fa-certificate', 
          class: 'btn-success', 
          action: 'downloadCertificate',
          handler: function() { self.handleDownloadCertificate(); }
        },
        { 
          text: 'จัดการโครงการ', 
          icon: 'fas fa-tasks', 
          class: 'btn-primary', 
          action: 'manageProject',
          handler: function() { self.handleManageProject(); }
        }
      ],
      'rejected': [
        { 
          text: 'ดูรายละเอียดการประเมิน', 
          icon: 'fas fa-clipboard-list', 
          class: 'btn-danger', 
          action: 'viewFeedback',
          handler: function() { self.handleViewFeedback(); }
        },
        { 
          text: 'ส่งข้อเสนอใหม่', 
          icon: 'fas fa-redo', 
          class: 'btn-primary', 
          action: 'resubmit',
          handler: function() { self.handleResubmit(); }
        }
      ]
    };
    
    return buttonConfigs[status] || [];
  };

  /**
   * Update next step badge
   */
  StatusManager.prototype.updateNextStep = function(status) {
    const nextStepBadge = document.getElementById('nextStepBadge');
    const nextStepText = document.getElementById('nextStep');
    
    if (!nextStepText) return;
    
    const nextSteps = {
      'waiting': 'รอการตรวจรับโดยเจ้าหน้าที่',
      'reviewing': 'รอการรับรองให้นำเสนอผลงาน',
      'preparing': 'อัปโหลดเอกสารนำเสนอ',
      'approved': 'ติดต่อเจ้าหน้าที่เพื่อทำสัญญา',
      'rejected': 'ปรับปรุงโครงการตามข้อเสนอแนะ'
    };
    
    nextStepText.textContent = nextSteps[status] || 'ติดต่อเจ้าหน้าที่';
    
    // Remove glow effect for rejected status
    if (status === 'rejected' && nextStepBadge) {
      nextStepBadge.classList.remove('badge-glow');
    }
  };

  /**
   * Calculate status progress percentage
   */
  StatusManager.prototype.calculateProgress = function(status) {
    const displayStatus = status === 'rejected' ? 'approved' : status;
    const currentIndex = this.statusOrder.indexOf(displayStatus);
    
    if (currentIndex === -1) return 0;
    
    return (currentIndex / (this.statusOrder.length - 1)) * 100;
  };

  /**
   * Get status message for timeline
   */
  StatusManager.prototype.getStatusMessage = function(status) {
    const messages = {
      'waiting': 'ส่งข้อเสนอโครงการเรียบร้อยแล้ว กำลังรอการตรวจรับโดยเจ้าหน้าที่',
      'reviewing': 'เจ้าหน้าที่ได้ตรวจรับโครงการเรียบร้อยแล้ว และอยู่ระหว่างการพิจารณาเพื่อนำเสนอต่อคณะกรรมการ',
      'preparing': 'โครงการได้รับการคัดเลือกให้นำเสนอต่อคณะกรรมการ กรุณาเตรียมข้อมูลสำหรับการนำเสนอ',
      'approved': 'โครงการได้รับการอนุมัติเรียบร้อยแล้ว',
      'rejected': 'โครงการไม่ผ่านการอนุมัติในครั้งนี้'
    };
    
    return messages[status] || 'มีการอัพเดทสถานะโครงการ';
  };

  /**
   * Get notification title by status
   */
  StatusManager.prototype.getNotificationTitle = function(status) {
    const config = this.getStatusConfig(status);
    return config ? config.title : 'การแจ้งเตือนใหม่';
  };

  /**
   * Check if status allows file upload
   */
  StatusManager.prototype.canUploadPresentation = function(status) {
    return status === 'preparing';
  };

  /**
   * Check if status shows feedback
   */
  StatusManager.prototype.shouldShowFeedback = function(status) {
    return status === 'rejected';
  };

  /**
   * Toggle sections visibility based on status
   */
  StatusManager.prototype.toggleSectionsByStatus = function(status, data) {
    // Upload section
    const uploadSection = document.getElementById('uploadSection');
    if (uploadSection) {
      uploadSection.style.display = this.canUploadPresentation(status) ? 'block' : 'none';
    }
    
    // Feedback section
    const feedbackSection = document.getElementById('feedbackSection');
    if (feedbackSection) {
      feedbackSection.style.display = this.shouldShowFeedback(status) ? 'block' : 'none';
      
      // Show feedback content if available
      if (this.shouldShowFeedback(status) && data && data.feedback) {
        const feedbackContent = document.getElementById('feedbackContent');
        if (feedbackContent) {
          feedbackContent.innerHTML = data.feedback.feedback.replace(/\n/g, '<br>');
        }
      }
    }
  };

  // Button handlers
  StatusManager.prototype.handleDownloadTemplate = function() {
    window.location.href = '/sidfile/templates/presentation_template.pptx';
  };

  StatusManager.prototype.handleUploadPresentation = function() {
    const uploadSection = document.getElementById('uploadSection');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  StatusManager.prototype.handleDownloadCertificate = function() {
    if (ui) {
      ui.showAlert('แจ้งเตือน', 'หนังสือรับรองจะพร้อมให้ดาวน์โหลดในอีก 3-5 วันทำการ', 'info');
    }
  };

  StatusManager.prototype.handleManageProject = function() {
    if (ui) {
      ui.showAlert('แจ้งเตือน', 'ระบบจัดการโครงการจะเปิดให้ใช้งานเร็วๆ นี้', 'info');
    }
  };

  StatusManager.prototype.handleViewFeedback = function() {
    const feedbackSection = document.getElementById('feedbackSection');
    if (feedbackSection) {
      feedbackSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  StatusManager.prototype.handleResubmit = function() {
    if (ui) {
      ui.showConfirm(
        'ยืนยันการส่งข้อเสนอใหม่',
        'คุณต้องการส่งข้อเสนอโครงการใหม่หรือไม่?',
        { confirmText: 'ส่งข้อเสนอใหม่', type: 'primary' }
      ).then(function(confirmed) {
        if (confirmed) {
          window.location.href = '/simuser/submit';
        }
      });
    }
  };

  // Create singleton instance
  const statusManager = new StatusManager();

  // Export status functions
  global.SimUser.status = {
    updateStatusTracker: function(status) { return statusManager.updateStatusTracker(status); },
    getStatusConfig: function(status) { return statusManager.getStatusConfig(status); },
    calculateProgress: function(status) { return statusManager.calculateProgress(status); },
    getStatusMessage: function(status) { return statusManager.getStatusMessage(status); },
    getNotificationTitle: function(status) { return statusManager.getNotificationTitle(status); },
    canUploadPresentation: function(status) { return statusManager.canUploadPresentation(status); },
    shouldShowFeedback: function(status) { return statusManager.shouldShowFeedback(status); },
    toggleSectionsByStatus: function(status, data) { return statusManager.toggleSectionsByStatus(status, data); }
  };
  
})(window);