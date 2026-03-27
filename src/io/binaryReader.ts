export interface BinaryReader {
  /**
   * Gets the current position in the binary buffer.
   */
  get position(): number;

  /**
   * Gets the length of the binary buffer.
   */
  get length(): number;

  /**
   * Gets if the binary reader has reached the end of the data.
   */
  get eof(): boolean;

  /**
   * Reads a single byte from this buffer.
   */
  readUInt8(): number;

  /**
   * Reads a two-byte integer from this buffer.
   */
  readUInt16(): number;

  /**
   * Reads a three-byte integer from this buffer.
   */
  readUInt24(): number;

  /**
   * Reads a four-byte integer from this buffer.
   */
  readUInt32(): number;

  /**
   * Reads the given number of bytes from the buffer.
   * @param count The number of bytes to read.
   */
  readBytes(count: number): Uint8Array;

  /**
   * Ensures that the given number of bytes is available to read synchronously.
   * This will wait until the data is ready to read.
   * @param count The number of bytes requested.
   * @return Returns if the requested number of bytes could be loaded.
   */
  requestData(count: number): Promise<boolean>;
}
