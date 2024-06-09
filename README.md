# libpgs-js

This library renders the graphical subtitles format PGS _(.sub / .sup)_ in the browser.

## Usage

Install the package via npm:
```
npm i --save libpgs
```

```html
<div style="position: relative">
    <video id="video-element" src="./video.mp4"></video>
</div>
```

```javascript
const videoElement = document.getElementById('video-element');
const pgsRenderer = new libpgs.PgsRenderer({
    video: videoElement,
    subUrl: './subtitle.sup'
});
```

## Licence

[MIT License](LICENSE)
