import {WindowDefinition} from "./pgs/windowDefinitionSegment";

/**
 * This class contains the compiled subtitle data for a whole frame.
 */
export class SubtitleData {
    /**
     * The total width of the presentation composition (screen).
     */
    public readonly width: number;

    /**
     * The total height of the presentation composition (screen).
     */
    public readonly height: number;

    /**
     * The pre-compiled composition elements.
     */
    public readonly compositionData: SubtitleCompositionData[];

    public constructor(width: number, height: number, compositionData: SubtitleCompositionData[]) {
        this.width = width;
        this.height = height;
        this.compositionData = compositionData;
    }
}

/**
 * This class contains the compiled subtitle data for a single composition.
 */
export class SubtitleCompositionData {
    /**
     * The x position of the image in pixels from the left edge of the canvas.
     */
    public readonly x: number;

    /**
     * The y position of the image in pixels from the top edge of the canvas.
     */
    public readonly y: number;

    /**
     * The pgs window to draw on (the on-screen position).
     */
    public readonly window: WindowDefinition;

    /**
     * The compiled pixel data of the subtitle.
     */
    public readonly pixelData: ImageData;

    public constructor(x: number, y: number, window: WindowDefinition, pixelData: ImageData) {
        this.x = x;
        this.y = y;
        this.window = window;
        this.pixelData = pixelData;
    }
}
