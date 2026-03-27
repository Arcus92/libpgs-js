export interface Readable {
  /**
   * Gets the length of the stream in bytes.
   */
  get length(): number;

  /**
   * Reads the next chunk from the stream.
   * Returns the read data and a boolean to indicate if the reader reached the end of the stream.
   */
  read(): Promise<ReadableStreamReadResult<Uint8Array>>;
}
