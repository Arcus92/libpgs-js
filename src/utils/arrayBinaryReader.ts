import {BinaryReader} from "./binaryReader";

export class ArrayBinaryReader implements BinaryReader {
    private readonly array: Uint8Array;

    private _position: number = 0;

    public constructor(array: Uint8Array) {
        this.array = array;
    }

    public get position(): number {
        return this._position;
    }

    public get length(): number {
        return this.array.length;
    }

    public readByte(): number {
        return this.array[this._position++];
    }

    public readBytes(count: number): Uint8Array {
        const data = this.array.slice(this._position, this._position + count);
        this._position += count;
        return data;
    }
}
