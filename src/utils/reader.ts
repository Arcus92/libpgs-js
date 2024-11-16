import {BinaryReader} from "./binaryReader";
import {StreamBinaryReader} from "./streamBinaryReader";
import {ArrayBinaryReader} from "./arrayBinaryReader";

export abstract class Reader {
    /**
     * Returns the stream reader from the given web-response.
     * @param response The web response.
     */
    public static async fromResponse(response: Response): Promise<BinaryReader> {
        // The `body` and therefore readable streams are only available since Chrome 105. With this available we can utilize
        // partial reading while downloading. As a fallback we wait for the whole file to download before reading.
        const stream = response.body?.getReader();
        if (stream) {
            return new StreamBinaryReader(stream);
        } else {
            const buffer = await response.arrayBuffer();
            return new ArrayBinaryReader(new Uint8Array(buffer));
        }
    }
}
