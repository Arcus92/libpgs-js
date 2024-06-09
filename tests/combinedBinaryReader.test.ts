import {CombinedBinaryReader} from "../src/utils/combinedBinaryReader";

test('combined binary reader length', () => {
    const reader = new CombinedBinaryReader([
        new Uint8Array([0x01]),
        new Uint8Array([0x02, 0x03, 0x04])
    ]);

    expect(reader.length).toBe(4);
});

test('combined binary reader content', () => {
    const reader = new CombinedBinaryReader([
        new Uint8Array([0x01]),
        new Uint8Array([0x02, 0x03, 0x04])
    ]);

    expect(reader.readByte()).toBe(0x01);
    expect(reader.readByte()).toBe(0x02);
    expect(reader.readByte()).toBe(0x03);
    expect(reader.readByte()).toBe(0x04);
});

test('combined binary reader skip empty buffer', () => {
    const reader = new CombinedBinaryReader([
        new Uint8Array([0x01]),
        new Uint8Array([]),
        new Uint8Array([0x02])
    ]);

    expect(reader.length).toBe(2);
    expect(reader.readByte()).toBe(0x01);
    expect(reader.readByte()).toBe(0x02);
});
