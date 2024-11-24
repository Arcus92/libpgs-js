/**
 * @jest-environment jsdom
 */

import {Renderer} from "../src/renderer/renderer";
import {PgsDecoder} from "../src/pgs/pgsDecoder";
import * as fs from "node:fs";

beforeEach(() => {
    // This makes `ImageData` available in Jest.
    global.ImageData = require('canvas').ImageData;
});

test('load and render full pgs subtitle', async () => {
    const dataSup = fs.readFileSync(`${__dirname}/files/pgs/subtitle.sup`);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const renderer = new Renderer(canvas);
    const pgs = new PgsDecoder();
    await pgs.loadFromBuffer(dataSup);

    // Helper function to render and compare the image in the test directory.
    // Since we only set pixel data and don't use font rendering this should be deterministic on every machine.
    const expectImageAtTimestamp = (filename: string, timestamp: number) => {
        const subtitleData = pgs.getSubtitleAtTimestamp(timestamp);
        renderer.draw(subtitleData);
        const resultData = context.getImageData(0, 0, canvas.width, canvas.height).data;

        // Loading the result file from png
        const {PNG} = require("pngjs");
        const buffer = fs.readFileSync(`${__dirname}/files/${filename}`);
        const png = PNG.sync.read(buffer);
        const expectedData = png.data;

        // Compare the resulted pixel data with a pre-calculated expected pixel data.
        expect(resultData.length).toBe(expectedData.length);
        for (let i = 0; i < resultData.length; i++) {
            expect(resultData[i]).toBe(expectedData[i]);
        }
    }

    expectImageAtTimestamp('result/0.png', 1.5);
    expectImageAtTimestamp('result/1.png', 2.5);
    expectImageAtTimestamp('result/2.png', 3.5);
});
