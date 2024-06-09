import {BigEndianBinaryReader} from "../src/utils/bigEndianBinaryReader";

test('read uint 8 value', () => {
    const reader = new BigEndianBinaryReader(new Uint8Array([0x01]));

    expect(reader.length).toBe(1);
    expect(reader.readUInt8()).toBe(1);
});

test('read uint 16 value', () => {
    const reader = new BigEndianBinaryReader(new Uint8Array([0x01, 0x02]));

    expect(reader.length).toBe(2);
    expect(reader.readUInt16()).toBe(258);
});

test('read uint 24 value', () => {
    const reader = new BigEndianBinaryReader(new Uint8Array([0x01, 0x02, 0x03]));

    expect(reader.length).toBe(3);
    expect(reader.readUInt24()).toBe(66051);
});

test('read uint 32 value', () => {
    const reader = new BigEndianBinaryReader(new Uint8Array([0x01, 0x02, 0x03, 0x04]));

    expect(reader.length).toBe(4);
    expect(reader.readUInt32()).toBe(16909060);
});

test('read 4 bytes', () => {
    const reader = new BigEndianBinaryReader(new Uint8Array([0x01, 0x02, 0x03, 0x04]));

    expect(reader.length).toBe(4);
    const data = reader.readBytes(4);
    expect(data.length).toBe(4);
    expect(data[0]).toBe(0x01);
    expect(data[1]).toBe(0x02);
    expect(data[2]).toBe(0x03);
    expect(data[3]).toBe(0x04);
});
