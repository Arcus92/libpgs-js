import {Readable} from "./readable";

export class ReadableBuffer implements Readable {
  constructor(private buffer: Uint8Array) {}

  get length(): number {
    return this.buffer.length;
  }

  public async read(): Promise<ReadableStreamReadResult<Uint8Array>> {
    return {
      value: this.buffer,
      done: true,
    };
  }
}
