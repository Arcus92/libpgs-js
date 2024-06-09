import {BinaryReader} from "./binaryReader";
import {ArrayBinaryReader} from "./arrayBinaryReader";

export abstract class RunLengthEncoding {
    /**
     * Decodes the run length encoded image.
     * @param reader The run length encoded binary data reader or buffer.
     * @param setter This callback is invoked for every pixel and provides the index, coordinate and value.
     */
    static decode(reader: BinaryReader | Uint8Array, setter: (idx: number, x: number, y: number, value: number) => void): void {
        if (reader instanceof Uint8Array) {
            reader = new ArrayBinaryReader(reader);
        }

        let x = 0;
        let y = 0;
        let idx = 0;
        while (reader.position < reader.length) {
            const byte1 = reader.readByte();
            // Raw byte
            if (byte1 != 0x00) {
                setter(idx++, x++, y, byte1);
                continue;
            }

            const byte2 = reader.readByte();
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
                num = (num << 8) + reader.readByte();
            }
            const value = bit8 ? reader.readByte() : 0x00;
            for (let i = 0; i < num; i++) {
                setter(idx++, x++, y, value);
            }
        }
    }
}
