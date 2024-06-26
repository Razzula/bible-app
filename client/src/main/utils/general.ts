const paraTypes = ['p', 'q1', 'q2', 'pc', 'qs'];
const headerTypes = ['s']

export function isOfParagraphType(type: string, includeHeaders = false): string | undefined {

    if (type) {
        let types = type.split(' ');

        for (const type of types) {
            if (paraTypes.includes(type)) {
                return type;
            }

        }
    }

    if (includeHeaders) {
        return isOfHeaderType(type);
    }

    return undefined;
}

export function isOfHeaderType(type: string): string | undefined {

    if (type) {
        let types = type.split(' ');

        for (const type of types) {
            if (headerTypes.includes(type)) {
                return type;
            }
        }
    }
    return undefined;

}

export function isElectronApp(): boolean {
    return !!(window.electronAPI);
}
