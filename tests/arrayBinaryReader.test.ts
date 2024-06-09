import {ArrayBinaryReader} from "../src/utils/arrayBinaryReader";

test('array binary reader length', () => {
    const reader = new ArrayBinaryReader(new Uint8Array([ 0x01, 0x02, 0x03, 0x04 ]));

    expect(reader.length).toBe(4);
});

test('array binary reader content', () => {
    const reader = new ArrayBinaryReader(new Uint8Array([ 0x01, 0x02, 0x03, 0x04 ]));

    expect(reader.readByte()).toBe(0x01);
    expect(reader.readByte()).toBe(0x02);
    expect(reader.readByte()).toBe(0x03);
    expect(reader.readByte()).toBe(0x04);
});
