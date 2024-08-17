import {Pgs} from "../src/pgs";
import * as fs from "node:fs";

beforeEach(() => {
  // This makes `ImageData` available in Jest.
  global.ImageData = require('canvas').ImageData;
});

test('load pgs from file and check timestamps', async () => {
  const pgs = new Pgs();
  const dataSup = fs.readFileSync(`${__dirname}/files/test.sup`);
  await pgs.loadFromBuffer(dataSup);

  expect(pgs.updateTimestamps).toEqual([90000, 180000, 270000, 360000]);
});

test('load pgs from file and get first subtitle', async () => {
  const pgs = new Pgs();
  const dataSup = fs.readFileSync(`${__dirname}/files/test.sup`);
  await pgs.loadFromBuffer(dataSup);

  const subtitle = pgs.getSubtitleAtTimestamp(1.5);
  expect(subtitle).toBeDefined();

  expect(subtitle!.width).toBe(128);
  expect(subtitle!.height).toBe(64);

  expect(subtitle!.compositionData.length).toBe(1);
  expect(subtitle!.compositionData[0].window.horizontalPosition).toBe(4);
  expect(subtitle!.compositionData[0].window.verticalPosition).toBe(32);
});
