/**
 * Copies the given text to the system clipboard.
 *
 * Uses the asynchronous Clipboard API when available (secure contexts: HTTPS or localhost)
 * and transparently falls back to the legacy `document.execCommand('copy')` mechanism on
 * insecure origins where `navigator.clipboard` is `undefined`. Rejects when neither method
 * succeeds, so callers can surface a failure notification.
 *
 * @param text text to place into the clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
    // Clipboard API is only present in secure contexts (HTTPS / localhost).
    if (navigator.clipboard != undefined && window.isSecureContext) {
        return navigator.clipboard.writeText(text)
    }
    return copyToClipboardLegacy(text)
}

function copyToClipboardLegacy(text: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            const textArea: HTMLTextAreaElement = document.createElement('textarea')
            textArea.value = text
            // keep the element out of view and out of layout flow
            textArea.style.position = 'fixed'
            textArea.style.top = '-9999px'
            textArea.style.left = '-9999px'
            textArea.setAttribute('readonly', '')
            document.body.appendChild(textArea)
            textArea.select()

            const succeeded: boolean = document.execCommand('copy')
            document.body.removeChild(textArea)

            if (succeeded) {
                resolve()
            } else {
                reject(new Error('Copy command was unsuccessful.'))
            }
        } catch (e) {
            reject(e)
        }
    })
}
