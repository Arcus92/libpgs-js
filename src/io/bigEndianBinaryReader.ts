import {BinaryReader} from "./binaryReader";
import {ReadableBuffer} from "./readableBuffer";
import {Readable} from "./readable";

export class BigEndianBinaryReader implements BinaryReader {
  /**
   * The base readable input.
   */
  private readonly readable: Readable;

  /**
   * The current byte position in the loaded buffer.
   */
  private $bufferPosition: number = 0;

  /**
   * The byte position of the start of the loaded buffer.
   */
  private $bufferOffset: number = 0;

  /**
   * The current loaded buffer.
   */
  private $buffer: Uint8Array | undefined;

  /**
   * Indicates if the current loaded buffer is the final buffer in the readable stream.
   */
  private $finalBuffer: boolean = false;

  public constructor(readableOrBuffer: Readable | Uint8Array) {
    if (readableOrBuffer instanceof Uint8Array) {
      this.readable = new ReadableBuffer(readableOrBuffer);
      this.$buffer = readableOrBuffer;
    }
    else {
      this.readable = readableOrBuffer;
    }
  }

  public get position(): number {
    return this.$bufferOffset + this.$bufferPosition;
  }

  public get length(): number {
    return this.readable.length;
  }

  public get eof(): boolean {
    return this.$finalBuffer && this.$bufferPosition >= (this.$buffer?.length ?? 0);
  }

  public readUInt8(): number {
    if (!this.$buffer) return 0;
    return this.$buffer[this.$bufferPosition++];
  }

  public readUInt16(): number {
    const b1 = this.readUInt8();
    const b2 = this.readUInt8();
    return (b1 << 8) + b2;
  }

  public readUInt24(): number {
    const b1 = this.readUInt8();
    const b2 = this.readUInt8();
    const b3 = this.readUInt8();
    return (b1 << 16) + (b2 << 8) + b3;
  }

  public readUInt32(): number {
    const b1 = this.readUInt8();
    const b2 = this.readUInt8();
    const b3 = this.readUInt8();
    const b4 = this.readUInt8();
    return (b1 << 24) + (b2 << 16) + (b3 << 8) + b4;
  }

  public readBytes(count: number): Uint8Array {
    if (!this.$buffer) return new Uint8Array(0);
    const result = this.$buffer.slice(this.$bufferPosition, this.$bufferPosition + count);
    this.$bufferPosition += count;
    return result;
  }

  async requestData(count: number): Promise<boolean> {
    let loadedBuffer = this.$buffer?.length ?? 0 - this.$bufferPosition;
    while (loadedBuffer < count) {
      const { value, done } = await this.readable.read();
      if (!value) return false;

      if (this.$buffer) {
        // Join the leftover data from the current buffer and the new data.
        const mergedBuffer = new Uint8Array(loadedBuffer + value.length);
        mergedBuffer.set(this.$buffer.slice(this.$bufferPosition), 0);
        mergedBuffer.set(value, loadedBuffer);

        this.$bufferOffset += this.$bufferPosition;

        this.$buffer = mergedBuffer;
      } else {
        this.$buffer = value;
      }

      this.$bufferPosition = 0;
      loadedBuffer += value.length;

      if (done) {
        this.$finalBuffer = true;
        break;
      }
    }

    return loadedBuffer >= count;
  }
}
