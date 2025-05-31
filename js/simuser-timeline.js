// timeline.js - Timeline Module (IIFE Version)

(function(global) {
  'use strict';
  
  // Get dependencies from global namespace
  const utils = global.SimUser.utils;
  const status = global.SimUser.status;
  
  // TimelineManager Class
  function TimelineManager() {
    this.timelineContainer = null;
    this.timelineItems = [];
  }

  /**
   * Initialize timeline
   */
  TimelineManager.prototype.initialize = function() {
    this.timelineContainer = document.getElementById('projectTimeline');
  };

  /**
   * Render timeline
   */
  TimelineManager.prototype.renderTimeline = function(statusHistory) {
    if (!this.timelineContainer) return;
    
    this.timelineContainer.innerHTML = '';
    this.timelineItems = [];
    
    if (!statusHistory || statusHistory.length === 0) {
      // Create default timeline entry
      this.createDefaultTimeline();
      return;
    }
    
    // Sort timeline items by date (oldest to newest)
    const sortedHistory = this.sortTimelineItems(statusHistory);
    
    // Create timeline items
    const self = this;
    sortedHistory.forEach(function(item) {
      const timelineElement = self.createTimelineItem(item);
      self.timelineContainer.appendChild(timelineElement);
      self.timelineItems.push(item);
    });
    
    // Add animation
    this.animateTimeline();
  };

  /**
   * Create default timeline when no history
   */
  TimelineManager.prototype.createDefaultTimeline = function() {
    const defaultItem = {
      status: 'waiting',
      status_date: new Date().toISOString(),
      remarks: 'ส่งข้อเสนอโครงการเรียบร้อยแล้ว กำลังรอการตรวจรับโดยเจ้าหน้าที่',
      updated_by_name: 'ระบบ'
    };
    
    const timelineElement = this.createTimelineItem(defaultItem);
    this.timelineContainer.appendChild(timelineElement);
    this.timelineItems.push(defaultItem);
  };

  /**
   * Sort timeline items by date
   */
  TimelineManager.prototype.sortTimelineItems = function(items) {
    return items.slice().sort(function(a, b) {
      return new Date(a.status_date) - new Date(b.status_date);
    });
  };

  /**
   * Create timeline item element
   */
  TimelineManager.prototype.createTimelineItem = function(item) {
    const element = document.createElement('div');
    element.className = 'timeline-item';
    element.setAttribute('data-status', item.status);
    
    const icon = this.getTimelineIcon(item.status);
    const date = utils.formatDate(new Date(item.status_date));
    const message = item.remarks || status.getStatusMessage(item.status);
    const updatedBy = item.updated_by_name || 'ระบบ';
    
    element.innerHTML = '\
      <div class="timeline-icon ' + item.status + '">\
        <i class="' + icon + '"></i>\
      </div>\
      <div class="timeline-date">' + date + '</div>\
      <div class="timeline-content">\
        <p class="mb-0">' + message + '</p>\
        <small class="text-muted">โดย: ' + updatedBy + '</small>\
      </div>\
    ';
    
    return element;
  };

  /**
   * Get timeline icon based on status
   */
  TimelineManager.prototype.getTimelineIcon = function(statusValue) {
    const statusIcons = {
      'waiting': 'fas fa-hourglass-half',
      'reviewing': 'fas fa-clipboard-check',
      'preparing': 'fas fa-laptop-code',
      'approved': 'fas fa-check-circle',
      'rejected': 'fas fa-times-circle',
      'resubmitted': 'fas fa-redo',
      'completed': 'fas fa-flag-checkered'
    };
    
    return statusIcons[statusValue] || 'fas fa-circle';
  };

  /**
   * Animate timeline on render
   */
  TimelineManager.prototype.animateTimeline = function() {
    const items = this.timelineContainer.querySelectorAll('.timeline-item');
    
    items.forEach(function(item, index) {
      setTimeout(function() {
        item.classList.add('animate-in');
      }, index * 100);
    });
  };

  /**
   * Add new timeline item
   */
  TimelineManager.prototype.addTimelineItem = function(newItem) {
    if (!this.timelineContainer) return;
    
    const element = this.createTimelineItem(newItem);
    const newDate = new Date(newItem.status_date);
    
    // Insert at the correct position based on date
    const existingItems = this.timelineContainer.querySelectorAll('.timeline-item');
    let inserted = false;
    
    const self = this;
    existingItems.forEach(function(existing) {
      if (!inserted) {
        const existingDate = self.getItemDate(existing);
        if (newDate < existingDate) {
          existing.parentNode.insertBefore(element, existing);
          inserted = true;
        }
      }
    });
    
    if (!inserted) {
      this.timelineContainer.appendChild(element);
    }
    
    // Add animation
    setTimeout(function() {
      element.classList.add('animate-in');
    }, 100);
    
    // Update internal array
    this.timelineItems.push(newItem);
    this.timelineItems = this.sortTimelineItems(this.timelineItems);
  };

  /**
   * Get date from timeline item element
   */
  TimelineManager.prototype.getItemDate = function(element) {
    const dateText = element.querySelector('.timeline-date').textContent;
    // This is a simplified version - in production, you'd store the actual date
    return new Date();
  };

  /**
   * Filter timeline by status
   */
  TimelineManager.prototype.filterByStatus = function(filterStatus) {
    const items = this.timelineContainer.querySelectorAll('.timeline-item');
    
    items.forEach(function(item) {
      const itemStatus = item.getAttribute('data-status');
      if (filterStatus === 'all' || itemStatus === filterStatus) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  };

  /**
   * Highlight specific timeline item
   */
  TimelineManager.prototype.highlightItem = function(statusValue) {
    const items = this.timelineContainer.querySelectorAll('.timeline-item');
    
    items.forEach(function(item) {
      const itemStatus = item.getAttribute('data-status');
      if (itemStatus === statusValue) {
        item.classList.add('highlighted');
      } else {
        item.classList.remove('highlighted');
      }
    });
  };

  /**
   * Get timeline summary
   */
  TimelineManager.prototype.getTimelineSummary = function() {
    if (this.timelineItems.length === 0) return null;
    
    const firstItem = this.timelineItems[0];
    const lastItem = this.timelineItems[this.timelineItems.length - 1];
    
    return {
      startDate: new Date(firstItem.status_date),
      lastUpdate: new Date(lastItem.status_date),
      totalSteps: this.timelineItems.length,
      currentStatus: lastItem.status
    };
  };

  /**
   * Export timeline data
   */
  TimelineManager.prototype.exportTimelineData = function() {
    return this.timelineItems.map(function(item) {
      return {
        status: item.status,
        date: utils.formatDate(new Date(item.status_date)),
        message: item.remarks || status.getStatusMessage(item.status),
        updatedBy: item.updated_by_name || 'ระบบ'
      };
    });
  };

  /**
   * Clear timeline
   */
  TimelineManager.prototype.clearTimeline = function() {
    if (this.timelineContainer) {
      this.timelineContainer.innerHTML = '';
    }
    this.timelineItems = [];
  };

  /**
   * Show timeline loading state
   */
  TimelineManager.prototype.showLoading = function() {
    if (!this.timelineContainer) return;
    
    this.timelineContainer.innerHTML = '\
      <div class="text-center py-4">\
        <div class="spinner-border text-primary" role="status">\
          <span class="visually-hidden">กำลังโหลด...</span>\
        </div>\
        <p class="mt-2 text-muted">กำลังโหลดประวัติการดำเนินการ...</p>\
      </div>\
    ';
  };

  /**
   * Show timeline error state
   */
  TimelineManager.prototype.showError = function(message) {
    message = message || 'ไม่สามารถโหลดประวัติการดำเนินการได้';
    
    if (!this.timelineContainer) return;
    
    this.timelineContainer.innerHTML = '\
      <div class="alert alert-danger">\
        <i class="fas fa-exclamation-circle me-2"></i>\
        ' + message + '\
      </div>\
    ';
  };

  // Create singleton instance
  const timelineManager = new TimelineManager();

  // Export timeline functions
  global.SimUser.timeline = {
    initialize: function() { return timelineManager.initialize(); },
    renderTimeline: function(statusHistory) { return timelineManager.renderTimeline(statusHistory); },
    addTimelineItem: function(item) { return timelineManager.addTimelineItem(item); },
    filterByStatus: function(status) { return timelineManager.filterByStatus(status); },
    highlightItem: function(status) { return timelineManager.highlightItem(status); },
    getTimelineSummary: function() { return timelineManager.getTimelineSummary(); },
    exportTimelineData: function() { return timelineManager.exportTimelineData(); },
    clearTimeline: function() { return timelineManager.clearTimeline(); },
    showLoading: function() { return timelineManager.showLoading(); },
    showError: function(message) { return timelineManager.showError(message); }
  };
  
})(window);