export default class ContactForm {
    constructor() {
        let str = $('form').data('hash');
        let buffer = new TextEncoder().encode(str);
        crypto.subtle.digest("SHA-256", buffer)
            .then((hash) => {
                    document.getElementById("hash").value = this.hex(hash)
                }
            );
    }

    hex(buffer) {
        let hexCodes = [];
        let view = new DataView(buffer);
        for (let i = 0; i < view.byteLength; i += 4) {
            let value = view.getUint32(i);
            let stringValue = value.toString(16);
            let padding = '00000000';
            let paddedValue = (padding + stringValue).slice(-padding.length);
            hexCodes.push(paddedValue);
        }
        return hexCodes.join('');
    }
}