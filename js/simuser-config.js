// config.js - Configuration for SimUser Application (IIFE Version)
// ไม่ต้องใช้ build tools, ทำงานได้ในทุก browser

(function(global) {
  'use strict';
  
  // Configuration object
  const CONFIG = {
    // API Configuration
    API: {
      BASE_URL: 'https://adicet.cmru.ac.th/node/api',
      TIMEOUT: 30000,
      ENDPOINTS: {
        // Auth endpoints
        LOGIN: '/auth/login',
        VALIDATE_TOKEN: '/auth/validate',
        LOGOUT: '/auth/logout',
        
        // Proposal endpoints
        GET_MY_PROPOSAL: '/getmyproposal',
        SUBMIT_PROPOSAL: '/proposals',
        UPDATE_PROPOSAL: '/proposals/:id',
        UPLOAD_PRESENTATION: '/proposals/:id/presentation',
        
        // Notification endpoints
        GET_NOTIFICATIONS: '/notifications',
        MARK_AS_READ: '/notifications/read/:id',
        
        // User endpoints
        GET_PROFILE: '/users/profile',
        UPDATE_PROFILE: '/users/profile',
        
        // Document endpoints
        DOWNLOAD_TEMPLATE: '/templates/:type',
      }
    },
    
    // Application Settings
    APP: {
      NAME: 'ระบบจัดการโครงการนวัตกรรมเพื่อสังคม',
      SHORT_NAME: 'SIMS',
      VERSION: '1.0.0',
      SUPPORT_EMAIL: 'sidcmru@g.cmru.ac.th',
      SUPPORT_PHONE: '(+66) 65-0161100',
    },
    
    // File Upload Settings
    UPLOAD: {
      MAX_FILE_SIZE: 15 * 1024 * 1024, // 15MB
      ALLOWED_EXTENSIONS: {
        PROPOSAL: ['.doc', '.docx', '.pdf'],
        PRESENTATION: ['.ppt', '.pptx', '.pdf'],
        BUSINESS: ['.pdf', '.jpg', '.jpeg', '.png'],
      },
      ALLOWED_MIME_TYPES: {
        PROPOSAL: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/pdf'
        ],
        PRESENTATION: [
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/pdf'
        ],
        BUSINESS: [
          'application/pdf',
          'image/jpeg',
          'image/png'
        ]
      }
    },
    
    // Status Configuration
    STATUS: {
      WAITING: {
        key: 'waiting',
        title: 'รอการตรวจรับ',
        icon: 'fas fa-hourglass-half',
        color: '#ffc107',
        description: 'โครงการของคุณกำลังอยู่ในขั้นตอนการตรวจรับโดยเจ้าหน้าที่ กรุณารอการติดต่อกลับภายใน 7-14 วันทำการ'
      },
      REVIEWING: {
        key: 'reviewing',
        title: 'เจ้าหน้าที่ตรวจรับแล้ว',
        icon: 'fas fa-clipboard-check',
        color: '#17a2b8',
        description: 'เจ้าหน้าที่ได้ตรวจรับโครงการของคุณเรียบร้อยแล้ว และอยู่ระหว่างการพิจารณาเพื่อนำเสนอต่อคณะกรรมการ'
      },
      PREPARING: {
        key: 'preparing',
        title: 'เตรียมข้อมูลนำเสนอ',
        icon: 'fas fa-laptop-code',
        color: '#6610f2',
        description: 'โครงการของคุณได้รับการคัดเลือกให้นำเสนอต่อคณะกรรมการ กรุณาเตรียมข้อมูลสำหรับการนำเสนอตามแบบฟอร์มที่กำหนด'
      },
      APPROVED: {
        key: 'approved',
        title: 'อนุมัติโครงการ',
        icon: 'fas fa-check-circle',
        color: '#28a745',
        description: 'ยินดีด้วย! โครงการของคุณได้รับการอนุมัติเรียบร้อยแล้ว ท่านจะได้รับการติดต่อเพื่อดำเนินการในขั้นตอนต่อไป'
      },
      REJECTED: {
        key: 'rejected',
        title: 'ไม่ผ่านการอนุมัติ',
        icon: 'fas fa-times-circle',
        color: '#dc3545',
        description: 'ขออภัย โครงการของคุณไม่ผ่านการอนุมัติในครั้งนี้ กรุณาตรวจสอบข้อเสนอแนะจากคณะกรรมการด้านล่าง'
      }
    },
    
    // UI Settings
    UI: {
      LOADING_DELAY: 300,
      ALERT_DURATION: 5000,
      ANIMATION_DURATION: 300,
      DEBOUNCE_DELAY: 500,
      DATE_FORMAT: {
        SHORT: { day: '2-digit', month: 'short', year: 'numeric' },
        LONG: { day: '2-digit', month: '2-digit', year: 'numeric' },
        FULL: { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }
      }
    },
    
    // Local Storage Keys
    STORAGE: {
      AUTH_TOKEN: 'authToken',
      USER_DATA: 'userData',
      DRAFT_PROPOSAL: 'draftProposal',
      UI_PREFERENCES: 'uiPreferences',
    },
    
    // Routes
    ROUTES: {
      HOME: '/simuser/',
      LOGIN: '/sims/login',
      SUBMIT: '/simuser/submit',
      PROPOSALS: '/simuser/proposals',
      PROFILE: '/simuser/profile',
      ADMIN: '/sims/admin',
    },
    
    // Innovation Types
    INNOVATION_TYPES: [
      'นวัตกรรมทางสังคม',
      'นวัตกรรมด้านการศึกษา',
      'นวัตกรรมด้านสาธารณสุข',
      'นวัตกรรมด้านสิ่งแวดล้อม',
      'นวัตกรรมด้านเทคโนโลยี',
      'นวัตกรรมด้านเกษตรกรรม',
      'นวัตกรรมด้านอื่นๆ'
    ],
    
    // Thai Provinces
    PROVINCES: [
      'เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน',
      'น่าน', 'พะเยา', 'แพร่', 'อุตรดิตถ์'
    ]
  };
  
  // Create namespace
  global.SimUser = global.SimUser || {};
  
  // Export configuration
  global.SimUser.CONFIG = CONFIG;
  global.SimUser.API_CONFIG = CONFIG.API;
  global.SimUser.APP_CONFIG = CONFIG.APP;
  global.SimUser.STATUS_CONFIG = CONFIG.STATUS;
  global.SimUser.UI_CONFIG = CONFIG.UI;
  global.SimUser.STORAGE_KEYS = CONFIG.STORAGE;
  global.SimUser.ROUTES = CONFIG.ROUTES;
  global.SimUser.UPLOAD = CONFIG.UPLOAD;
  global.SimUser.INNOVATION_TYPES = CONFIG.INNOVATION_TYPES;
  global.SimUser.PROVINCES = CONFIG.PROVINCES;
  
})(window);