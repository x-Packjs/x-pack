export function hasOwnProperty(obj: Object, prop: string) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}