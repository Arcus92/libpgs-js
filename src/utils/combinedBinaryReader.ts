import {BinaryReader} from "./binaryReader";
import {ArrayBinaryReader} from "./arrayBinaryReader";

/**
 * A binary reader that combines multiple binary readers in one data stream.
 */
export class CombinedBinaryReader implements BinaryReader {
    private readonly subReaders: BinaryReader[];
    private readonly $length: number;

    private $position: number = 0;
    private subReaderIndex: number = 0;

    public constructor(subReaders: BinaryReader[] | Uint8Array[]) {
        this.subReaders = subReaders.map((subReader) => {
            if (subReader instanceof Uint8Array) {
                return new ArrayBinaryReader(subReader);
            }
            return subReader;
        });

        let length = 0;
        for (const subReader of subReaders) {
            length += subReader.length;
        }
        this.$length = length;
    }

    public get position(): number {
        return this.$position;
    }

    public get length(): number {
        return this.$length;
    }

    public readByte(): number {
        while (this.subReaders[this.subReaderIndex].position >= this.subReaders[this.subReaderIndex].length) {
            this.subReaderIndex++;
        }
        this.$position++;
        return this.subReaders[this.subReaderIndex].readByte();
    }

    public readBytes(count: number): Uint8Array {
        const result = new Uint8Array(count);
        for (let i = 0; i < count; i++) {
            result[i] = this.readByte();
        }
        return result;
    }
}
