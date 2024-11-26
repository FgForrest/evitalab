/**
 * Defines a single item in workspace path
 */
export class SubjectPathItem {
    readonly icon?: string
    readonly value: string
    readonly onClick?: () => void

    private constructor(icon: string | undefined, value: string, onClick?: () => void) {
        this.icon = icon
        this.value = value
        this.onClick = onClick
    }

    static plain(value: string, onClick?: () => void): SubjectPathItem {
        return new SubjectPathItem(undefined, value, onClick)
    }

    static significant(icon: string, value: string, onClick?: () => void): SubjectPathItem {
        return new SubjectPathItem(icon, value, onClick)
    }
}
