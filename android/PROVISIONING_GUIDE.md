# Tahdiibul Adfaal - Android Device Owner Enrollment Guide

Kani waa hubaal-raaca farsamo (Technical Enrollment Guide) ee loogu talagalay in lagu enroll-gareeyo telefoonada/tablets-ka Machadka Tahdiibul Adfaal si ay toos ugu noqdaan **Device Owner / Dedicated Kiosk Mode**.

---

## 1. Habka ADB Direct Enrollment (Developer / Testing)

Haddii aad leedahay USB Cable iyo Computer:

### Tallaabada 1: Reset Telefoonka
1. Ka tirtir dhammaan Google Accounts-ka ama samee **Factory Data Reset**.
2. Marka telefoonku soo kaco ku xiriir Wi-Fi (Hawaan habaynin xisaab Google-ka).

### Tallaabada 2: Daar Developer Options & USB Debugging
1. Qaybta **Settings -> About Phone**, ku dhaji `Build Number` 7 jeer ilaa uu ka soo baxo "You are now a developer!".
2. Qaybta **Settings -> Developer Options**, kasoo daar **USB Debugging**.

### Tallaabada 3: Ku Shob APK-ga
Ku xiriir telefoonka USB Cable, ka dibna Terminal-ka ka run-garee:
```bash
adb install -r TahdiibulAdfaalKiosk.apk
```

### Tallaabada 4: Bixi Device Owner Status
Ku dhaji amarkan terminal-ka:
```bash
adb shell dpm set-device-owner com.tahdiibuladfaal.app/.TahdiibDeviceAdminReceiver
```

**Natiijada Expected**:
> `Success: Device owner set to package com.tahdiibuladfaal.app/.TahdiibDeviceAdminReceiver`

---

## 2. Habka Android Enterprise QR Code Provisioning (Production Deployment)

Haddii aad haysato telefoon cusub oo dhulka la soo dhigay (Out-of-the-Box):

1. **Tap 6 Times**: Marka ugu horeysa oo uu ka soo baco shaashadda "Welcome" ee Android-ka, ku tap-garee shaashadda 6 jeer meel maran.
2. **Scan QR Code**: Soosaar Camera QR Reader-ka ka dibna scan-garee QR Code-kan JSON-ka ah:

```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.tahdiibuladfaal.app/.TahdiibDeviceAdminReceiver",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://tahdiibuladfaal.org/apk/TahdiibulAdfaalKiosk.apk",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "a1b2c3d4e5f6...",
  "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": false,
  "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
    "instituteId": "tahdiibul_adfaal_main",
    "kioskModeAutoStart": true
  }
}
```

---

## 3. Sida 3-da Waqti u Kiosk Mode-gareeyaan Qalabka (Automatic Sync Flow)

1. **Shift 1, 2, ama 3 Active**:
   - Native Service-ka `ShiftKioskSyncBridge` wuxuu si realtime ah Firestore uga akhriyaa status-ka `schoolSettings.timeShifts`.
   - Marka status = `ACTIVE`, native code-ku wuxuu wacayaa `KioskService.startKioskMode(activity)` wuxuuna gabaabsiyayaa Home, Back, Recents, Keyguard, iyo Status bar.

2. **Shift Session Finished**:
   - Marka status = `FINISHED`, native code-ku wuxuu wacayaa `KioskService.stopKioskMode(activity)` wuxuuna xoraynayaa qalabka.

3. **Emergency Unlock by Admin**:
   - Admin-ku marka uu MIS Web App-ka ka shido Emergency Unlock (5m, 15m, 30m, End of Class), qalabku wuxuu helayaa signal-ka `EmergencyUnlocked` wuxuuna si ku meel gaar ah u sii deynayaa Kiosk Mode iyadoo Audit Log-ga lagu kaydinayo.
