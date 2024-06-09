import {RunLengthEncoding} from "../src/utils/runLengthEncoding";

test('2x2 run length decode with linebreak', () => {
    const data = new Uint8Array([
        0x01 /* raw byte */, 0x02 /* raw byte */, 0x00, 0x00 /* line break */,
        0x03 /* raw byte */, 0x04 /* raw byte */
    ]);
    const result: {idx: number, x: number, y: number, value: number}[] = [];
    RunLengthEncoding.decode(data, (idx, x, y, value) => {
        result.push({ idx, x, y, value });
    });

    expect(result.length).toBe(4);
    expect(result[0]).toMatchObject({ idx: 0, x: 0, y: 0, value: 0x01 });
    expect(result[1]).toMatchObject({ idx: 1, x: 1, y: 0, value: 0x02 });
    expect(result[2]).toMatchObject({ idx: 2, x: 0, y: 1, value: 0x03 });
    expect(result[3]).toMatchObject({ idx: 3, x: 1, y: 1, value: 0x04 });
});

test('10x1 run length decode with repeating null-byte', () => {
    const data = new Uint8Array([
        0x00, 0x08 /* count */
    ]);
    const result: {idx: number, x: number, y: number, value: number}[] = [];
    RunLengthEncoding.decode(data, (idx, x, y, value) => {
        result.push({ idx, x, y, value });
    });

    expect(result.length).toBe(8);
    for (let i = 0; i < 8; i++) {
        expect(result[i]).toMatchObject({ idx: i, x: i, y: 0, value: 0x00 });
    }
});

test('10x1 run length decode with repeating byte', () => {
    const data = new Uint8Array([
        0x00, 0x08 /* 6bit count */ | (1 << 7) /* not null byte */, 0x01 /* repeated byte */
    ]);
    const result: {idx: number, x: number, y: number, value: number}[] = [];
    RunLengthEncoding.decode(data, (idx, x, y, value) => {
        result.push({ idx, x, y, value });
    });

    expect(result.length).toBe(8);
    for (let i = 0; i < 8; i++) {
        expect(result[i]).toMatchObject({ idx: i, x: i, y: 0, value: 0x01 });
    }
});

test('522x1 run length decode with repeating null byte', () => {
    const data = new Uint8Array([
        0x00, 0x02 /* higher 6bit count (2x256) */ | (1 << 6) /* 14bit count */, 0x0A /* lower 8bit count (10) */
    ]);
    const result: {idx: number, x: number, y: number, value: number}[] = [];
    RunLengthEncoding.decode(data, (idx, x, y, value) => {
        result.push({ idx, x, y, value });
    });

    expect(result.length).toBe(522);
    for (let i = 0; i < 522; i++) {
        expect(result[i]).toMatchObject({ idx: i, x: i, y: 0, value: 0x00 });
    }
});


test('522x1 run length decode with repeating byte', () => {
    const data = new Uint8Array([
        0x00, 0x02 /* higher 6bit count (2x256) */ | (1 << 7) /* not null byte */ | (1 << 6) /* 14bit count */, 0x0A /* lower 8bit count (10) */, 0x01 /* repeated byte */
    ]);
    const result: {idx: number, x: number, y: number, value: number}[] = [];
    RunLengthEncoding.decode(data, (idx, x, y, value) => {
        result.push({ idx, x, y, value });
    });

    expect(result.length).toBe(522);
    for (let i = 0; i < 522; i++) {
        expect(result[i]).toMatchObject({ idx: i, x: i, y: 0, value: 0x01 });
    }
});
