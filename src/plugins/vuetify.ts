/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                colors: {
                    background: '#1f1f33',
                    surface: '#1f1f33',
                    primary: '#1f1f33',
                    'primary-dark': '#131323',
                    'primary-light': '#23355C',
                    'primary-lightest': '#21BFE3',
                    'gray-light' : '#A5ACBC'
                },
            }
        }

    },
    defaults: {
        global: {
            ripple: false,
        },
        VSheet: {
            elevation: 12,
        },
        VTooltip: {
            contentClass: 'bg-primary-dark',
        },
        VListItem: {
            activeColor: 'bg-primary-dark',
        },
        VChip: {
            color: 'gray-light',
        }
    },
})
