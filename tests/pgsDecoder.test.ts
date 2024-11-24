import {PgsDecoder} from "../src/pgs/pgsDecoder";
import * as fs from "node:fs";

beforeEach(() => {
  // This makes `ImageData` available in Jest.
  global.ImageData = require('canvas').ImageData;
});

test('load pgs from file and check timestamps', async () => {
  const decoder = new PgsDecoder();
  const buffer = fs.readFileSync(`${__dirname}/files/pgs/subtitle.sup`);
  await decoder.loadFromBuffer(buffer);

  expect(decoder.updateTimestamps).toEqual([90000, 180000, 270000, 360000]);
});

test('load pgs from file and get first subtitle', async () => {
  const decoder = new PgsDecoder();
  const buffer = fs.readFileSync(`${__dirname}/files/pgs/subtitle.sup`);
  await decoder.loadFromBuffer(buffer);

  const subtitle = decoder.getSubtitleAtTimestamp(1.5);
  expect(subtitle).toBeDefined();

  expect(subtitle!.width).toBe(128);
  expect(subtitle!.height).toBe(64);

  expect(subtitle!.elements.length).toBe(1);
  expect(subtitle!.elements[0].x).toBe(4);
  expect(subtitle!.elements[0].y).toBe(32);
});
