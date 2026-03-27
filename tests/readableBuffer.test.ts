import {ReadableBuffer} from "../src/io/readableBuffer";

test('readable buffer length', () => {
    const reader = new ReadableBuffer(new Uint8Array([ 0x01, 0x02, 0x03, 0x04 ]));

    expect(reader.length).toBe(4);
});

test('readable buffer read', async () => {
    const reader = new ReadableBuffer(new Uint8Array([ 0x01, 0x02, 0x03, 0x04 ]));

    const { value, done } = await reader.read();

    expect(value).not.toBeUndefined();
    expect(value!.length).toBe(4);
    expect(value![0]).toBe(0x01);
    expect(value![1]).toBe(0x02);
    expect(value![2]).toBe(0x03);
    expect(value![3]).toBe(0x04);
    expect(done).toBe(true);
});
