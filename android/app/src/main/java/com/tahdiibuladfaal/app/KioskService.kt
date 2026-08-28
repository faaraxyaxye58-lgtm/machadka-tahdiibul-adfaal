package com.tahdiibuladfaal.app

import android.app.Activity
import android.app.Service
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.util.Log

class KioskService : Service() {

    private lateinit var devicePolicyManager: DevicePolicyManager
    private lateinit var adminComponent: ComponentName

    override fun onCreate() {
        super.onCreate()
        devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, TahdiibDeviceAdminReceiver::class.java)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        val targetPackage = packageName

        if (devicePolicyManager.isDeviceOwnerApp(targetPackage)) {
            when (action) {
                ACTION_START_KIOSK -> enableFullKioskMode(targetPackage)
                ACTION_STOP_KIOSK -> disableFullKioskMode()
            }
        } else {
            Log.w(TAG, "App is not registered as Device Owner on this Android OS!")
        }

        return START_STICKY
    }

    private fun enableFullKioskMode(pkgName: String) {
        try {
            // Set Lock Task Packages (Whitelisting Tahdiibul Adfaal App)
            devicePolicyManager.setLockTaskPackages(adminComponent, arrayOf(pkgName))

            // Disable Keyguard (Lockscreen)
            devicePolicyManager.setKeyguardDisabled(adminComponent, true)

            // Disable System Status Bar & Quick Settings
            devicePolicyManager.setStatusBarDisabled(adminComponent, true)

            Log.i(TAG, "Full Android Device Owner Kiosk Mode Enforced for $pkgName")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to enable Device Owner Lock Task Mode: ${e.message}", e)
        }
    }

    private fun disableFullKioskMode() {
        try {
            // Re-enable Keyguard & Status Bar
            devicePolicyManager.setKeyguardDisabled(adminComponent, false)
            devicePolicyManager.setStatusBarDisabled(adminComponent, false)
            devicePolicyManager.setLockTaskPackages(adminComponent, arrayOf())

            Log.i(TAG, "Full Android Device Owner Kiosk Mode Released")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to release Device Owner Lock Task Mode: ${e.message}", e)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val TAG = "TahdiibKioskService"
        const val ACTION_START_KIOSK = "com.tahdiibuladfaal.ACTION_START_KIOSK"
        const val ACTION_STOP_KIOSK = "com.tahdiibuladfaal.ACTION_STOP_KIOSK"

        fun startKioskMode(activity: Activity) {
            val dpm = activity.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val admin = ComponentName(activity, TahdiibDeviceAdminReceiver::class.java)

            if (dpm.isDeviceOwnerApp(activity.packageName)) {
                dpm.setLockTaskPackages(admin, arrayOf(activity.packageName))
                activity.startLockTask()
            }
        }

        fun stopKioskMode(activity: Activity) {
            val dpm = activity.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            if (dpm.isDeviceOwnerApp(activity.packageName)) {
                activity.stopLockTask()
            }
        }
    }
}
