import {BinaryReader} from "./binaryReader";
import {ArrayBinaryReader} from "./arrayBinaryReader";

/**
 * Handles run length encoded images.
 */
export abstract class RunLengthEncoding {
    /**
     * Decodes the run length encoded image.
     * @param reader The run length encoded binary data reader or buffer.
     * @param source The source maps the index value to the raw output pixel data.
     * @param target The pixel data is written to the output.
     * @return Returns the number of decoded pixels.
     */
    static decode(reader: BinaryReader | Uint8Array,
        source: number[] | Uint8Array | Uint16Array | Uint32Array,
        target: number[] | Uint8Array | Uint16Array | Uint32Array): number {
        if (reader instanceof Uint8Array) {
            reader = new ArrayBinaryReader(reader);
        }

        let idx = 0;
        while (reader.position < reader.length) {
            const byte1 = reader.readByte();
            // Raw byte
            if (byte1 != 0x00) {
                target[idx++] = source[byte1];
                continue;
            }

            const byte2 = reader.readByte();
            // End of line
            if (byte2 == 0x00) {
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
                target[idx++] = source[value];
            }
        }

        return idx;
    }
}
