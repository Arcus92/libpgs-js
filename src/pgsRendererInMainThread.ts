import {PgsRendererImpl} from "./pgsRendererImpl";
import {PgsRendererOptions} from "./pgsRendererOptions";
import {Renderer} from "./renderer";
import {Pgs} from "./pgs";

/**
 * The implementation without web workers. This loads and renders the subtitle in the main thread.
 * This is meant as a compatibility fallback if advanced workers are not supported.
 */
export class PgsRendererInMainThread extends PgsRendererImpl {

    public constructor(options: PgsRendererOptions, canvas: HTMLCanvasElement) {
        super();

        this.pgs = new Pgs();
        this.renderer = new Renderer(canvas);
    }

    /**
     * The PGS loader.
     * @private
     */
    private readonly pgs: Pgs;

    /**
     * The subtitle renderer, running in the main thread.
     */
    private readonly renderer: Renderer;

    protected render(index: number): void {
        const subtitleData = this.pgs.getSubtitleAtIndex(index);
        requestAnimationFrame(() => {
            this.renderer.draw(subtitleData);
        });
        this.pgs.cacheSubtitleAtIndex(index + 1);
    }

    public loadFromUrl(url: string): void {
        this.pgs.loadFromUrl(url, {
            onProgress: () => {
                this.invokeTimestampsUpdate();
            }
        }).then(() => {
            this.invokeTimestampsUpdate();
        });
    }

    public loadFromBuffer(buffer: ArrayBuffer): void {
        this.pgs.loadFromBuffer(buffer).then(() => {
            this.invokeTimestampsUpdate();
        });
    }

    /**
     * Submits the update timestamps from the pgs loader and invokes events.
     */
    private invokeTimestampsUpdate(): void {
        this.setUpdateTimestamps(this.pgs.updateTimestamps);
    }

    /**
     * Disposes the renderer.
     */
    public dispose(): void {
        // Nothing to do
    }
}
