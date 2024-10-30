# libpgs-js

This library renders the graphical subtitles format PGS _(.sup files)_ in the browser.

## Work in progress

This project is still in progress. It should be able to play 99% of Blu-ray subtitles _(Yes, I made that number up)_. 
But some rare used PGS features - like cropping - aren't implemented yet.

If you know a movie or show that is using the cropping feature, please let me know!

## Requirements

This library requires the following web features:
- [Web Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) *(optional sine 0.6.0)*
- [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) *(optional sine 0.5.0)*
  - If available rendering is done inside the web-worker. If `transferControlToOffscreen` isn't supported a fallback 
  is used where the subtitles are renderer on the main thread.

## Usage

Install the package via npm:
```
npm i --save libpgs
```

### Create with default canvas

The PGS renderer will create a default canvas element next to the video element:

```javascript
const videoElement = document.getElementById('video-element');
const pgsRenderer = new libpgs.PgsRenderer({
  // Make sure your bundler keeps this file accessible from the web!
  workerUrl: './node_modules/libpgs/dist/libpgs.worker.js', 
  video: videoElement,
  subUrl: './subtitle.sup'
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
const pgsRenderer = new libpgs.PgsRenderer({
  // Make sure your bundler keeps this file accessible from the web!
  workerUrl: './node_modules/libpgs/dist/libpgs.worker.js',
  video: videoElement,
  canvas: canvasElement,
  subUrl: './subtitle.sup'
});
```

### Time offset

You can also adjust time offset between video and subtitle:

```javascript
// Rendering the subtitle 3 seconds in advance of the video
pgsRenderer.timeOffset = 3.0;
```

### Destroy

Make sure to dispose the renderer when leaving:

```javascript
// Releases video events and removes the default canvas element
pgsRenderer.dispose();
```

## Licence

[MIT License](LICENSE)
