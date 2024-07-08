/**
 * A simple rectangular class.
 */
export class Rect {
    /**
     * Gets if the rect is still empty and doesn't contain any area.
     */
    public empty: boolean = true;

    /**
     * Gets the x coordinate of the rectangular area if not empty.
     */
    public x: number = 0;

    /**
     * Gets the y coordinate of the rectangular area if not empty.
     */
    public y: number = 0;

    /**
     * Gets the width of the rectangular area if not empty.
     */
    public width: number = 0;

    /**
     * Gets the height of the rectangular area if not empty.
     */
    public height: number = 0;

    /**
     * Clears the rectangular.
     */
    public reset() {
        this.empty = true;
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    }

    /**
     * Grows this rectangular area to include the given area.
     * @param x The x coordinate of the new area.
     * @param y The y coordinate of the new area.
     * @param width The width of the new area. Negative values are not supported.
     * @param height The height of the new area. Negative values are not supported.
     */
    public set(x: number, y: number, width: number = 0, height: number = 0) {
        this.empty = false;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Grows this rectangular area to include the given area.
     * @param x The x coordinate of the new area to include.
     * @param y The y coordinate of the new area to include.
     * @param width The width of the new area to include. Negative values are not supported.
     * @param height The height of the new area to include. Negative values are not supported.
     */
    public union(x: number, y: number, width: number = 0, height: number = 0) {
        if (this.empty) {
            // First sub-rect added
            this.empty = false;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        } else {
            // Grow the rectangular area to fit the new sub-rect
            if (x < this.x) { this.width += this.x - x; this.x = x; }
            if (y < this.y) { this.height += this.y - y; this.y = y; }
            if (x + width > this.x + this.width) { this.width = x + width - this.x; }
            if (y + height > this.y + this.height) { this.height = y + height - this.y; }
        }
    }
}
