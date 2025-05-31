// documents.js - Documents Module (IIFE Version)

(function(global) {
  'use strict';
  
  // Get dependencies from global namespace
  const api = global.SimUser.api;
  const utils = global.SimUser.utils;
  const ui = global.SimUser.ui;
  
  // DocumentManager Class
  function DocumentManager() {
    this.documents = {
      word: null,
      pdf: null,
      business: null,
      presentation: null
    };
  }

  /**
   * Initialize documents section
   */
  DocumentManager.prototype.initialize = function(proposalData) {
    if (!proposalData || !proposalData.proposal) return;
    
    const proposal = proposalData.proposal;
    
    // Store document paths
    this.documents = {
      word: proposal.word_file_path,
      pdf: proposal.pdf_file_path,
      business: proposal.business_file_path,
      presentation: proposal.presentation_file_path
    };
    
    // Update document info
    this.updateDocumentInfo(proposal);
    
    // Enable download buttons
    this.enableDownloadButtons();
    
    // Setup download handlers
    this.setupDownloadHandlers();
  };

  /**
   * Update document information display
   */
  DocumentManager.prototype.updateDocumentInfo = function(proposal) {
    // Update upload dates
    const submissionDate = proposal.created_at ? new Date(proposal.created_at) : null;
    
    this.updateUploadDate('wordUploadDate', submissionDate);
    this.updateUploadDate('pdfUploadDate', submissionDate);
    this.updateUploadDate('businessUploadDate', submissionDate);
    
    if (proposal.presentation_uploaded_at) {
      this.updateUploadDate('presentationUploadDate', new Date(proposal.presentation_uploaded_at));
    }
  };

  /**
   * Update upload date display
   */
  DocumentManager.prototype.updateUploadDate = function(elementId, date) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = date ? utils.formatDate(date) : '-';
    }
  };

  /**
   * Enable download buttons for available documents
   */
  DocumentManager.prototype.enableDownloadButtons = function() {
    if (this.documents.word) {
      this.setButtonEnabled('downloadWordBtn', true);
    }
    
    if (this.documents.pdf) {
      this.setButtonEnabled('downloadPdfBtn', true);
    }
    
    if (this.documents.business) {
      this.setButtonEnabled('downloadBusinessBtn', true);
    }
    
    if (this.documents.presentation) {
      this.setButtonEnabled('downloadPresentationBtn', true);
    }
    
    // Template button is always enabled
    this.setButtonEnabled('downloadTemplateBtn', true);
  };

  /**
   * Set button enabled state
   */
  DocumentManager.prototype.setButtonEnabled = function(buttonId, enabled) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = !enabled;
    }
  };

  /**
   * Setup download button handlers
   */
  DocumentManager.prototype.setupDownloadHandlers = function() {
    const self = this;
    
    // Proposal documents
    this.addDownloadHandler('downloadWordBtn', function() { self.downloadDocument('word'); });
    this.addDownloadHandler('downloadPdfBtn', function() { self.downloadDocument('pdf'); });
    this.addDownloadHandler('downloadBusinessBtn', function() { self.downloadDocument('business'); });
    this.addDownloadHandler('downloadPresentationBtn', function() { self.downloadDocument('presentation'); });
    
    // Template
    this.addDownloadHandler('downloadTemplateBtn', function() { self.downloadTemplate('presentation'); });
  };

  /**
   * Add download handler to button
   */
  DocumentManager.prototype.addDownloadHandler = function(buttonId, handler) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', handler);
    }
  };

  /**
   * Download document
   */
  DocumentManager.prototype.downloadDocument = function(type) {
    const documentPath = this.documents[type];
    
    if (!documentPath) {
      if (ui) {
        ui.showAlert('ไม่พบไฟล์', 'ไม่พบไฟล์ที่ต้องการดาวน์โหลด', 'warning');
      }
      return Promise.resolve();
    }
    
    try {
      // Get full download URL
      const downloadUrl = api.getDocumentDownloadUrl(documentPath);
      
      // Open in new window/tab
      window.open(downloadUrl, '_blank');
      
      // Track download
      this.trackDownload(type);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error downloading document:', error);
      if (ui) {
        ui.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถดาวน์โหลดไฟล์ได้', 'danger');
      }
      return Promise.reject(error);
    }
  };

  /**
   * Download template
   */
  DocumentManager.prototype.downloadTemplate = function(templateType) {
    try {
      const templateUrl = api.getTemplateDownloadUrl(templateType);
      window.open(templateUrl, '_blank');
      
      // Track download
      this.trackDownload('template_' + templateType);
    } catch (error) {
      console.error('Error downloading template:', error);
      if (ui) {
        ui.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถดาวน์โหลดแบบฟอร์มได้', 'danger');
      }
    }
  };

  /**
   * Track document download
   */
  DocumentManager.prototype.trackDownload = function(documentType) {
    // In a real app, this would send analytics
    console.log('Document downloaded:', documentType);
  };

  /**
   * Check document availability
   */
  DocumentManager.prototype.checkDocumentAvailability = function(type) {
    return !!this.documents[type];
  };

  /**
   * Get document icon class
   */
  DocumentManager.prototype.getDocumentIcon = function(type) {
    const icons = {
      word: 'fas fa-file-word text-primary',
      pdf: 'fas fa-file-pdf text-danger',
      business: 'fas fa-file-alt text-secondary',
      presentation: 'fas fa-file-powerpoint text-warning',
      template: 'fas fa-file-download text-info'
    };
    
    return icons[type] || 'fas fa-file text-muted';
  };

  /**
   * Render document list
   */
  DocumentManager.prototype.renderDocumentList = function(container) {
    if (!container) return;
    
    const self = this;
    
    const documentTypes = [
      {
        type: 'word',
        title: 'ข้อเสนอโครงการ (Word)',
        uploadDateId: 'wordUploadDate',
        downloadBtnId: 'downloadWordBtn'
      },
      {
        type: 'pdf',
        title: 'ข้อเสนอโครงการ (PDF)',
        uploadDateId: 'pdfUploadDate',
        downloadBtnId: 'downloadPdfBtn'
      },
      {
        type: 'business',
        title: 'หลักฐานประกอบกิจการ',
        uploadDateId: 'businessUploadDate',
        downloadBtnId: 'downloadBusinessBtn'
      },
      {
        type: 'presentation',
        title: 'เอกสารนำเสนอ',
        uploadDateId: 'presentationUploadDate',
        downloadBtnId: 'downloadPresentationBtn'
      }
    ];
    
    container.innerHTML = '';
    
    documentTypes.forEach(function(doc) {
      if (self.checkDocumentAvailability(doc.type)) {
        const item = self.createDocumentItem(doc);
        container.appendChild(item);
      }
    });
    
    // Always add template
    const templateItem = this.createTemplateItem();
    container.appendChild(templateItem);
  };

  /**
   * Create document item element
   */
  DocumentManager.prototype.createDocumentItem = function(doc) {
    const self = this;
    const item = document.createElement('div');
    item.className = 'document-item';
    
    const uploadDateElement = document.getElementById(doc.uploadDateId);
    const uploadDate = uploadDateElement ? uploadDateElement.textContent : '-';
    
    const iconClass = this.getDocumentIcon(doc.type);
    const iconParts = iconClass.split(' ');
    const icon = iconParts[0] + ' ' + iconParts[1];
    const colorClass = iconParts.slice(2).join(' ');
    
    item.innerHTML = '\
      <div class="document-icon ' + colorClass + '">\
        <i class="' + icon + '"></i>\
      </div>\
      <div class="document-info">\
        <div class="document-title">' + doc.title + '</div>\
        <div class="document-meta">อัปโหลดเมื่อ: ' + uploadDate + '</div>\
      </div>\
      <div class="document-actions">\
        <button class="btn btn-sm btn-download btn-primary" \
                id="' + doc.downloadBtnId + '"\
                ' + (this.checkDocumentAvailability(doc.type) ? '' : 'disabled') + '>\
          <i class="fas fa-download"></i> ดาวน์โหลด\
        </button>\
      </div>\
    ';
    
    // Add download handler
    const downloadBtn = item.querySelector('#' + doc.downloadBtnId);
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        self.downloadDocument(doc.type);
      });
    }
    
    return item;
  };

  /**
   * Create template item element
   */
  DocumentManager.prototype.createTemplateItem = function() {
    const self = this;
    const item = document.createElement('div');
    item.className = 'document-item';
    
    item.innerHTML = '\
      <div class="document-icon text-warning">\
        <i class="fas fa-file-powerpoint"></i>\
      </div>\
      <div class="document-info">\
        <div class="document-title">แบบฟอร์มนำเสนอโครงการ</div>\
        <div class="document-meta">แบบฟอร์มมาตรฐาน</div>\
      </div>\
      <div class="document-actions">\
        <button class="btn btn-sm btn-download btn-warning" id="downloadTemplateBtn">\
          <i class="fas fa-download"></i> ดาวน์โหลด\
        </button>\
      </div>\
    ';
    
    // Add download handler
    const downloadBtn = item.querySelector('#downloadTemplateBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        self.downloadTemplate('presentation');
      });
    }
    
    return item;
  };

  /**
   * Get document size info
   */
  DocumentManager.prototype.getDocumentSizeInfo = function(bytes) {
    if (!bytes) return '';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Preview document (if supported)
   */
  DocumentManager.prototype.previewDocument = function(type) {
    const documentPath = this.documents[type];
    
    if (!documentPath) {
      if (ui) {
        ui.showAlert('ไม่พบไฟล์', 'ไม่พบไฟล์ที่ต้องการแสดง', 'warning');
      }
      return;
    }
    
    // Only PDF can be previewed in browser
    if (type === 'pdf') {
      const previewUrl = api.getDocumentDownloadUrl(documentPath);
      window.open(previewUrl, '_blank');
    } else {
      // For other types, download instead
      this.downloadDocument(type);
    }
  };

  // Create singleton instance
  const documentManager = new DocumentManager();

  // Export document functions
  global.SimUser.documents = {
    initialize: function(proposalData) { return documentManager.initialize(proposalData); },
    downloadDocument: function(type) { return documentManager.downloadDocument(type); },
    downloadTemplate: function(type) { return documentManager.downloadTemplate(type); },
    checkDocumentAvailability: function(type) { return documentManager.checkDocumentAvailability(type); },
    getDocumentIcon: function(type) { return documentManager.getDocumentIcon(type); },
    renderDocumentList: function(container) { return documentManager.renderDocumentList(container); },
    previewDocument: function(type) { return documentManager.previewDocument(type); }
  };
  
})(window);