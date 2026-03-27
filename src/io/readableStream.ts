import {Readable} from "./readable";

export class ReadableStream implements Readable {
  public constructor(private stream: ReadableStreamDefaultReader<Uint8Array>, private $length: number = 0) {}

  get length(): number {
    return this.$length;
  }

  public async read(): Promise<ReadableStreamReadResult<Uint8Array>> {
    return await this.stream.read();
  }
}
