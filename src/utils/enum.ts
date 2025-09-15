export function getEnumKeyByValue<T extends Record<string, any>>(
    enumObj: T,
    value: string
): string {
    // Only check properties that have string or number values (actual enum members)
    const enumKeys = Object.keys(enumObj).filter(key =>
        typeof enumObj[key] === 'string' || typeof enumObj[key] === 'number'
    );

    const stringValue = enumKeys.find(key => enumObj[key] === value);
    return stringValue ? stringValue : '';
}
