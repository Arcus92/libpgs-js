import {WindowDefinition} from "./pgs/windowDefinitionSegment";
import {Rect} from "./utils/rect";

/**
 * This class contains the compiled subtitle data for a whole frame.
 */
export class RenderData {
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
    public readonly compositionData: CompositionRenderData[];

    public constructor(width: number, height: number, compositionData: CompositionRenderData[]) {
        this.width = width;
        this.height = height;
        this.compositionData = compositionData;
    }

    /**
     * Draws the whole subtitle frame to the given context.
     * @param context The context to draw on.
     * @param dirtyArea If given, it will extend the dirty rect to include the affected subtitle area.
     */
    public draw(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, dirtyArea?: Rect): void {
        for (const composition of this.compositionData) {
            composition.draw(context, dirtyArea);
        }
    }
}

/**
 * This class contains the compiled subtitle data for a single composition.
 */
export class CompositionRenderData {
    /**
     * The pgs window to draw on (the on-screen position).
     */
    public readonly window: WindowDefinition;

    /**
     * The compiled pixel data of the subtitle.
     */
    public readonly pixelData: HTMLCanvasElement | OffscreenCanvas;

    public constructor(window: WindowDefinition, pixelData: HTMLCanvasElement | OffscreenCanvas) {
        this.window = window;
        this.pixelData = pixelData;
    }

    /**
     * Draws this subtitle composition to the given context.
     * @param context The context to draw on.
     * @param dirtyArea If given, it will extend the dirty rect to include the affected subtitle area.
     */
    public draw(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, dirtyArea?: Rect): void {
        context.drawImage(this.pixelData, this.window.horizontalPosition, this.window.verticalPosition);

        // Mark this area as dirty.
        dirtyArea?.union(this.window.horizontalPosition, this.window.verticalPosition,
            this.pixelData.width, this.pixelData.height);
    }
}