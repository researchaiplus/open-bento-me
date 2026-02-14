export const Z_INDEX = {
  // 基础层
  BASE: 0,
  
  // 内容层 (1-39)
  PROFILE: 20,
  
  // 导航层 (40-49)
  SIDEBAR: 40,
  SIDEBAR_CONTENT: 45,
  
  // 移动端底部导航
  BOTTOM_NAV: 45,
  
  // 浮层组件 (50-99)
  TOOLTIP: 100,
  DROPDOWN: 50,
  POPOVER: 50,
  DIALOG: 50,
  DIALOG_CONTENT: 51,
  POPOVER_IN_DIALOG: 52,
  HOVER_CARD: 50,
  SHEET: 50,
  CONTEXT_MENU: 50,
  
  // 浮动工具栏 (90-99)
  FLOATING_TOOLBAR: 90,
  FLOATING_TOOLBAR_CONTENT: 95,
  
  // 模态框层 (100-999)
  MODAL_OVERLAY: 100,
  MODAL_CONTENT: 110,
  SOCIAL_LINKS_DIALOG: 100,
  
  // 分享对话框 - 需要在其他对话框之上
  SHARE_DIALOG: 120,
  
  // 引导教程层 (介于导航与底部工具栏之间)
  PROFILE_GUIDE_OVERLAY: 950,
  PROFILE_GUIDE_CONTENT: 960,
  
  // 底部工具栏 - 需要在引导教程之上
  BOTTOM_TOOLBAR: 999,
  
  // 全局提示层 (1000+)
  TOAST: 1000,
  ALERT_DIALOG: 1100,
} as const 