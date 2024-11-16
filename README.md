# libpgs-js

This library renders the graphical subtitles format PGS _(.sup files)_ in the browser.

## Requirements

This library makes use of [Web Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) and [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) for faster and optimized rendering if
available. Backwards compatibility was tested as far back as Chrome 68 and WebOS 1.2.

## Usage

Install the package via npm:
```
npm i --save libpgs
```

### Create with default canvas

The PGS renderer will create a default canvas element next to the video element:

```javascript
const videoElement = document.getElementById('video-element');
const subtitleRenderer = new libpgs.SubtitleRenderer({
  // Make sure your bundler keeps this file accessible from the web!
  workerUrl: './node_modules/libpgs/dist/libpgs.worker.js', 
  video: videoElement,
  source: new libpgs.PgsFromUrl('./subtitle.sup')
});
```

The created default canvas element is using a style definition like this:

```css
position: absolute;
left: 0;
top: 0;
right: 0;
bottom: 0;
width: '100%';
height: '100%';
pointer-events: 'none';
object-fit: 'contain';
```

This only works if the video element is stretched in its parent and if the parent is using the css `position` property.

```html
<div style="position: relative">
    <video id="video-element" src="./video.mp4"></video>
</div>
```

### Create with custom canvas

It is also possible to provide a custom canvas element and position it manually:

```javascript
const videoElement = document.getElementById('video-element');
const canvasElement = document.getElementById('canvas-element');
const subtitleRenderer = new libpgs.SubtitleRenderer({
  // Make sure your bundler keeps this file accessible from the web!
  workerUrl: './node_modules/libpgs/dist/libpgs.worker.js',
  video: videoElement,
  canvas: canvasElement, 
  source: new libpgs.PgsFromUrl('./subtitle.sup')
});
```

### Time offset

You can also adjust time offset between video and subtitle:

```javascript
// Rendering the subtitle 3 seconds in advance of the video
subtitleRenderer.timeOffset = 3.0;
```

### Destroy

Make sure to dispose the renderer when leaving:

```javascript
// Releases video events and removes the default canvas element
subtitleRenderer.dispose();
```

## Licence

[MIT License](LICENSE)
