# 🔔 Push Notification Testing Guide

## Overview
Complete guide để test push notifications khi app đóng hoặc minimize.

---

## 📦 Setup

### 1. Install Dependencies
```bash
npm install
```

Package `expo-notifications@~0.30.5` đã được thêm vào.

### 2. Config Files
- ✅ `app.json` - Đã config notification plugin
- ✅ `NotificationService.ts` - Service quản lý notifications

### 3. EAS Project ID (Optional)

**For Production Push Notifications:**

Nếu muốn gửi push notifications từ backend, cần thêm projectId vào `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

**Lấy Project ID:**
```bash
# Login to EAS
eas login

# Create/Link project
eas build:configure

# Project ID sẽ tự động được thêm vào app.json
```

**Note:** Local notifications (trong app) không cần projectId.

---

## 🧪 Testing Notifications

### **Method 1: Test với Code (Developer)**

Uncomment test functions trong `app/(tabs)/index.tsx`:

```typescript
// Thêm test functions (đã ẩn):
const simulateReceiveBuzz = () => { ... };
const testInstantNotification = async () => { ... };
const testPushNotification = async () => { ... };

// Thêm test buttons vào UI
```

### **Method 2: Test với Backend API**

```typescript
// Backend gửi notification
const pushToken = await notificationService.getPushToken();

POST https://exp.host/--/api/v2/push/send
{
  "to": pushToken,
  "title": "💕 Buzz từ Touch!",
  "body": "I miss you",
  "data": { "type": "buzz" }
}
```

### **Method 3: Test với Console**

```typescript
// Trong React DevTools Console hoặc component
import { notificationService } from '@/services/NotificationService';

// Gửi instant notification
await notificationService.sendLocalBuzzNotification({
  title: '💕 Test',
  body: 'Hello!',
  data: { type: 'buzz' }
});

// Schedule notification
await notificationService.scheduleTestBuzzNotification(5);
```

**Platform Support:**
- ✅ iOS - Full support
- ✅ Android - Full support
- ❌ Web - Không hỗ trợ (Expo limitation)

---

## 📱 Testing Workflow

### **Scenario 1: App Foreground (đang dùng)**
```
User mở app → Click test button → Alert xuất hiện
```
- Dùng: 🧪 In-App Buzz
- Result: Alert dialog + Haptic

### **Scenario 2: App Background (minimize)**
```
User minimize app → Click test button → Pull notification tray
```
- Dùng: 🔔 Instant Push
- Result: Notification trong tray

### **Scenario 3: App Closed (đóng hẳn)**
```
User click test → Đóng app → Đợi 5s → Notification xuất hiện
```
- Dùng: ⏰ Delayed Push
- Result: System notification + Sound + Vibration

---

## 🎯 Notification Content

### Instant Push Example:
```
┌─────────────────────────────┐
│ 💕 Buzz từ Touch!           │
│ Missing you right now 🥺    │
│ • Just now                  │
└─────────────────────────────┘
```

### Delayed Push Example:
```
┌─────────────────────────────┐
│ 💕 Buzz từ Touch!           │
│ I miss you 🥺               │
│ • 5 minutes ago             │
└─────────────────────────────┘
```

---

## 🔑 Key Features

### NotificationService Methods:

```typescript
// Request permission và lấy push token
await notificationService.registerForPushNotifications();

// Gửi local notification ngay
await notificationService.sendLocalBuzzNotification({
  title: '💕 Buzz từ Touch!',
  body: 'Missing you right now 🥺',
  data: { type: 'buzz' }
});

// Schedule notification delay 5s
await notificationService.scheduleTestBuzzNotification(5);

// Lấy push token (để gửi từ backend)
const token = await notificationService.getPushToken();

// Cancel tất cả notifications
await notificationService.cancelAllNotifications();
```

---

## 🚀 Platform-Specific Notes

### iOS
- **Permission:** Phải request permission lần đầu
- **Behavior:** Notification xuất hiện banner top-down
- **Sound:** Hỗ trợ custom sound
- **Badge:** Có thể set badge number

### Android
- **Permission:** Auto-granted (Android < 13)
- **Behavior:** Notification trong status bar
- **Channel:** Dùng "default" channel
- **Vibration:** Pattern `[0, 250, 250, 250]`

### Web
- **Status:** ❌ Không hỗ trợ
- **Reason:** Expo Notifications chưa support web
- **Workaround:** Dùng browser notifications (khác library)

---

## 📊 Notification Data Structure

```typescript
{
  title: string;                    // '💕 Buzz từ Touch!'
  body: string;                     // 'I miss you 🥺'
  data: {
    type: 'buzz';                   // Notification type
    emoji?: string;                 // '💕'
    senderId?: string;              // 'partner-id-123'
    senderName?: string;            // 'Touch'
  };
  sound: boolean;                   // true
  vibrate: number[];                // [0, 250, 250, 250]
}
```

---

## 🎬 Testing Checklist

### Pre-Test:
- [ ] App đã build (development build nếu cần)
- [ ] Permission đã được grant
- [ ] Push token đã được lấy

### Test 1: In-App Alert
- [ ] Click "🧪 In-App Buzz"
- [ ] Alert xuất hiện với emoji
- [ ] Haptic feedback hoạt động
- [ ] Có button "Trả Lời"

### Test 2: Instant Notification
- [ ] Click "🔔 Instant Push"
- [ ] Minimize app
- [ ] Pull notification tray
- [ ] Notification xuất hiện
- [ ] Click notification → App mở

### Test 3: Delayed Notification
- [ ] Click "⏰ Delayed Push"
- [ ] Confirm alert
- [ ] Đóng app hoàn toàn
- [ ] Đợi 5 giây
- [ ] Notification xuất hiện
- [ ] Sound + vibration
- [ ] Click notification → App launch

---

## 🐛 Troubleshooting

### Problem: Không nhận được notification
**Solutions:**
1. Check permission: Settings → Notifications → OnlyYou
2. Rebuild app với `expo prebuild --clean`
3. Check console logs cho push token
4. Verify app đang chạy development build (không phải Expo Go)

### Problem: Web không hoạt động
**Expected:** Push notifications không support web trong Expo
**Workaround:** Test trên iOS/Android simulator/device

### Problem: Delayed notification không xuất hiện
**Solutions:**
1. Đảm bảo app hoàn toàn đóng (kill process)
2. Check notification permission
3. Wait ít nhất 5-10 giây
4. Verify scheduled notifications: `notificationService.cancelAllNotifications()`

---

## 🔮 Future Enhancements

### Backend Integration:
```typescript
// Send push từ server
POST https://exp.host/--/api/v2/push/send
{
  "to": "ExponentPushToken[xxxxx]",
  "title": "💕 Buzz từ Touch!",
  "body": "Missing you right now",
  "data": { "type": "buzz", "senderId": "123" }
}
```

### Advanced Features:
- [ ] Custom notification sounds
- [ ] Badge count management
- [ ] Notification categories (iOS)
- [ ] Action buttons
- [ ] Rich media (images, videos)
- [ ] Deep linking từ notification

---

## 📚 Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Push Notification Guide](https://docs.expo.dev/push-notifications/overview/)
- [Testing on Device](https://docs.expo.dev/workflow/development-mode/)

---

## ✅ Summary

**3 Test Buttons:**
1. 🧪 **In-App Buzz** - Alert khi app mở
2. 🔔 **Instant Push** - Notification ngay lập tức
3. ⏰ **Delayed Push** - Notification sau 5s (test khi app đóng)

**Best Test Flow:**
1. Test in-app alert trước
2. Test instant push với app minimize
3. Test delayed push với app closed
4. Verify click notification mở app

**Ready to test push notifications! 🚀**
