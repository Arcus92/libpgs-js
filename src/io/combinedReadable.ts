import {Readable} from "./readable";

export class CombinedReadable implements Readable {
  /**
   * The next readable index to read from.
   * @private
   */
  private index = 0;

  /**
   * The total length of all readable streams.
   */
  private readonly $length;

  constructor(private readableList: Readable[]) {
    this.$length = 0;
    for (const readable of readableList) {
      this.$length += readable.length;
    }
  }

  get length(): number {
    return this.$length;
  }

  async read(): Promise<ReadableStreamReadResult<Uint8Array>> {
    if (this.index >= this.readableList.length) {
      return {
        value: undefined,
        done: true
      };
    }

    const { value, done } = await this.readableList[this.index].read();

    if (!value) {
      this.index++;
      return await this.read();
    }

    if (done) {
      this.index++;
    }

    return {
      value: value,
      done: done && this.index >= this.readableList.length
    };
  }
}
