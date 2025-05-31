// api.js - API Service Module (IIFE Version)

(function(global) {
  'use strict';
  
  // Get dependencies from global namespace
  const API_CONFIG = global.SimUser.API_CONFIG;
  const auth = global.SimUser.auth;
  
  // ApiService Class
  function ApiService() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Make API call with authentication
   */
  ApiService.prototype.apiCall = function(endpoint, options) {
    options = options || {};
    const token = auth.getToken();
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      defaultOptions.headers['Authorization'] = 'Bearer ' + token;
    }
    
    // Merge options
    const mergedOptions = Object.assign({}, defaultOptions, options);
    mergedOptions.headers = Object.assign({}, defaultOptions.headers, options.headers || {});
    
    return new Promise((resolve, reject) => {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      let timeoutId;
      
      if (controller) {
        timeoutId = setTimeout(() => controller.abort(), this.timeout);
        mergedOptions.signal = controller.signal;
      }
      
      fetch(this.baseURL + endpoint, mergedOptions)
        .then(response => {
          if (timeoutId) clearTimeout(timeoutId);
          
          if (response.status === 401) {
            auth.handleAuthError({ status: 401 });
            throw new Error('Unauthorized');
          }
          
          return response.json().then(data => {
            if (!response.ok) {
              throw new Error(data.message || 'HTTP error! status: ' + response.status);
            }
            return data;
          });
        })
        .then(resolve)
        .catch(error => {
          if (error.name === 'AbortError') {
            reject(new Error('Request timeout'));
          } else {
            reject(error);
          }
        });
    });
  };

  /**
   * Get user's proposal data
   */
  ApiService.prototype.getProposalData = function() {
    return this.apiCall(API_CONFIG.ENDPOINTS.GET_MY_PROPOSAL)
      .catch(function(error) {
        console.error('Error fetching proposal data:', error);
        throw new Error('ไม่สามารถดึงข้อมูลโครงการได้');
      });
  };

  /**
   * Submit new proposal
   */
  ApiService.prototype.submitProposal = function(formData) {
    const token = auth.getToken();
    
    return fetch(this.baseURL + API_CONFIG.ENDPOINTS.SUBMIT_PROPOSAL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      body: formData
    })
    .then(function(response) {
      return response.json().then(function(data) {
        if (!response.ok) {
          throw new Error(data.message || 'ไม่สามารถส่งข้อเสนอโครงการได้');
        }
        return data;
      });
    })
    .catch(function(error) {
      console.error('Error submitting proposal:', error);
      throw error;
    });
  };

  /**
   * Update proposal
   */
  ApiService.prototype.updateProposal = function(proposalId, updateData) {
    const endpoint = API_CONFIG.ENDPOINTS.UPDATE_PROPOSAL.replace(':id', proposalId);
    
    return this.apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
    .catch(function(error) {
      console.error('Error updating proposal:', error);
      throw new Error('ไม่สามารถอัปเดตข้อมูลโครงการได้');
    });
  };

  /**
   * Upload presentation file
   */
  ApiService.prototype.uploadPresentationFile = function(proposalId, file) {
    const token = auth.getToken();
    const formData = new FormData();
    formData.append('presentationFile', file);
    
    const endpoint = API_CONFIG.ENDPOINTS.UPLOAD_PRESENTATION.replace(':id', proposalId);
    
    return fetch(this.baseURL + endpoint, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      body: formData
    })
    .then(function(response) {
      return response.json().then(function(data) {
        if (!response.ok) {
          throw new Error(data.message || 'ไม่สามารถอัปโหลดไฟล์ได้');
        }
        return data;
      });
    })
    .catch(function(error) {
      console.error('Error uploading presentation:', error);
      throw error;
    });
  };

  /**
   * Get notifications
   */
  ApiService.prototype.getNotifications = function(params) {
    params = params || {};
    const queryString = new URLSearchParams(params).toString();
    const endpoint = API_CONFIG.ENDPOINTS.GET_NOTIFICATIONS + (queryString ? '?' + queryString : '');
    
    return this.apiCall(endpoint)
      .catch(function(error) {
        console.error('Error fetching notifications:', error);
        throw new Error('ไม่สามารถดึงข้อมูลการแจ้งเตือนได้');
      });
  };

  /**
   * Mark notification as read
   */
  ApiService.prototype.markNotificationAsRead = function(notificationId) {
    const endpoint = API_CONFIG.ENDPOINTS.MARK_AS_READ.replace(':id', notificationId);
    
    return this.apiCall(endpoint, {
      method: 'PUT'
    })
    .catch(function(error) {
      console.error('Error marking notification as read:', error);
      throw new Error('ไม่สามารถอัปเดตสถานะการแจ้งเตือนได้');
    });
  };

  /**
   * Get user profile
   */
  ApiService.prototype.getUserProfile = function() {
    return this.apiCall(API_CONFIG.ENDPOINTS.GET_PROFILE)
      .catch(function(error) {
        console.error('Error fetching user profile:', error);
        throw new Error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
      });
  };

  /**
   * Update user profile
   */
  ApiService.prototype.updateUserProfile = function(profileData) {
    return this.apiCall(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
    .catch(function(error) {
      console.error('Error updating user profile:', error);
      throw new Error('ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้');
    });
  };

  /**
   * Get template download URL
   */
  ApiService.prototype.getTemplateDownloadUrl = function(templateType) {
    const endpoint = API_CONFIG.ENDPOINTS.DOWNLOAD_TEMPLATE.replace(':type', templateType);
    return this.baseURL + endpoint;
  };

  /**
   * Get document download URL
   */
  ApiService.prototype.getDocumentDownloadUrl = function(documentPath) {
    // If it's already a full URL, return as is
    if (documentPath.indexOf('http') === 0) {
      return documentPath;
    }
    // Otherwise, construct the full URL
    return this.baseURL + documentPath;
  };

  /**
   * Send message to staff
   */
  ApiService.prototype.sendMessageToStaff = function(subject, message) {
    return this.apiCall('/messages', {
      method: 'POST',
      body: JSON.stringify({ subject: subject, message: message })
    })
    .catch(function(error) {
      console.error('Error sending message:', error);
      throw new Error('ไม่สามารถส่งข้อความได้');
    });
  };

  /**
   * Get all proposals for user
   */
  ApiService.prototype.getAllProposals = function() {
    return this.apiCall('/proposals/my-proposals')
      .catch(function(error) {
        console.error('Error fetching all proposals:', error);
        throw new Error('ไม่สามารถดึงข้อมูลโครงการทั้งหมดได้');
      });
  };

  /**
   * Get proposal by ID
   */
  ApiService.prototype.getProposalById = function(proposalId) {
    return this.apiCall('/proposals/' + proposalId)
      .catch(function(error) {
        console.error('Error fetching proposal:', error);
        throw new Error('ไม่สามารถดึงข้อมูลโครงการได้');
      });
  };

  // Create singleton instance
  const apiService = new ApiService();

  // Export API functions
  global.SimUser.api = {
    apiCall: function(endpoint, options) { return apiService.apiCall(endpoint, options); },
    getProposalData: function() { return apiService.getProposalData(); },
    submitProposal: function(formData) { return apiService.submitProposal(formData); },
    updateProposal: function(proposalId, data) { return apiService.updateProposal(proposalId, data); },
    uploadPresentationFile: function(proposalId, file) { return apiService.uploadPresentationFile(proposalId, file); },
    getNotifications: function(params) { return apiService.getNotifications(params); },
    markNotificationAsRead: function(notificationId) { return apiService.markNotificationAsRead(notificationId); },
    getUserProfile: function() { return apiService.getUserProfile(); },
    updateUserProfile: function(profileData) { return apiService.updateUserProfile(profileData); },
    getTemplateDownloadUrl: function(type) { return apiService.getTemplateDownloadUrl(type); },
    getDocumentDownloadUrl: function(path) { return apiService.getDocumentDownloadUrl(path); },
    sendMessageToStaff: function(subject, message) { return apiService.sendMessageToStaff(subject, message); },
    getAllProposals: function() { return apiService.getAllProposals(); },
    getProposalById: function(proposalId) { return apiService.getProposalById(proposalId); }
  };
  
})(window);