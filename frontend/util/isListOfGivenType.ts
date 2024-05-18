export default function isListOfGivenType(obj: any, type: string) {
    return Array.isArray(obj) && obj.every((it) => typeof it === type);
}
