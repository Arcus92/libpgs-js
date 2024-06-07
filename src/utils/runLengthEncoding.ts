export function runLengthEncoding(data: Uint8Array, setter: (idx: number, x: number, y: number, value: number) => void): void {
    let x = 0;
    let y = 0;
    let p = 0;
    let idx = 0;
    while (p < data.length) {
        const byte1 = data[p++];
        // Raw byte
        if (byte1 != 0x00) {
            setter(idx++, x++, y, byte1);
            continue;
        }

        const byte2 = data[p++];
        // End of line
        if (byte2 == 0x00) {
            x = 0;
            y++;
            continue;
        }

        const bit8 = (byte2 & 0b10000000) != 0;
        const bit7 = (byte2 & 0b01000000) != 0;
        let num = byte2 & 0b00111111;
        if (bit7) {
            num = (num << 8) + data[p++];
        }
        const value = bit8 ? data[p++] : 0x00;
        for (let i = 0; i < num; i++) {
            setter(idx++, x++, y, value);
        }
    }
}
