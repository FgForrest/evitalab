export abstract class LabError extends Error {

    protected readonly _detail?: string | undefined

    readonly onClick: () => boolean

    protected constructor(name: string,
                          title: string,
                          detail?: string,
                          onClick?: () => boolean) {
        super(title)
        this.name = name
        this._detail = detail
        this.onClick = onClick != undefined ? onClick : () => false
    }

    get detail(): string {
        const parts: string[] = []
        if (this._detail !== undefined) {
            parts.push(this._detail)
        }
        if (this.stack !== undefined) {
            parts.push(this.stack)
        }
        return parts.join('\n\n')
    }
}
