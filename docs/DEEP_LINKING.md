# Deep Linking & QR Code Integration

## Tính năng

Ứng dụng OnlyYou hỗ trợ **Deep Linking** để người dùng có thể kết nối nhanh chóng bằng cách quét mã QR.

## Cách hoạt động

### 1. QR Code Format

Khi tạo phòng mới, QR code sẽ chứa deep link theo định dạng:

```
onlyyou://connect/XXXX-XXXX-XXXX-XXXX
```

Ví dụ: `onlyyou://connect/A3B7-K2M9-P5Q1-W8X4`

### 2. Quy trình quét QR

**Người tạo phòng:**
1. Nhấn "Tạo phòng mới" → Nhận room code 16 ký tự
2. Nhấn "Hiển thị mã QR" → Modal hiển thị QR code
3. Người yêu quét mã QR này

**Người tham gia:**
1. Mở máy ảnh điện thoại (Camera app mặc định)
2. Quét mã QR
3. Điện thoại sẽ hiển thị thông báo: "Mở trong OnlyYou?"
4. Nhấn vào thông báo
5. App OnlyYou tự động mở và kết nối với room code

### 3. Deep Link Handler

File: `app/_layout.tsx`

Deep link handler sẽ:
- Lắng nghe khi app được mở qua deep link
- Parse room code từ URL
- Tự động kết nối đến signaling server
- Tự động join room với room code
- Hiển thị thông báo kết nối thành công

### 4. Cấu hình Platform

**iOS (app.json):**
```json
{
  "ios": {
    "bundleIdentifier": "com.onlyyou.app",
    "associatedDomains": ["applinks:onlyyou.app"]
  }
}
```

**Android (app.json):**
```json
{
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "https",
            "host": "onlyyou.app",
            "pathPrefix": "/connect"
          }
        ]
      }
    ]
  }
}
```

**Universal Scheme:**
```json
{
  "scheme": "onlyyou"
}
```

## Lợi ích

✅ **Tiện lợi**: Không cần nhập mã thủ công
✅ **Nhanh chóng**: Chỉ cần quét và nhấn
✅ **Chính xác**: Không lo nhầm lẫn khi nhập mã
✅ **User-friendly**: Trải nghiệm mượt mà và chuyên nghiệp

## Test Deep Linking

### Trên thiết bị thật:

**iOS:**
```bash
npx uri-scheme open "onlyyou://connect/TEST-CODE-1234-5678" --ios
```

**Android:**
```bash
npx uri-scheme open "onlyyou://connect/TEST-CODE-1234-5678" --android
```

### Trên simulator/emulator:

**iOS Simulator:**
```bash
xcrun simctl openurl booted "onlyyou://connect/TEST-CODE-1234-5678"
```

**Android Emulator:**
```bash
adb shell am start -W -a android.intent.action.VIEW -d "onlyyou://connect/TEST-CODE-1234-5678"
```

## Supported URL Formats

App hỗ trợ 2 định dạng deep link:

1. **Custom Scheme**: `onlyyou://connect/{roomCode}`
2. **Universal Link**: `https://onlyyou.app/connect/{roomCode}`

Cả hai định dạng đều hoạt động giống nhau và sẽ tự động mở app.

## Security Notes

- Room code được validate trước khi kết nối
- Nếu room code không hợp lệ, hiển thị lỗi và yêu cầu nhập thủ công
- Deep link chỉ chứa room code, không có thông tin nhạy cảm
- Kết nối vẫn được mã hóa end-to-end như bình thường
