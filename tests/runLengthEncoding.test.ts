import {RunLengthEncoding} from "../src/utils/runLengthEncoding";

test('2x2 run length decode with linebreak', () => {
    const data = new Uint8Array([
        0x01 /* raw byte */, 0x02 /* raw byte */, 0x00, 0x00 /* line break */,
        0x03 /* raw byte */, 0x04 /* raw byte */
    ]);
    const map = [0x00, 0x01, 0x02, 0x03, 0x04];
    const output = new Uint8Array(4);
    const length = RunLengthEncoding.decode(data, map, output);

    expect(length).toBe(4);
    expect(output[0]).toBe(0x01);
    expect(output[1]).toBe(0x02);
    expect(output[2]).toBe(0x03);
    expect(output[3]).toBe(0x04);
});

test('10x1 run length decode with repeating null-byte', () => {
    const data = new Uint8Array([
        0x00, 0x08 /* count */
    ]);
    const map = [0x00];
    const output = new Uint8Array(8);
    const length = RunLengthEncoding.decode(data, map, output);

    expect(length).toBe(8);
    for (let i = 0; i < 8; i++) {
        expect(output[i]).toBe(0x00);
    }
});

test('10x1 run length decode with repeating byte', () => {
    const data = new Uint8Array([
        0x00, 0x08 /* 6bit count */ | (1 << 7) /* not null byte */, 0x01 /* repeated byte */
    ]);
    const map = [0x00, 0x01];
    const output = new Uint8Array(8);
    const length = RunLengthEncoding.decode(data, map, output);

    expect(length).toBe(8);
    for (let i = 0; i < 8; i++) {
        expect(output[i]).toBe(0x01);
    }
});

test('522x1 run length decode with repeating null byte', () => {
    const data = new Uint8Array([
        0x00, 0x02 /* higher 6bit count (2x256) */ | (1 << 6) /* 14bit count */, 0x0A /* lower 8bit count (10) */
    ]);
    const map = [0x00];
    const output = new Uint8Array(522);
    const length = RunLengthEncoding.decode(data, map, output);

    expect(length).toBe(522);
    for (let i = 0; i < 522; i++) {
        expect(output[i]).toBe(0x00);
    }
});


test('522x1 run length decode with repeating byte', () => {
    const data = new Uint8Array([
        0x00, 0x02 /* higher 6bit count (2x256) */ | (1 << 7) /* not null byte */ | (1 << 6) /* 14bit count */, 0x0A /* lower 8bit count (10) */, 0x01 /* repeated byte */
    ]);
    const map = [0x00, 0x01];
    const output = new Uint8Array(522);
    const length = RunLengthEncoding.decode(data, map, output);

    expect(length).toBe(522);
    for (let i = 0; i < 522; i++) {
        expect(output[i]).toBe(0x01);
    }
});
