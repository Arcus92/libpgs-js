import {AsyncBinaryReader} from "./asyncBinaryReader";
import {CombinedBinaryReader} from "./combinedBinaryReader";

/**
 * A binary reader based on a readable stream. This can read a partially loaded stream - for example a download.
 */
export class StreamBinaryReader implements AsyncBinaryReader {
    private readonly stream: ReadableStreamDefaultReader<Uint8Array>;
    private readonly reader: CombinedBinaryReader;
    private $eof: boolean = false;

    public constructor(stream: ReadableStreamDefaultReader<Uint8Array>) {
        this.stream = stream;
        this.reader = new CombinedBinaryReader([]);
    }

    public get position(): number {
        return this.reader.position;
    }

    public get length(): number {
        return this.reader.length;
    }

    public get eof(): boolean {
        return this.$eof;
    }

    public readByte(): number {
        return this.reader.readByte();
    }

    public readBytes(count: number): Uint8Array {
        return this.reader.readBytes(count);
    }

    public async requestData(count: number = 0): Promise<boolean> {
        // Always try to peak one byte ahead to detect end-of-file early
        while (this.reader.position + count + 1 > this.reader.length && !this.$eof) {
            let { value, done } = await this.stream.read();

            if (value) {
                this.reader.push(value);
            }

            if (done) {
                this.$eof = true;
            }
        }

        // Returns if all data could be requested
        return this.reader.position + count <= this.reader.length;
    }
}
