// auth.js - Authentication Module (IIFE Version)

(function(global) {
  'use strict';
  
  // Get dependencies from global namespace
  const API_CONFIG = global.SimUser.API_CONFIG;
  const STORAGE_KEYS = global.SimUser.STORAGE_KEYS;
  const ROUTES = global.SimUser.ROUTES;
  
  // AuthManager Class
  function AuthManager() {
    this.token = null;
    this.userData = null;
    this.tokenCheckInterval = null;
  }

  /**
   * Initialize authentication
   */
  AuthManager.prototype.initialize = function() {
    const self = this;
    
    return new Promise(function(resolve, reject) {
      self.token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (storedUserData) {
        try {
          self.userData = JSON.parse(storedUserData);
        } catch (e) {
          console.error('Error parsing stored user data:', e);
          self.userData = null;
        }
      }
      
      if (self.token) {
        self.validateToken()
          .then(function(isValid) {
            if (!isValid) {
              self.clearAuth();
              resolve(false);
            } else {
              self.startTokenCheck();
              resolve(true);
            }
          })
          .catch(function(error) {
            console.error('Token validation error:', error);
            resolve(false);
          });
      } else {
        resolve(false);
      }
    });
  };

  /**
   * Validate current token
   */
  AuthManager.prototype.validateToken = function() {
    const self = this;
    
    if (!this.token) return Promise.resolve(false);
    
    return fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.VALIDATE_TOKEN, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + this.token
      }
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data.success && data.user) {
        self.userData = data.user;
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
        return true;
      }
      return false;
    })
    .catch(function(error) {
      console.error('Token validation error:', error);
      return false;
    });
  };

  /**
   * Login user
   */
  AuthManager.prototype.login = function(username, password) {
    const self = this;
    
    return fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username, password: password })
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data.success && data.token) {
        self.token = data.token;
        self.userData = data.user;
        
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
        
        self.startTokenCheck();
        return { success: true, user: data.user };
      }
      
      return { success: false, message: data.message || 'เข้าสู่ระบบไม่สำเร็จ' };
    })
    .catch(function(error) {
      console.error('Login error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
    });
  };

  /**
   * Logout user
   */
  AuthManager.prototype.logout = function() {
    const self = this;
    
    const logoutPromise = this.token
      ? fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.LOGOUT, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + this.token
          }
        }).catch(function(error) {
          console.error('Logout error:', error);
        })
      : Promise.resolve();
    
    return logoutPromise.then(function() {
      self.clearAuth();
      window.location.href = ROUTES.LOGIN;
    });
  };

  /**
   * Clear authentication data
   */
  AuthManager.prototype.clearAuth = function() {
    this.token = null;
    this.userData = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    this.stopTokenCheck();
  };

  /**
   * Check if user is authenticated
   */
  AuthManager.prototype.isAuthenticated = function() {
    return !!this.token;
  };

  /**
   * Get current user data
   */
  AuthManager.prototype.getUserData = function() {
    return this.userData;
  };

  /**
   * Get authentication token
   */
  AuthManager.prototype.getToken = function() {
    return this.token;
  };

  /**
   * Check if user has specific role
   */
  AuthManager.prototype.hasRole = function(role) {
    return this.userData && this.userData.role === role;
  };

  /**
   * Check if user is admin
   */
  AuthManager.prototype.isAdmin = function() {
    return this.hasRole('admin');
  };

  /**
   * Check if user has proposal
   */
  AuthManager.prototype.hasProposal = function() {
    return this.userData && this.userData.proposals;
  };

  /**
   * Update user data
   */
  AuthManager.prototype.updateUserData = function(userData) {
    this.userData = Object.assign({}, this.userData, userData);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(this.userData));
  };

  /**
   * Start periodic token validation
   */
  AuthManager.prototype.startTokenCheck = function() {
    const self = this;
    this.stopTokenCheck();
    
    // Check token every 5 minutes
    this.tokenCheckInterval = setInterval(function() {
      self.validateToken().then(function(isValid) {
        if (!isValid) {
          self.clearAuth();
          window.location.href = ROUTES.LOGIN;
        }
      });
    }, 5 * 60 * 1000);
  };

  /**
   * Stop periodic token validation
   */
  AuthManager.prototype.stopTokenCheck = function() {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
  };

  /**
   * Handle authentication error
   */
  AuthManager.prototype.handleAuthError = function(error) {
    console.error('Authentication error:', error);
    
    if (error.status === 401) {
      this.clearAuth();
      window.location.href = ROUTES.LOGIN;
      return;
    }
    
    throw error;
  };

  /**
   * Require authentication
   */
  AuthManager.prototype.requireAuth = function() {
    if (!this.isAuthenticated()) {
      window.location.href = ROUTES.LOGIN;
      return false;
    }
    return true;
  };

  /**
   * Require admin role
   */
  AuthManager.prototype.requireAdmin = function() {
    if (!this.isAdmin()) {
      window.location.href = ROUTES.HOME;
      return false;
    }
    return true;
  };

  // Create singleton instance
  const authManager = new AuthManager();

  // Export functions
  global.SimUser.auth = {
    initialize: function() { return authManager.initialize(); },
    validateToken: function() { return authManager.validateToken(); },
    login: function(username, password) { return authManager.login(username, password); },
    logout: function() { return authManager.logout(); },
    isAuthenticated: function() { return authManager.isAuthenticated(); },
    getUserData: function() { return authManager.getUserData(); },
    getToken: function() { return authManager.getToken(); },
    hasRole: function(role) { return authManager.hasRole(role); },
    isAdmin: function() { return authManager.isAdmin(); },
    hasProposal: function() { return authManager.hasProposal(); },
    updateUserData: function(data) { return authManager.updateUserData(data); },
    requireAuth: function() { return authManager.requireAuth(); },
    requireAdmin: function() { return authManager.requireAdmin(); },
    handleAuthError: function(error) { return authManager.handleAuthError(error); }
  };
  
})(window);