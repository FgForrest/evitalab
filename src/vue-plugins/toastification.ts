import Toast from 'vue-toastification'
import "vue-toastification/dist/index.css";

export const toast = Toast

export const defaultToastOptions = {
    position: "bottom-right",
    timeout: 7500,
    closeOnClick: false,
    draggable: false,
    transition: "Vue-Toastification__fade",
    maxToasts: 3
}
