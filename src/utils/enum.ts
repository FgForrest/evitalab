export function getEnumKeyByValue<T extends Record<string, string>>(
    enumObj: T,
    value: string
): string {
    const stringValue = Object.keys(enumObj).find(key => enumObj[key] === value)
    return stringValue ? stringValue : ''
}
