import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    common: {
      ok: 'OK',
      cancel: 'Cancel',
      skip: 'Skip',
      next: 'Next',
      getStarted: 'Get Started',
      back: 'Back',
      close: 'Close',
      delete: 'Delete',
      confirm: 'Confirm',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      edit: 'Edit',
      done: 'Done',
      continue: 'Continue'
    },
    auth: {
      title: 'Only You',
      subtitle: 'Sign in to connect with your love',
      signInWithGoogle: 'Sign in with Google',
      signInWithApple: 'Sign in with Apple',
      signOut: 'Sign Out',
      signOutConfirm: 'Are you sure you want to sign out?',
      signOutDescription: 'Sign out from the app',
      termsText: 'By signing in, you agree to our Terms of Service and Privacy Policy',
      signInFailed: 'Sign in failed',
      signOutFailed: 'Sign out failed. Please try again.'
    },
    settings: {
      title: 'Settings',
      account: 'Account',
      language: 'Language',
      selectLanguage: 'Select Language',
      languageChanged: 'Language changed',
      languageChangedDesc: 'Changed to {language}. The app will restart to apply changes.',
      notifications: 'Notifications',
      pushNotifications: 'Push Notifications',
      pushNotificationsDesc: 'Get notified when your partner sends a message',
      appearance: 'Appearance',
      darkMode: 'Dark Mode',
      darkModeDesc: 'Use dark interface to protect your eyes',
      privacy: 'Privacy & Security',
      readReceipts: 'Read Receipts',
      readReceiptsDesc: 'Let your partner know when you read messages',
      dataStorage: 'Data & Storage',
      autoBackup: 'Auto Backup',
      autoBackupDesc: 'Automatically backup your messages',
      exportMessages: 'Export Messages',
      exportMessagesDesc: 'Download chat history',
      createBackup: 'Create Backup',
      createBackupDesc: 'Manually backup messages',
      clearAllMessages: 'Clear All Messages',
      clearAllMessagesDesc: 'Permanently delete all messages',
      accountManagement: 'Account Management',
      deleteAccount: 'Delete Account Permanently',
      deleteAccountDesc: 'Completely delete account and all data',
      about: 'About',
      aboutApp: 'About Only You',
      aboutAppDesc: 'Version 1.0.0 • Made with ❤️',
      footerText: 'Only You is designed for two people who want complete privacy in communication. Your messages are encrypted and stored only on your device.'
    },
    history: {
      title: 'Connection History',
      totalSessions: 'Total sessions',
      totalTime: 'Total time',
      buzzCalls: 'Buzz calls',
      sessionDetail: 'Session Detail',
      deleteSession: 'Delete Session?',
      deleteSessionDesc: 'Are you sure you want to delete this session from history?',
      activeSession: 'Active Session',
      activeSessionDesc: 'Cannot view details of active connection session.',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connectionTime: 'Connection Time',
      started: 'Started',
      ended: 'Ended',
      exactDuration: 'Exact duration',
      sessionStats: 'Session Stats',
      messages: 'Messages',
      calls: 'Calls',
      videoCalls: 'Video calls',
      reactions: 'Reactions',
      inDevelopment: 'In development'
    },
    onboarding: {
      madeForTwo: 'Made for Two Hearts',
      madeForTwoDesc: 'A private messaging app designed exclusively for couples. No groups, no strangers - just you and your special person.',
      encrypted: 'End-to-End Encrypted',
      encryptedDesc: 'All your messages and calls are encrypted with military-grade security. Only you and your partner can read your conversations.',
      messaging: 'Real-time Messaging',
      messagingDesc: 'Send messages instantly with beautiful animations and read receipts. Express your love with emojis and heartfelt words.',
      calls: 'Voice & Video Calls',
      callsDesc: 'Crystal clear voice and video calls with your loved one. Feel close even when you\'re apart.',
      private: 'Completely Private',
      privateDesc: 'We don\'t store your messages or personal data. Your conversations stay between you and your partner forever.'
    }
  },
  vi: {
    common: {
      ok: 'Đồng ý',
      cancel: 'Hủy',
      skip: 'Bỏ qua',
      next: 'Tiếp theo',
      getStarted: 'Bắt đầu',
      back: 'Quay lại',
      close: 'Đóng',
      delete: 'Xóa',
      confirm: 'Xác nhận',
      loading: 'Đang tải...',
      error: 'Lỗi',
      success: 'Thành công',
      save: 'Lưu',
      edit: 'Chỉnh sửa',
      done: 'Hoàn thành',
      continue: 'Tiếp tục'
    },
    auth: {
      title: 'Only You',
      subtitle: 'Đăng nhập để kết nối với người yêu',
      signInWithGoogle: 'Đăng nhập với Google',
      signInWithApple: 'Đăng nhập với Apple',
      signOut: 'Đăng xuất',
      signOutConfirm: 'Bạn có chắc muốn đăng xuất?',
      signOutDescription: 'Đăng xuất khỏi ứng dụng',
      termsText: 'Bằng cách đăng nhập, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật của chúng tôi',
      signInFailed: 'Đăng nhập thất bại',
      signOutFailed: 'Không thể đăng xuất. Vui lòng thử lại.'
    },
    settings: {
      title: 'Cài đặt',
      account: 'Tài khoản',
      language: 'Ngôn ngữ',
      selectLanguage: 'Chọn ngôn ngữ',
      languageChanged: 'Ngôn ngữ đã thay đổi',
      languageChangedDesc: 'Đã chuyển sang {language}. Ứng dụng sẽ khởi động lại để áp dụng thay đổi.',
      notifications: 'Thông báo',
      pushNotifications: 'Thông báo đẩy',
      pushNotificationsDesc: 'Nhận thông báo khi đối tác gửi tin nhắn',
      appearance: 'Giao diện',
      darkMode: 'Chế độ tối',
      darkModeDesc: 'Sử dụng giao diện tối để bảo vệ mắt',
      privacy: 'Riêng tư & Bảo mật',
      readReceipts: 'Xác nhận đã đọc',
      readReceiptsDesc: 'Cho đối tác biết khi bạn đã đọc tin nhắn',
      dataStorage: 'Dữ liệu & Lưu trữ',
      autoBackup: 'Sao lưu tự động',
      autoBackupDesc: 'Tự động sao lưu tin nhắn của bạn',
      exportMessages: 'Xuất tin nhắn',
      exportMessagesDesc: 'Tải xuống lịch sử trò chuyện',
      createBackup: 'Tạo bản sao lưu',
      createBackupDesc: 'Sao lưu tin nhắn thủ công',
      clearAllMessages: 'Xóa tất cả tin nhắn',
      clearAllMessagesDesc: 'Xóa vĩnh viễn tất cả tin nhắn',
      accountManagement: 'Quản lý tài khoản',
      deleteAccount: 'Xóa tài khoản vĩnh viễn',
      deleteAccountDesc: 'Xóa hoàn toàn tài khoản và tất cả dữ liệu',
      about: 'Thông tin',
      aboutApp: 'Về Only You',
      aboutAppDesc: 'Phiên bản 1.0.0 • Được tạo với ❤️',
      footerText: 'Only You được thiết kế cho hai người muốn có sự riêng tư hoàn toàn trong giao tiếp. Tin nhắn của bạn được mã hóa và chỉ lưu trữ trên thiết bị của bạn.'
    },
    history: {
      title: 'Lịch sử kết nối',
      totalSessions: 'Tổng phiên',
      totalTime: 'Tổng thời gian',
      buzzCalls: 'Buzz calls',
      sessionDetail: 'Chi tiết phiên',
      deleteSession: 'Xóa phiên kết nối?',
      deleteSessionDesc: 'Bạn có chắc muốn xóa phiên kết nối này khỏi lịch sử?',
      activeSession: 'Phiên đang hoạt động',
      activeSessionDesc: 'Không thể xem chi tiết phiên đang kết nối.',
      connected: 'Đang kết nối',
      disconnected: 'Đã ngắt',
      connectionTime: 'Thời gian kết nối',
      started: 'Bắt đầu',
      ended: 'Kết thúc',
      exactDuration: 'Thời lượng chính xác',
      sessionStats: 'Thống kê phiên',
      messages: 'Tin nhắn',
      calls: 'Cuộc gọi',
      videoCalls: 'Video call',
      reactions: 'Reactions',
      inDevelopment: 'Đang phát triển'
    },
    onboarding: {
      madeForTwo: 'Được tạo cho hai trái tim',
      madeForTwoDesc: 'Ứng dụng nhắn tin riêng tư được thiết kế dành riêng cho các cặp đôi. Không có nhóm, không có người lạ - chỉ có bạn và người đặc biệt của bạn.',
      encrypted: 'Mã hóa đầu cuối',
      encryptedDesc: 'Tất cả tin nhắn và cuộc gọi của bạn đều được mã hóa với bảo mật cấp quân sự. Chỉ bạn và đối tác mới có thể đọc được cuộc trò chuyện.',
      messaging: 'Nhắn tin thời gian thực',
      messagingDesc: 'Gửi tin nhắn ngay lập tức với hiệu ứng đẹp mắt và xác nhận đã đọc. Thể hiện tình yêu bằng emoji và lời ngọt ngào.',
      calls: 'Gọi thoại & Video',
      callsDesc: 'Cuộc gọi thoại và video chất lượng cao với người yêu. Cảm thấy gần gũi ngay cả khi xa cách.',
      private: 'Hoàn toàn riêng tư',
      privateDesc: 'Chúng tôi không lưu trữ tin nhắn hay dữ liệu cá nhân của bạn. Cuộc trò chuyện chỉ tồn tại giữa bạn và đối tác mãi mãi.'
    }
  },
  ko: {
    common: {
      ok: '확인',
      cancel: '취소',
      skip: '건너뛰기',
      next: '다음',
      getStarted: '시작하기',
      back: '뒤로',
      close: '닫기',
      delete: '삭제',
      confirm: '확인',
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
      save: '저장',
      edit: '편집',
      done: '완료',
      continue: '계속'
    },
    auth: {
      title: 'Only You',
      subtitle: '사랑하는 사람과 연결하려면 로그인하세요',
      signInWithGoogle: 'Google로 로그인',
      signInWithApple: 'Apple로 로그인',
      signOut: '로그아웃',
      signOutConfirm: '정말 로그아웃하시겠습니까?',
      signOutDescription: '앱에서 로그아웃',
      termsText: '로그인하면 서비스 약관 및 개인정보 보호정책에 동의하는 것입니다',
      signInFailed: '로그인 실패',
      signOutFailed: '로그아웃할 수 없습니다. 다시 시도해주세요.'
    },
    settings: {
      title: '설정',
      account: '계정',
      language: '언어',
      selectLanguage: '언어 선택',
      languageChanged: '언어가 변경되었습니다',
      languageChangedDesc: '{language}로 변경되었습니다. 변경사항을 적용하기 위해 앱이 다시 시작됩니다.',
      notifications: '알림',
      pushNotifications: '푸시 알림',
      pushNotificationsDesc: '파트너가 메시지를 보낼 때 알림 받기',
      appearance: '외관',
      darkMode: '다크 모드',
      darkModeDesc: '눈을 보호하기 위해 어두운 인터페이스 사용',
      privacy: '개인정보 및 보안',
      readReceipts: '읽음 확인',
      readReceiptsDesc: '메시지를 읽었을 때 파트너에게 알림',
      dataStorage: '데이터 및 저장소',
      autoBackup: '자동 백업',
      autoBackupDesc: '메시지를 자동으로 백업',
      exportMessages: '메시지 내보내기',
      exportMessagesDesc: '채팅 기록 다운로드',
      createBackup: '백업 생성',
      createBackupDesc: '수동으로 메시지 백업',
      clearAllMessages: '모든 메시지 삭제',
      clearAllMessagesDesc: '모든 메시지를 영구적으로 삭제',
      accountManagement: '계정 관리',
      deleteAccount: '계정 영구 삭제',
      deleteAccountDesc: '계정과 모든 데이터를 완전히 삭제',
      about: '정보',
      aboutApp: 'Only You 정보',
      aboutAppDesc: '버전 1.0.0 • ❤️로 제작',
      footerText: 'Only You는 완전한 개인정보 보호를 원하는 두 사람을 위해 설계되었습니다. 메시지는 암호화되어 기기에만 저장됩니다.'
    },
    history: {
      title: '연결 기록',
      totalSessions: '총 세션',
      totalTime: '총 시간',
      buzzCalls: '버즈 콜',
      sessionDetail: '세션 상세',
      deleteSession: '세션을 삭제하시겠습니까?',
      deleteSessionDesc: '이 세션을 기록에서 삭제하시겠습니까?',
      activeSession: '활성 세션',
      activeSessionDesc: '활성 연결 세션의 세부정보를 볼 수 없습니다.',
      connected: '연결됨',
      disconnected: '연결 해제됨',
      connectionTime: '연결 시간',
      started: '시작됨',
      ended: '종료됨',
      exactDuration: '정확한 지속 시간',
      sessionStats: '세션 통계',
      messages: '메시지',
      calls: '통화',
      videoCalls: '영상 통화',
      reactions: '반응',
      inDevelopment: '개발 중'
    },
    onboarding: {
      madeForTwo: '두 마음을 위해 만들어짐',
      madeForTwoDesc: '커플을 위해 독점적으로 설계된 개인 메시징 앱입니다. 그룹도 없고 낯선 사람도 없이 - 오직 당신과 특별한 사람만을 위해.',
      encrypted: '종단간 암호화',
      encryptedDesc: '모든 메시지와 통화는 군사급 보안으로 암호화됩니다. 오직 당신과 파트너만이 대화를 읽을 수 있습니다.',
      messaging: '실시간 메시징',
      messagingDesc: '아름다운 애니메이션과 읽음 확인으로 즉시 메시지를 보내세요. 이모지와 진심 어린 말로 사랑을 표현하세요.',
      calls: '음성 및 영상 통화',
      callsDesc: '사랑하는 사람과 선명한 음성 및 영상 통화를 하세요. 떨어져 있어도 가까이 느껴보세요.',
      private: '완전히 개인적',
      privateDesc: '메시지나 개인 데이터를 저장하지 않습니다. 대화는 영원히 당신과 파트너 사이에만 남아있습니다.'
    }
  }
};

const initI18n = async () => {
  let savedLanguage = null;
  try {
    savedLanguage = await AsyncStorage.getItem('lang');
  } catch (error) {
    console.log('Could not load saved language');
  }

  const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
  const initialLanguage = savedLanguage || deviceLanguage;

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });

  return i18n;
};

initI18n();

export default i18n;