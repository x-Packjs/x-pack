export function addSuffix(sourceStr: string, suffix: string) {
    const reg = new RegExp(`\.${suffix}$`);
    return `${sourceStr.replace(reg, '')}.js`;
}