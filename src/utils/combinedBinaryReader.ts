import {BinaryReader} from "./binaryReader";
import {ArrayBinaryReader} from "./arrayBinaryReader";

export class CombinedBinaryReader implements BinaryReader {
    private readonly subReaders: BinaryReader[];
    private readonly _length: number;

    private _position: number = 0;
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
        this._length = length;
    }

    public get position(): number {
        return this._position;
    }

    public get length(): number {
        return this._length;
    }

    public readByte(): number {
        while (this.subReaders[this.subReaderIndex].position >= this.subReaders[this.subReaderIndex].length) {
            this.subReaderIndex++;
        }
        this._position++;
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
