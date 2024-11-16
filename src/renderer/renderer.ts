import {Rect} from "../utils/rect";
import {SubtitleFrameElement, SubtitleFrame} from "../subtitleFrame";

/**
 * This handles subtitle rendering to a canvas.
 */
export class Renderer {

    private readonly canvas: OffscreenCanvas | HTMLCanvasElement;
    private readonly context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

    // We keep track of the dirty area on the canvas. Clearing the whole canvas is slow when only a small area was used.
    private readonly dirtyArea = new Rect();

    public constructor(canvas: OffscreenCanvas | HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d')! as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
    }


    /**
     * Renders the given subtitle data to the canvas.
     * @param subtitleData The pre-compiled subtitle data to render.
     */
    public draw(subtitleData?: SubtitleFrame) {
        if (!this.canvas || !this.context) return;
        // Clear the canvas on invalid indices. It is possible to seek to a position before the first subtitle while
        // a later subtitle is on screen. This subtitle must be clear, even there is no valid new subtitle data.
        // Ignoring the render would keep the previous subtitle on screen.
        if (!this.dirtyArea.empty) {
            this.context.clearRect(this.dirtyArea.x, this.dirtyArea.y, this.dirtyArea.width, this.dirtyArea.height);
            this.dirtyArea.reset();
        }

        if (!subtitleData)
            return;

        // Resize the canvas if needed.
        if (this.canvas.width != subtitleData.width || this.canvas.height != subtitleData.height) {
            this.canvas.width = subtitleData.width;
            this.canvas.height = subtitleData.height;
        }

        this.drawSubtitleData(subtitleData, this.dirtyArea);
    }

    /**
     * Draws the whole subtitle frame to the given context.
     * @param subtitleData The subtitle data to draw.
     * @param dirtyArea If given, it will extend the dirty rect to include the affected subtitle area.
     */
    private drawSubtitleData(subtitleData: SubtitleFrame, dirtyArea?: Rect): void {
        for (const composition of subtitleData.elements) {
            this.drawSubtitleCompositionData(composition, dirtyArea);
        }
    }

    /**
     * Draws this subtitle composition to the given context.
     * @param element The subtitle element to draw.
     * @param dirtyArea If given, it will extend the dirty rect to include the affected subtitle area.
     */
    private drawSubtitleCompositionData(element: SubtitleFrameElement, dirtyArea?: Rect): void {
        if (element.hasCropping) {
            this.context?.putImageData(element.pixelData, element.x, element.y,
                element.croppingX, element.croppingY, element.croppingWidth, element.croppingHeight);

            dirtyArea?.union(element.x, element.y, element.croppingWidth, element.croppingHeight);
        } else {
            this.context?.putImageData(element.pixelData, element.x, element.y);

            dirtyArea?.union(element.x, element.y, element.pixelData.width, element.pixelData.height);
        }
    }
}
