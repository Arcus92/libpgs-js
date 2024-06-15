/**
 * @jest-environment jsdom
 */

import {PgsRendererInternal} from "../src/pgsRendererInternal";
import * as fs from "node:fs";

test('load and render pgs', () => {
    const dataSup = fs.readFileSync(`${__dirname}/files/test.sup`);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const renderer = new PgsRendererInternal();
    renderer.setCanvas(canvas);
    renderer.loadFromBuffer(dataSup);

    // Helper function to render and compare the image in the test directory.
    // Since we only set pixel data and don't use font rendering this should be deterministic on every machine.
    const expectImageAtTimestamp = (filename: string, timestamp: number) => {
        const expectedData = fs.readFileSync(`${__dirname}/files/${filename}`);

        renderer.renderAtTimestamp(timestamp);
        const resultData = context.getImageData(0, 0, canvas.width, canvas.height).data;

        // Compare the resulted pixel data with a pre-calculated expected pixel data.
        expect(resultData.length).toBe(expectedData.length);
        for (let i = 0; i < resultData.length; i++) {
            expect(resultData[i]).toBe(expectedData[i]);
        }
    }

    expectImageAtTimestamp('test-0.rgba', 1.5);
    expectImageAtTimestamp('test-1.rgba', 2.5);
    expectImageAtTimestamp('test-2.rgba', 3.5);
});
