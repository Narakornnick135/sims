// upload.js - File Upload Module (IIFE Version)

(function(global) {
  'use strict';
  
  // Get dependencies from global namespace
  const UPLOAD = global.SimUser.UPLOAD;
  const api = global.SimUser.api;
  const ui = global.SimUser.ui;
  const utils = global.SimUser.utils;
  
  // UploadManager Class
  function UploadManager() {
    this.fileInputs = {};
    this.uploadProgress = {};
    this.selectedFiles = {};
  }

  /**
   * Initialize file upload for an input
   */
  UploadManager.prototype.initializeUpload = function(inputId, options) {
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
      self.handleFileSelect(e, inputId);
    });
    
    // Setup drag and drop if container provided
    if (config.container) {
      this.setupDragAndDrop(config.container, inputId);
    }
  };

  /**
   * Handle file selection
   */
  UploadManager.prototype.handleFileSelect = function(event, inputId) {
    const file = event.target.files[0];
    if (!file) return;
    
    const config = this.fileInputs[inputId];
    if (!config) return;
    
    // Validate file
    const validation = this.validateFile(file, config);
    if (!validation.valid) {
      ui.showAlert('ไฟล์ไม่ถูกต้อง', validation.message, 'danger');
      event.target.value = '';
      return;
    }
    
    // Store selected file
    this.selectedFiles[inputId] = file;
    
    // Update UI
    this.updateFileDisplay(inputId, file);
    
    // Call custom handler if provided
    if (config.onSelect) {
      config.onSelect(file);
    }
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

  /**
   * Setup drag and drop
   */
  UploadManager.prototype.setupDragAndDrop = function(containerId, inputId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const self = this;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
      container.addEventListener(eventName, self.preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
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
   * Prevent default drag behaviors
   */
  UploadManager.prototype.preventDefaults = function(e) {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Update file display
   */
  UploadManager.prototype.updateFileDisplay = function(inputId, file) {
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

  /**
   * Upload file
   */
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
    this.showProgress(inputId, 0);
    
    const self = this;
    
    // Simulate progress (in real app, use XMLHttpRequest for progress)
    const progressInterval = this.simulateProgress(inputId);
    
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
      self.showProgress(inputId, 100);
      
      // Call complete handler
      if (config.onComplete) {
        config.onComplete(response);
      }
      
      // Hide progress after delay
      setTimeout(function() {
        self.hideProgress(inputId);
      }, 500);
      
      return response;
    })
    .catch(function(error) {
      // Call error handler
      if (config.onError) {
        config.onError(error);
      }
      
      clearInterval(progressInterval);
      self.hideProgress(inputId);
      throw error;
    });
  };

  /**
   * Upload presentation file
   */
  UploadManager.prototype.uploadPresentationFile = function(proposalId, inputId) {
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

  /**
   * Show upload progress
   */
  UploadManager.prototype.showProgress = function(inputId, percent) {
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

  /**
   * Hide upload progress
   */
  UploadManager.prototype.hideProgress = function(inputId) {
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

  /**
   * Simulate upload progress
   */
  UploadManager.prototype.simulateProgress = function(inputId) {
    let progress = 0;
    const self = this;
    
    return setInterval(function() {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      
      self.showProgress(inputId, Math.min(progress, 100));
    }, 200);
  };

  /**
   * Clear selected file
   */
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

  /**
   * Get selected file
   */
  UploadManager.prototype.getSelectedFile = function(inputId) {
    return this.selectedFiles[inputId];
  };

  /**
   * Check if file is selected
   */
  UploadManager.prototype.hasFile = function(inputId) {
    return inputId in this.selectedFiles;
  };

  /**
   * Reset all uploads
   */
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
    initializeUpload: function(inputId, options) { return uploadManager.initializeUpload(inputId, options); },
    uploadFile: function(inputId, endpoint, data) { return uploadManager.uploadFile(inputId, endpoint, data); },
    uploadPresentationFile: function(proposalId, inputId) { return uploadManager.uploadPresentationFile(proposalId, inputId); },
    clearFile: function(inputId) { return uploadManager.clearFile(inputId); },
    getSelectedFile: function(inputId) { return uploadManager.getSelectedFile(inputId); },
    hasFile: function(inputId) { return uploadManager.hasFile(inputId); },
    resetAll: function() { return uploadManager.resetAll(); }
  };
  
})(window);