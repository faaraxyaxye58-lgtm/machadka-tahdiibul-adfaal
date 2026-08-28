package com.tahdiibuladfaal.app

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

class TahdiibDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Toast.makeText(context, "Tahdiibul Adfaal Device Owner Activated!", Toast.LENGTH_LONG).show()
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Toast.makeText(context, "Tahdiibul Adfaal Device Owner Deactivated!", Toast.LENGTH_LONG).show()
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Toast.makeText(context, "Device Provisioning Complete!", Toast.LENGTH_SHORT).show()
    }
}
