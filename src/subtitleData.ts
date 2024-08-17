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
     * The pgs window to draw on (the on-screen position).
     */
    public readonly window: WindowDefinition;

    /**
     * The compiled pixel data of the subtitle.
     */
    public readonly pixelData: ImageData;

    public constructor(window: WindowDefinition, pixelData: ImageData) {
        this.window = window;
        this.pixelData = pixelData;
    }
}
