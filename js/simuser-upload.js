// upload.js - Enhanced File Upload Module for 4 file types (IIFE Version)

(function(global) {
  'use strict';
  
  // Get dependencies from global namespace
  const UPLOAD = global.SimUser.UPLOAD;
  const api = global.SimUser.api;
  const ui = global.SimUser.ui;
  const utils = global.SimUser.utils;
  
  // File type configurations
  const FILE_CONFIGS = {
    proposalWord: {
      inputId: 'proposalWordFile',
      containerId: 'proposalWordContainer',
      progressId: 'proposalWordProgress',
      successId: 'proposalWordSuccess',
      fileType: 'proposal_word',
      allowedExtensions: ['.doc', '.docx'],
      allowedMimeTypes: [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      maxSize: 20 * 1024 * 1024, // 20MB
      label: 'ข้อเสนอโครงการ (Word)'
    },
    proposalPdf: {
      inputId: 'proposalPdfFile',
      containerId: 'proposalPdfContainer',
      progressId: 'proposalPdfProgress',
      successId: 'proposalPdfSuccess',
      fileType: 'proposal_pdf',
      allowedExtensions: ['.pdf'],
      allowedMimeTypes: ['application/pdf'],
      maxSize: 20 * 1024 * 1024, // 20MB
      label: 'ข้อเสนอโครงการ (PDF)'
    },
    slidePptx: {
      inputId: 'slidePptxFile',
      containerId: 'slidePptxContainer',
      progressId: 'slidePptxProgress',
      successId: 'slidePptxSuccess',
      fileType: 'slide_pptx',
      allowedExtensions: ['.ppt', '.pptx'],
      allowedMimeTypes: [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ],
      maxSize: 50 * 1024 * 1024, // 50MB
      label: 'สไลด์นำเสนอ (PowerPoint)'
    },
    slidePdf: {
      inputId: 'slidePdfFile',
      containerId: 'slidePdfContainer',
      progressId: 'slidePdfProgress',
      successId: 'slidePdfSuccess',
      fileType: 'slide_pdf',
      allowedExtensions: ['.pdf'],
      allowedMimeTypes: ['application/pdf'],
      maxSize: 30 * 1024 * 1024, // 30MB
      label: 'สไลด์นำเสนอ (PDF)'
    }
  };
  
  // UploadManager Class
  function UploadManager() {
    this.fileInputs = {};
    this.selectedFiles = {};
    this.uploadedFiles = {};
    this.uploadProgress = {};
  }

  /**
   * Initialize presentation file uploads
   */
  UploadManager.prototype.initializePresentationUploads = function() {
    const self = this;
    
    // Initialize each file type
    Object.keys(FILE_CONFIGS).forEach(function(key) {
      const config = FILE_CONFIGS[key];
      self.initializeFileUpload(key, config);
    });
    
    // Setup buttons
    this.setupUploadButtons();
    
    // Load existing uploaded files status
    this.checkUploadedStatus();
  };

  /**
   * Initialize individual file upload
   */
  UploadManager.prototype.initializeFileUpload = function(key, config) {
    const self = this;
    const fileInput = document.getElementById(config.inputId);
    
    if (!fileInput) return;
    
    // File selection handler
    fileInput.addEventListener('change', function(e) {
      self.handleFileSelect(e, key, config);
    });
    
    // Drag and drop
    this.setupDragAndDrop(config.containerId, config.inputId);
  };

  /**
   * Handle file selection
   */
  UploadManager.prototype.handleFileSelect = function(event, key, config) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    const validation = this.validateFile(file, config);
    if (!validation.valid) {
      ui.showAlert('ไฟล์ไม่ถูกต้อง', validation.message, 'danger');
      event.target.value = '';
      return;
    }
    
    // Store selected file
    this.selectedFiles[key] = file;
    
    // Update UI
    this.updateFileDisplay(key, file, config);
    
    // Check if all files are selected
    this.updateSubmitButton();
  };

  /**
   * Validate file
   */
  UploadManager.prototype.validateFile = function(file, config) {
    // Check file size
    if (file.size > config.maxSize) {
      return {
        valid: false,
        message: 'ไฟล์มีขนาดใหญ่เกินไป กรุณาอัปโหลดไฟล์ที่มีขนาดไม่เกิน ' + utils.formatFileSize(config.maxSize)
      };
    }
    
    // Check file extension
    const extension = '.' + utils.getFileExtension(file.name).toLowerCase();
    if (config.allowedExtensions.indexOf(extension) === -1) {
      return {
        valid: false,
        message: 'ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะไฟล์ ' + config.allowedExtensions.join(', ')
      };
    }
    
    // Check MIME type
    if (config.allowedMimeTypes.indexOf(file.type) === -1) {
      return {
        valid: false,
        message: 'ประเภทไฟล์ไม่ถูกต้อง'
      };
    }
    
    return { valid: true };
  };

  /**
   * Update file display when selected
   */
  UploadManager.prototype.updateFileDisplay = function(key, file, config) {
    const container = document.getElementById(config.containerId);
    const successDiv = document.getElementById(config.successId);
    
    if (container && successDiv) {
      container.classList.add('file-uploaded');
      const fileNameSpan = successDiv.querySelector('.file-name');
      if (fileNameSpan) {
        fileNameSpan.textContent = file.name + ' (' + utils.formatFileSize(file.size) + ')';
      }
    }
    
    this.updateProgressOverview();
  };

  /**
   * Setup drag and drop
   */
  UploadManager.prototype.setupDragAndDrop = function(containerId, inputId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const self = this;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
      container.addEventListener(eventName, function(e) {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    
    // Highlight drop area
    ['dragenter', 'dragover'].forEach(function(eventName) {
      container.addEventListener(eventName, function() {
        container.classList.add('drag-over');
      });
    });
    
    ['dragleave', 'drop'].forEach(function(eventName) {
      container.addEventListener(eventName, function() {
        container.classList.remove('drag-over');
      });
    });
    
    // Handle dropped files
    container.addEventListener('drop', function(e) {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const fileInput = document.getElementById(inputId);
        if (fileInput) {
          fileInput.files = files;
          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
        }
      }
    });
  };

  /**
   * Setup upload buttons
   */
  UploadManager.prototype.setupUploadButtons = function() {
    const self = this;
    
    // Check status button
    const checkBtn = document.getElementById('checkUploadStatus');
    if (checkBtn) {
      checkBtn.addEventListener('click', function() {
        self.checkUploadedStatus();
      });
    }
    
    // Submit all files button
    const submitBtn = document.getElementById('submitAllFiles');
    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        self.uploadAllFiles();
      });
    }
  };

  /**
   * Check uploaded files status from server
   */
  UploadManager.prototype.checkUploadedStatus = function() {
    const self = this;
    const proposalId = window.dashboard?.proposalData?.proposal?.id;
    
    if (!proposalId) return;
    
    ui.showLoading('กำลังตรวจสอบสถานะไฟล์...');
    
    api.apiCall('/proposals/' + proposalId + '/presentation-documents')
      .then(function(response) {
        if (response.success) {
          self.processUploadedStatus(response.data);
        }
      })
      .catch(function(error) {
        console.error('Error checking upload status:', error);
      })
      .finally(function() {
        ui.hideLoading();
      });
  };

  /**
   * Process uploaded files status
   */
  UploadManager.prototype.processUploadedStatus = function(data) {
    const self = this;
    
    // Reset uploaded files
    this.uploadedFiles = {};
    
    // Process each file type
    data.files.forEach(function(file) {
      if (file.is_uploaded) {
        // Find the key for this file type
        const key = self.findKeyByFileType(file.file_type);
        if (key) {
          self.uploadedFiles[key] = {
            fileName: file.file_name,
            fileSize: file.file_size,
            uploadedAt: file.uploaded_at,
            downloadUrl: file.download_url
          };
          
          // Update UI to show uploaded status
          self.showUploadedFile(key, file);
        }
      }
    });
    
    // Update progress overview
    this.updateProgressOverview();
    this.updateSubmitButton();
    
    // Show status message
    const statusMsg = document.getElementById('uploadStatusMessage');
    const statusText = document.getElementById('uploadStatusText');
    if (statusMsg && statusText) {
      if (data.is_complete) {
        statusText.textContent = 'ยินดีด้วย! คุณได้อัปโหลดไฟล์ครบทั้ง 4 ประเภทแล้ว';
        statusMsg.className = 'alert alert-success mt-3';
      } else {
        statusText.textContent = 'คุณอัปโหลดไฟล์แล้ว ' + data.uploaded_files + ' จาก ' + data.required_files + ' ไฟล์';
        statusMsg.className = 'alert alert-warning mt-3';
      }
      statusMsg.style.display = 'block';
    }
  };

  /**
   * Find key by file type
   */
  UploadManager.prototype.findKeyByFileType = function(fileType) {
    for (const key in FILE_CONFIGS) {
      if (FILE_CONFIGS[key].fileType === fileType) {
        return key;
      }
    }
    return null;
  };

  /**
   * Show uploaded file in UI
   */
  UploadManager.prototype.showUploadedFile = function(key, fileData) {
    const config = FILE_CONFIGS[key];
    if (!config) return;
    
    const container = document.getElementById(config.containerId);
    const successDiv = document.getElementById(config.successId);
    
    if (container && successDiv) {
      container.classList.add('file-uploaded');
      const fileNameSpan = successDiv.querySelector('.file-name');
      if (fileNameSpan) {
        fileNameSpan.textContent = fileData.file_name + ' (' + utils.formatFileSize(fileData.file_size) + ')';
      }
      
      // Remove selected file if it's already uploaded
      delete this.selectedFiles[key];
    }
  };

  /**
   * Remove file
   */
  UploadManager.prototype.removeFile = function(key) {
    const config = FILE_CONFIGS[key];
    if (!config) return;
    
    // Clear file input
    const fileInput = document.getElementById(config.inputId);
    if (fileInput) {
      fileInput.value = '';
    }
    
    // Clear selected file
    delete this.selectedFiles[key];
    
    // Update UI
    const container = document.getElementById(config.containerId);
    if (container) {
      container.classList.remove('file-uploaded');
    }
    
    this.updateProgressOverview();
    this.updateSubmitButton();
  };

  /**
   * Update progress overview
   */
  UploadManager.prototype.updateProgressOverview = function() {
    const totalFiles = Object.keys(FILE_CONFIGS).length;
    const selectedCount = Object.keys(this.selectedFiles).length;
    const uploadedCount = Object.keys(this.uploadedFiles).length;
    const totalCount = selectedCount + uploadedCount;
    
    // Update badge
    const badge = document.getElementById('uploadProgressBadge');
    if (badge) {
      badge.textContent = totalCount + '/' + totalFiles + ' ไฟล์';
      badge.className = totalCount === totalFiles ? 'badge bg-success' : 'badge bg-primary';
    }
    
    // Update progress bar
    const progressBar = document.getElementById('overallProgressBar');
    if (progressBar) {
      const percentage = Math.round((totalCount / totalFiles) * 100);
      progressBar.style.width = percentage + '%';
      progressBar.textContent = percentage + '%';
      progressBar.className = percentage === 100 ? 'progress-bar bg-success' : 'progress-bar bg-primary';
    }
  };

  /**
   * Update submit button state
   */
  UploadManager.prototype.updateSubmitButton = function() {
    const submitBtn = document.getElementById('submitAllFiles');
    if (submitBtn) {
      const hasFiles = Object.keys(this.selectedFiles).length > 0;
      submitBtn.disabled = !hasFiles;
      
      if (hasFiles) {
        submitBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> อัปโหลด ' + 
                             Object.keys(this.selectedFiles).length + ' ไฟล์';
      } else {
        submitBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> อัปโหลดไฟล์ทั้งหมด';
      }
    }
  };

  /**
   * Upload all selected files
   */
  UploadManager.prototype.uploadAllFiles = function() {
    const self = this;
    const proposalId = window.dashboard?.proposalData?.proposal?.id;
    
    if (!proposalId) {
      ui.showAlert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลโครงการ', 'danger');
      return;
    }
    
    const filesToUpload = Object.keys(this.selectedFiles);
    if (filesToUpload.length === 0) {
      ui.showAlert('ไม่มีไฟล์', 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด', 'warning');
      return;
    }
    
    ui.showLoading('กำลังอัปโหลดไฟล์...');
    
    // Create FormData
    const formData = new FormData();
    filesToUpload.forEach(function(key) {
      const config = FILE_CONFIGS[key];
      formData.append(config.fileType, self.selectedFiles[key]);
    });
    
    // Upload files
    const token = global.SimUser.auth.getToken();
    const baseURL = global.SimUser.api.baseURL || global.SimUser.API_CONFIG.BASE_URL;
    
    fetch(baseURL + '/proposals/' + proposalId + '/presentation-documents', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      body: formData
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data.success) {
        ui.showAlert('สำเร็จ', 'อัปโหลดไฟล์เรียบร้อยแล้ว', 'success');
        
        // Clear selected files
        self.selectedFiles = {};
        
        // Refresh status
        self.checkUploadedStatus();
        
        // Check if all files are uploaded
        if (data.data.is_complete) {
          setTimeout(function() {
            ui.showConfirm(
              'อัปโหลดครบถ้วน',
              'คุณได้อัปโหลดไฟล์ครบทั้ง 4 ประเภทแล้ว ต้องการกลับไปหน้าหลักหรือไม่?',
              { confirmText: 'กลับหน้าหลัก', cancelText: 'อยู่ที่นี่' }
            ).then(function(confirmed) {
              if (confirmed) {
                window.location.reload();
              }
            });
          }, 1500);
        }
      } else {
        throw new Error(data.message || 'ไม่สามารถอัปโหลดไฟล์ได้');
      }
    })
    .catch(function(error) {
      console.error('Upload error:', error);
      ui.showAlert('เกิดข้อผิดพลาด', error.message, 'danger');
    })
    .finally(function() {
      ui.hideLoading();
    });
  };

  /**
   * Show upload progress
   */
  UploadManager.prototype.showProgress = function(key, percent) {
    const config = FILE_CONFIGS[key];
    if (!config) return;
    
    const progressElement = document.getElementById(config.progressId);
    if (progressElement) {
      progressElement.style.display = 'block';
      const progressBar = progressElement.querySelector('.upload-progress-bar');
      if (progressBar) {
        progressBar.style.width = percent + '%';
      }
    }
  };

  /**
   * Hide upload progress
   */
  UploadManager.prototype.hideProgress = function(key) {
    const config = FILE_CONFIGS[key];
    if (!config) return;
    
    const progressElement = document.getElementById(config.progressId);
    if (progressElement) {
      progressElement.style.display = 'none';
    }
  };

  // Keep existing upload functions for backward compatibility
  UploadManager.prototype.initializeUpload = function(inputId, options) {
    // Original implementation for single file uploads
    options = options || {};
    const fileInput = document.getElementById(inputId);
    if (!fileInput) return;
    
    const defaultOptions = {
      type: 'general',
      maxSize: UPLOAD.MAX_FILE_SIZE,
      allowedExtensions: [],
      allowedMimeTypes: [],
      onSelect: null,
      onProgress: null,
      onComplete: null,
      onError: null,
      container: null
    };
    
    const config = Object.assign({}, defaultOptions, options);
    
    // Store configuration
    this.fileInputs[inputId] = config;
    
    // Setup event listeners
    const self = this;
    fileInput.addEventListener('change', function(e) {
      self.handleFileSelectOriginal(e, inputId);
    });
    
    // Setup drag and drop if container provided
    if (config.container) {
      this.setupDragAndDrop(config.container, inputId);
    }
  };
  
  UploadManager.prototype.handleFileSelectOriginal = function(event, inputId) {
    const file = event.target.files[0];
    if (!file) return;
    
    const config = this.fileInputs[inputId];
    if (!config) return;
    
    // Validate file
    const validation = this.validateFileOriginal(file, config);
    if (!validation.valid) {
      ui.showAlert('ไฟล์ไม่ถูกต้อง', validation.message, 'danger');
      event.target.value = '';
      return;
    }
    
    // Store selected file
    this.selectedFiles[inputId] = file;
    
    // Update UI
    this.updateFileDisplayOriginal(inputId, file);
    
    // Call custom handler if provided
    if (config.onSelect) {
      config.onSelect(file);
    }
  };
  
  UploadManager.prototype.validateFileOriginal = function(file, config) {
    // Check file size
    if (file.size > config.maxSize) {
      return {
        valid: false,
        message: 'ไฟล์มีขนาดใหญ่เกินไป กรุณาอัปโหลดไฟล์ที่มีขนาดไม่เกิน ' + utils.formatFileSize(config.maxSize)
      };
    }
    
    // Check file extension
    if (config.allowedExtensions.length > 0) {
      const extension = '.' + utils.getFileExtension(file.name);
      if (config.allowedExtensions.indexOf(extension) === -1) {
        return {
          valid: false,
          message: 'ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะไฟล์ ' + config.allowedExtensions.join(', ')
        };
      }
    }
    
    // Check MIME type
    if (config.allowedMimeTypes.length > 0) {
      if (config.allowedMimeTypes.indexOf(file.type) === -1) {
        return {
          valid: false,
          message: 'ประเภทไฟล์ไม่ถูกต้อง'
        };
      }
    }
    
    return { valid: true };
  };
  
  UploadManager.prototype.updateFileDisplayOriginal = function(inputId, file) {
    const config = this.fileInputs[inputId];
    if (!config || !config.container) return;
    
    const container = document.getElementById(config.container);
    if (!container) return;
    
    // Add has-file class
    container.classList.add('has-file');
    
    // Update display text
    const fileText = container.querySelector('.file-upload-text');
    if (fileText) {
      fileText.textContent = file.name;
    }
    
    // Update file info
    const fileInfo = container.querySelector('.file-format-info');
    if (fileInfo) {
      fileInfo.textContent = 'ขนาดไฟล์: ' + utils.formatFileSize(file.size);
    }
  };

  UploadManager.prototype.uploadPresentationFile = function(proposalId, inputId) {
    // Original implementation for single presentation file
    inputId = inputId || 'presentationFile';
    const file = this.selectedFiles[inputId];
    
    if (!file) {
      return Promise.reject(new Error('กรุณาเลือกไฟล์ที่ต้องการอัปโหลด'));
    }
    
    const self = this;
    
    ui.showLoading('กำลังอัปโหลดไฟล์...');
    
    return api.uploadPresentationFile(proposalId, file)
      .then(function(response) {
        if (response.success) {
          ui.showAlert('สำเร็จ', 'อัปโหลดเอกสารนำเสนอเรียบร้อยแล้ว', 'success');
          
          // Clear file selection
          self.clearFile(inputId);
          
          return response;
        } else {
          throw new Error(response.message || 'ไม่สามารถอัปโหลดไฟล์ได้');
        }
      })
      .catch(function(error) {
        ui.showAlert('เกิดข้อผิดพลาด', error.message, 'danger');
        throw error;
      })
      .finally(function() {
        ui.hideLoading();
      });
  };
  
  UploadManager.prototype.uploadFile = function(inputId, endpoint, additionalData) {
    additionalData = additionalData || {};
    const file = this.selectedFiles[inputId];
    
    if (!file) {
      return Promise.reject(new Error('กรุณาเลือกไฟล์ที่ต้องการอัปโหลด'));
    }
    
    const config = this.fileInputs[inputId];
    if (!config) {
      return Promise.reject(new Error('ไม่พบการตั้งค่าสำหรับการอัปโหลด'));
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional data
    Object.keys(additionalData).forEach(function(key) {
      formData.append(key, additionalData[key]);
    });
    
    // Show progress
    this.showProgressOriginal(inputId, 0);
    
    const self = this;
    
    // Simulate progress (in real app, use XMLHttpRequest for progress)
    const progressInterval = this.simulateProgressOriginal(inputId);
    
    // Upload file
    return api.apiCall(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set it with boundary
      }
    })
    .then(function(response) {
      // Clear progress simulation
      clearInterval(progressInterval);
      self.showProgressOriginal(inputId, 100);
      
      // Call complete handler
      if (config.onComplete) {
        config.onComplete(response);
      }
      
      // Hide progress after delay
      setTimeout(function() {
        self.hideProgressOriginal(inputId);
      }, 500);
      
      return response;
    })
    .catch(function(error) {
      // Call error handler
      if (config.onError) {
        config.onError(error);
      }
      
      clearInterval(progressInterval);
      self.hideProgressOriginal(inputId);
      throw error;
    });
  };
  
  UploadManager.prototype.showProgressOriginal = function(inputId, percent) {
    const config = this.fileInputs[inputId];
    if (!config || !config.container) return;
    
    const container = document.getElementById(config.container);
    if (!container) return;
    
    const progressElement = container.querySelector('.upload-progress');
    const progressBar = container.querySelector('.upload-progress-bar');
    
    if (progressElement) {
      progressElement.style.display = 'block';
    }
    
    if (progressBar) {
      progressBar.style.width = percent + '%';
    }
    
    // Store progress
    this.uploadProgress[inputId] = percent;
    
    // Call progress handler
    if (config.onProgress) {
      config.onProgress(percent);
    }
  };
  
  UploadManager.prototype.hideProgressOriginal = function(inputId) {
    const config = this.fileInputs[inputId];
    if (!config || !config.container) return;
    
    const container = document.getElementById(config.container);
    if (!container) return;
    
    const progressElement = container.querySelector('.upload-progress');
    if (progressElement) {
      progressElement.style.display = 'none';
    }
    
    delete this.uploadProgress[inputId];
  };
  
  UploadManager.prototype.simulateProgressOriginal = function(inputId) {
    let progress = 0;
    const self = this;
    
    return setInterval(function() {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      
      self.showProgressOriginal(inputId, Math.min(progress, 100));
    }, 200);
  };

  UploadManager.prototype.clearFile = function(inputId) {
    const fileInput = document.getElementById(inputId);
    if (fileInput) {
      fileInput.value = '';
    }
    
    delete this.selectedFiles[inputId];
    
    const config = this.fileInputs[inputId];
    if (config && config.container) {
      const container = document.getElementById(config.container);
      if (container) {
        container.classList.remove('has-file');
        
        const fileText = container.querySelector('.file-upload-text');
        if (fileText) {
          fileText.textContent = 'คลิกหรือลากไฟล์มาวางที่นี่';
        }
        
        const fileInfo = container.querySelector('.file-format-info');
        if (fileInfo) {
          const extensions = config.allowedExtensions.join(', ');
          const maxSize = utils.formatFileSize(config.maxSize);
          fileInfo.textContent = 'รองรับไฟล์ ' + extensions + ' ขนาดไม่เกิน ' + maxSize;
        }
      }
    }
  };
  
  UploadManager.prototype.getSelectedFile = function(inputId) {
    return this.selectedFiles[inputId];
  };
  
  UploadManager.prototype.hasFile = function(inputId) {
    return inputId in this.selectedFiles;
  };
  
  UploadManager.prototype.resetAll = function() {
    const self = this;
    Object.keys(this.fileInputs).forEach(function(inputId) {
      self.clearFile(inputId);
    });
    this.uploadProgress = {};
  };

  // Create singleton instance
  const uploadManager = new UploadManager();

  // Export upload functions
  global.SimUser.upload = {
    // New presentation upload functions
    initializePresentationUploads: function() { return uploadManager.initializePresentationUploads(); },
    removeFile: function(key) { return uploadManager.removeFile(key); },
    uploadAllFiles: function() { return uploadManager.uploadAllFiles(); },
    checkUploadedStatus: function() { return uploadManager.checkUploadedStatus(); },
    
    // Existing functions for backward compatibility
    initializeUpload: function(inputId, options) { return uploadManager.initializeUpload(inputId, options); },
    uploadFile: function(inputId, endpoint, data) { return uploadManager.uploadFile(inputId, endpoint, data); },
    uploadPresentationFile: function(proposalId, inputId) { return uploadManager.uploadPresentationFile(proposalId, inputId); },
    clearFile: function(inputId) { return uploadManager.clearFile(inputId); },
    getSelectedFile: function(inputId) { return uploadManager.getSelectedFile(inputId); },
    hasFile: function(inputId) { return uploadManager.hasFile(inputId); },
    resetAll: function() { return uploadManager.resetAll(); }
  };
  
})(window);
