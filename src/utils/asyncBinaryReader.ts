import {BinaryReader} from "./binaryReader";

export interface AsyncBinaryReader extends BinaryReader {
    /**
     * Ensures that the given number of bytes is available to read synchronously.
     * This will wait until the data is ready to read.
     * @param count The number of bytes requested.
     * @return Returns if the requested number of bytes could be loaded.
     */
    requestData(count: number): Promise<boolean>;
}
