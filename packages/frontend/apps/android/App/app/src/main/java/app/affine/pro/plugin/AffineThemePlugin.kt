package app.affine.pro.plugin

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "AffineTheme")
class AffineThemePlugin : Plugin() {

    interface Callback {
        fun onThemeChanged(darkMode: Boolean)
    }

    @PluginMethod
    fun onThemeChanged(call: PluginCall) {
        (bridge.activity as? Callback)?.onThemeChanged(call.data.optBoolean("darkMode"))
        call.resolve()
    }
}