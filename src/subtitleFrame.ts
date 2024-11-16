/**
 * This class contains the compiled subtitle data for a whole frame.
 */
export class SubtitleFrame {
    /**
     * The total width of the screen / canvas.
     */
    public readonly width: number;

    /**
     * The total height of the screen / canvas.
     */
    public readonly height: number;

    /**
     * The pre-compiled elements.
     */
    public readonly elements: SubtitleFrameElement[];

    public constructor(width: number, height: number, elements: SubtitleFrameElement[]) {
        this.width = width;
        this.height = height;
        this.elements = elements;
    }
}

/**
 * This class contains the compiled subtitle data for a single composition.
 */
export class SubtitleFrameElement {
    /**
     * The frame position of this element.
     */
    public readonly x: number;
    public readonly y: number;

    /**
     * Is cropping enabled for this element?
     */
    public readonly hasCropping: boolean;
    public readonly croppingX: number;
    public readonly croppingY: number;
    public readonly croppingWidth: number;
    public readonly croppingHeight: number;

    /**
     * The compiled pixel data of the subtitle.
     */
    public readonly pixelData: ImageData;

    public constructor(pixelData: ImageData, x: number, y: number, hasCropping: boolean = false,
                       croppingX: number = 0, croppingY: number = 0, croppingWidth: number = 0, croppingHeight: number = 0) {
        this.pixelData = pixelData;
        this.x = x;
        this.y = y;
        this.hasCropping = hasCropping;
        this.croppingX = croppingX;
        this.croppingY = croppingY;
        this.croppingWidth = croppingWidth;
        this.croppingHeight = croppingHeight;
    }
}
