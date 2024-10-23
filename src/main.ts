import { App, createApp } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { codemirror, defaultCodemirrorOptions } from '@/vue-plugins/codemirror'
import { i18n } from '@/vue-plugins/i18n'
import router from '@/vue-plugins/router'
import pinia from '@/vue-plugins/pinia'
import { modules } from '@/modules/modules'
import { loadFonts } from '@/vue-plugins/webfontloader'
import { defaultToastOptions, toast } from '@/vue-plugins/toastification'
import vuetify from '@/vue-plugins/vuetify'
import Lab from '@/Lab.vue'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import luxonExtensions from '@/vue-plugins/luxonExtensions'

/**
 * Bootstraps the entire evitaLab.
 */
const app: App<Element> = createApp(Lab)

// load Vue plugins
loadFonts()
    .then(() => {
        app
            .use(vuetify)
            .use(codemirror, defaultCodemirrorOptions)
            .use(toast, defaultToastOptions)
            .use(pinia)
            .use(VueApexCharts)
            .use(i18n)
            .use(router)
            .use(luxonExtensions)

        // register evitaLab modules
        const moduleContextBuilder: ModuleContextBuilder = new ModuleContextBuilder(app)
        modules.forEach(it => it.register(moduleContextBuilder))

        app.mount('#app')
    })
