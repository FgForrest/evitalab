/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { VDateInput } from 'vuetify/labs/VDateInput'
import { VTimePicker } from 'vuetify/labs/VTimePicker'
import { VNumberInput } from 'vuetify/labs/VNumberInput'
import { VPicker } from 'vuetify/labs/VPicker'
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
    components: {
        VDateInput,
        VTimePicker,
        VNumberInput,
        VPicker
    },
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
                    'gray-light' : '#A5ACBC',
                    warning: '#f7a729',
                    error: '#E13321'
                },
            }
        }

    },
    defaults: {
        global: {
            ripple: false,
        },
        VSheet: {
            elevation: 0,
        },
        VTooltip: {
            contentClass: 'bg-primary-dark',
            maxWidth: 450,
            openDelay: 750
        },
        VListItem: {
            activeColor: 'bg-primary-dark',
            VBtn: {
                variant: 'text',
                density: 'compact'
            },
            VChip: {
                density: 'compact'
            }
        },
        VChipGroup: {
            variant: 'plain'
        },
        VChip: {
            color: 'gray-light'
        },
        VSelect: {
            variant: 'solo-filled',
            density: 'compact'
        },
        VCombobox: {
            variant: 'solo-filled',
            density: 'compact'
        },
        VAutocomplete: {
            variant: 'solo-filled',
            density: 'compact'
        },
        VTextField: {
            variant: 'solo-filled',
            density: 'compact'
        },
        VFileInput: {
            variant: 'solo-filled',
            density: 'compact'
        },
        VDateInput: {
            variant: 'solo-filled',
            density: 'compact',
            elevation: 6
        },
        VNumberInput: {
            variant: 'solo-filled',
            density: 'compact',
            VBtn: {
                variant: 'flat'
            }
        },
        VList: {
            density: 'compact'
        },
        VBtn: {
            variant: 'outlined'
        },
        VExpansionPanels: {
            variant: 'accordion'
        },
        VProgressLinear: {
            rounded: true
        }
    },
})
