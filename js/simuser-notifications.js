// notifications.js - Notifications Module (IIFE Version)

(function(global) {
  'use strict';
  
  // Get dependencies from global namespace
  const api = global.SimUser.api;
  const utils = global.SimUser.utils;
  const status = global.SimUser.status;
  const ui = global.SimUser.ui;
  
  // NotificationManager Class
  function NotificationManager() {
    this.notifications = [];
    this.unreadCount = 0;
    this.container = null;
  }

  /**
   * Initialize notifications
   */
  NotificationManager.prototype.initialize = function() {
    this.container = document.getElementById('notificationsContainer');
  };

  /**
   * Render notifications
   */
  NotificationManager.prototype.renderNotifications = function(notifications) {
    if (!this.container) return;
    
    const self = this;
    
    return new Promise(function(resolve) {
      self.notifications = notifications || [];
      self.container.innerHTML = '';
      
      if (self.notifications.length === 0) {
        self.showEmptyState();
        resolve();
        return;
      }
      
      // Sort by date (newest first)
      self.notifications.sort(function(a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      // Count unread
      self.unreadCount = self.notifications.filter(function(n) {
        return !n.is_read;
      }).length;
      self.updateUnreadBadge();
      
      // Create notification cards
      self.notifications.forEach(function(notification) {
        const card = self.createNotificationCard(notification);
        self.container.appendChild(card);
      });
      
      resolve();
    });
  };

  /**
   * Show empty state
   */
  NotificationManager.prototype.showEmptyState = function() {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'text-muted text-center';
    emptyMessage.textContent = 'ไม่มีการแจ้งเตือน';
    this.container.appendChild(emptyMessage);
  };

  /**
   * Create notification card
   */
  NotificationManager.prototype.createNotificationCard = function(notification) {
    const self = this;
    const card = document.createElement('div');
    card.className = 'notification-card ' + (notification.is_read ? '' : 'unread');
    card.setAttribute('data-id', notification.id);
    
    const title = status.getNotificationTitle(notification.status);
    const time = utils.formatDateShort(new Date(notification.created_at));
    
    card.innerHTML = '\
      <div class="notification-title">\
        <span>' + title + '</span>\
        <span class="notification-time">' + time + '</span>\
      </div>\
      <div class="notification-content">' + notification.message + '</div>\
    ';
    
    // Add click handler for unread notifications
    if (!notification.is_read) {
      card.addEventListener('click', function() {
        self.handleNotificationClick(notification);
      });
    }
    
    return card;
  };

  /**
   * Handle notification click
   */
  NotificationManager.prototype.handleNotificationClick = function(notification) {
    if (notification.is_read) return;
    
    const self = this;
    
    api.markNotificationAsRead(notification.id)
      .then(function(result) {
        if (result.success) {
          // Update UI
          const card = document.querySelector('[data-id="' + notification.id + '"]');
          if (card) {
            card.classList.remove('unread');
          }
          
          // Update notification object
          notification.is_read = true;
          
          // Update unread count
          self.unreadCount--;
          self.updateUnreadBadge();
        }
      })
      .catch(function(error) {
        console.error('Error marking notification as read:', error);
      });
  };

  /**
   * Update unread badge
   */
  NotificationManager.prototype.updateUnreadBadge = function() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  };

  /**
   * Get unread count
   */
  NotificationManager.prototype.getUnreadCount = function() {
    return this.unreadCount;
  };

  /**
   * Mark all as read
   */
  NotificationManager.prototype.markAllAsRead = function() {
    const self = this;
    const unreadNotifications = this.notifications.filter(function(n) {
      return !n.is_read;
    });
    
    if (unreadNotifications.length === 0) return Promise.resolve(true);
    
    // Mark each notification as read
    const promises = unreadNotifications.map(function(n) {
      return api.markNotificationAsRead(n.id);
    });
    
    return Promise.all(promises)
      .then(function() {
        // Update UI
        const cards = document.querySelectorAll('.notification-card.unread');
        cards.forEach(function(card) {
          card.classList.remove('unread');
        });
        
        // Update notifications
        self.notifications.forEach(function(n) {
          n.is_read = true;
        });
        
        // Reset unread count
        self.unreadCount = 0;
        self.updateUnreadBadge();
        
        return true;
      })
      .catch(function(error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      });
  };

  /**
   * Refresh notifications
   */
  NotificationManager.prototype.refreshNotifications = function() {
    const self = this;
    
    return api.getNotifications()
      .then(function(data) {
        if (data.success && data.notifications) {
          return self.renderNotifications(data.notifications);
        }
      })
      .catch(function(error) {
        console.error('Error refreshing notifications:', error);
      });
  };

  /**
   * Add new notification (for real-time updates)
   */
  NotificationManager.prototype.addNotification = function(notification) {
    this.notifications.unshift(notification);
    
    if (!notification.is_read) {
      this.unreadCount++;
      this.updateUnreadBadge();
    }
    
    // Re-render notifications
    this.renderNotifications(this.notifications);
    
    // Show toast notification
    if (ui) {
      ui.showToast(notification.message, 'info');
    }
  };

  /**
   * Filter notifications by status
   */
  NotificationManager.prototype.filterByStatus = function(filterStatus) {
    const filtered = filterStatus === 'all' 
      ? this.notifications 
      : this.notifications.filter(function(n) {
          return n.status === filterStatus;
        });
    
    this.renderFilteredNotifications(filtered);
  };

  /**
   * Render filtered notifications
   */
  NotificationManager.prototype.renderFilteredNotifications = function(notifications) {
    if (!this.container) return;
    
    const self = this;
    this.container.innerHTML = '';
    
    if (notifications.length === 0) {
      this.showEmptyState();
      return;
    }
    
    notifications.forEach(function(notification) {
      const card = self.createNotificationCard(notification);
      self.container.appendChild(card);
    });
  };

  /**
   * Search notifications
   */
  NotificationManager.prototype.searchNotifications = function(query) {
    if (!query) {
      this.renderNotifications(this.notifications);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = this.notifications.filter(function(n) {
      return n.message.toLowerCase().indexOf(lowerQuery) !== -1 ||
             status.getNotificationTitle(n.status).toLowerCase().indexOf(lowerQuery) !== -1;
    });
    
    this.renderFilteredNotifications(filtered);
  };

  /**
   * Delete notification
   */
  NotificationManager.prototype.deleteNotification = function(notificationId) {
    const self = this;
    
    return new Promise(function(resolve) {
      // In a real app, this would call an API
      // For now, just remove from local array
      self.notifications = self.notifications.filter(function(n) {
        return n.id !== notificationId;
      });
      
      // Re-render
      self.renderNotifications(self.notifications);
      
      resolve(true);
    }).catch(function(error) {
      console.error('Error deleting notification:', error);
      return false;
    });
  };

  /**
   * Get notification by ID
   */
  NotificationManager.prototype.getNotificationById = function(notificationId) {
    return this.notifications.find(function(n) {
      return n.id === notificationId;
    });
  };

  /**
   * Clear all notifications
   */
  NotificationManager.prototype.clearAllNotifications = function() {
    const self = this;
    
    return new Promise(function(resolve) {
      // In a real app, this would call an API
      self.notifications = [];
      self.unreadCount = 0;
      self.updateUnreadBadge();
      self.renderNotifications([]);
      
      resolve(true);
    }).catch(function(error) {
      console.error('Error clearing notifications:', error);
      return false;
    });
  };

  // Create singleton instance
  const notificationManager = new NotificationManager();

  // Export notification functions
  global.SimUser.notifications = {
    initialize: function() { return notificationManager.initialize(); },
    renderNotifications: function(notifications) { return notificationManager.renderNotifications(notifications); },
    markAllAsRead: function() { return notificationManager.markAllAsRead(); },
    refreshNotifications: function() { return notificationManager.refreshNotifications(); },
    addNotification: function(notification) { return notificationManager.addNotification(notification); },
    filterByStatus: function(status) { return notificationManager.filterByStatus(status); },
    searchNotifications: function(query) { return notificationManager.searchNotifications(query); },
    deleteNotification: function(id) { return notificationManager.deleteNotification(id); },
    getUnreadCount: function() { return notificationManager.getUnreadCount(); },
    clearAllNotifications: function() { return notificationManager.clearAllNotifications(); }
  };
  
})(window);