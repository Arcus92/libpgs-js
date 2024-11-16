import {RendererImpl} from "./rendererImpl";
import {SubtitleRendererOptions} from "../subtitleRendererOptions";
import {Renderer} from "./renderer";
import {SubtitleDecoder} from "../subtitleDecoder";
import {SubtitleLoader} from "../subtitleLoader";
import {SubtitleSource} from "../subtitleSource";

/**
 * The implementation without web workers. This loads and renders the subtitle in the main thread.
 * This is meant as a compatibility fallback if advanced workers are not supported.
 */
export class RendererInMainThread extends RendererImpl {

    public constructor(options: SubtitleRendererOptions, canvas: HTMLCanvasElement) {
        super();

        this.renderer = new Renderer(canvas);
    }

    /**
     * The subtitle decoder.
     */
    private decoder: SubtitleDecoder | undefined;

    /**
     * The subtitle renderer, running in the main thread.
     */
    private readonly renderer: Renderer;

    protected render(index: number): void {
        if (!this.decoder) return;
        const subtitleData = this.decoder.getSubtitleAtIndex(index);
        requestAnimationFrame(() => {
            this.renderer.draw(subtitleData);
        });
        this.decoder.cacheSubtitleAtIndex(index + 1);
    }

    public load(source: SubtitleSource): void {
        this.decoder = SubtitleLoader.createDecoder(source.format, this.decoder);
        this.decoder.load(source, {
            onProgress: () => {
                this.invokeTimestampsUpdate();
            }
        }).then(() => {
            this.invokeTimestampsUpdate();
        });
    }

    /**
     * Submits the update timestamps from the subtitle loader and invokes events.
     */
    private invokeTimestampsUpdate(): void {
        if (!this.decoder) return;
        this.setUpdateTimestamps(this.decoder.updateTimestamps);
    }

    /**
     * Disposes the renderer.
     */
    public dispose(): void {
        // Nothing to do
    }
}
