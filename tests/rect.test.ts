import {Rect} from "../src/utils/rect";

test('reset rect', () => {
    const rect = new Rect();
    rect.set(1, 1, 2, 2);
    expect(rect.empty).toBe(false);
    rect.reset();
    expect(rect.empty).toBe(true);
});

test('grow rect in positive x direction', () => {
    const rect = new Rect();

    rect.set(1, 1, 2, 2);
    rect.union(5, 1, 2, 2);

    expect(rect.empty).toBe(false);
    expect(rect.x).toBe(1);
    expect(rect.y).toBe(1);
    expect(rect.width).toBe(6);
    expect(rect.height).toBe(2);
});


test('grow rect in negative x direction', () => {
    const rect = new Rect();

    rect.set(5, 1, 2, 2);
    rect.union(1, 1, 2, 2);

    expect(rect.empty).toBe(false);
    expect(rect.x).toBe(1);
    expect(rect.y).toBe(1);
    expect(rect.width).toBe(6);
    expect(rect.height).toBe(2);
});

test('grow rect in positive y direction', () => {
    const rect = new Rect();

    rect.set(1, 1, 2, 2);
    rect.union(1, 5, 2, 2);

    expect(rect.empty).toBe(false);
    expect(rect.x).toBe(1);
    expect(rect.y).toBe(1);
    expect(rect.width).toBe(2);
    expect(rect.height).toBe(6);
});


test('grow rect in negative y direction', () => {
    const rect = new Rect();

    rect.set(1, 5, 2, 2);
    rect.union(1, 1, 2, 2);

    expect(rect.empty).toBe(false);
    expect(rect.x).toBe(1);
    expect(rect.y).toBe(1);
    expect(rect.width).toBe(2);
    expect(rect.height).toBe(6);
});
