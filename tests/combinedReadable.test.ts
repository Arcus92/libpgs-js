import {CombinedReadable} from "../src/io/combinedReadable";
import {BigEndianBinaryReader} from "../src/io/bigEndianBinaryReader";
import {ReadableBuffer} from "../src/io/readableBuffer";

test('combined readable length', () => {
    const reader = new CombinedReadable([
        new ReadableBuffer(new Uint8Array([0x01])),
        new ReadableBuffer(new Uint8Array([0x02, 0x03, 0x04]))
    ]);

    expect(reader.length).toBe(4);
});

test('combined readable content', async () => {
    const reader = new CombinedReadable([
        new ReadableBuffer(new Uint8Array([0x01])),
        new ReadableBuffer(new Uint8Array([0x02, 0x03, 0x04]))
    ]);

    const binaryReader = new BigEndianBinaryReader(reader);
    await binaryReader.requestData(reader.length);

    expect(binaryReader.readUInt8()).toBe(0x01);
    expect(binaryReader.readUInt8()).toBe(0x02);
    expect(binaryReader.readUInt8()).toBe(0x03);
    expect(binaryReader.readUInt8()).toBe(0x04);
});

test('combined readable read', async () => {
    const reader = new CombinedReadable([
        new ReadableBuffer(new Uint8Array([0x01])),
        new ReadableBuffer(new Uint8Array([0x02, 0x03, 0x04]))
    ]);


    let result = await reader.read();
    expect(result.done).toBe(false);
    expect(result.value).not.toBeUndefined();
    expect(result.value!.length).toBe(1);
    result = await reader.read();
    expect(result.done).toBe(true);
    expect(result.value).not.toBeUndefined();
    expect(result.value!.length).toBe(3);
    result = await reader.read();
    expect(result.done).toBe(true);
    expect(result.value).toBeUndefined();
});

test('combined readable skip empty buffer', async () => {
    const reader = new CombinedReadable([
        new ReadableBuffer(new Uint8Array([0x01])),
        new ReadableBuffer(new Uint8Array([])),
        new ReadableBuffer(new Uint8Array([0x02]))
    ]);

    const binaryReader = new BigEndianBinaryReader(reader);
    await binaryReader.requestData(reader.length);

    expect(reader.length).toBe(2);
    expect(binaryReader.readUInt8()).toBe(0x01);
    expect(binaryReader.readUInt8()).toBe(0x02);
});
