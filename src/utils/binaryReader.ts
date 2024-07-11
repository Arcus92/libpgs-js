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
    readByte(): number;

    /**
     * Reads the given number of bytes from the buffer.
     * @param count The number of bytes to read.
     */
    readBytes(count: number): Uint8Array;
}
