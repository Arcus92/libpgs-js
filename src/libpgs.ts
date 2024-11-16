// Polyfills
import "core-js/stable/promise";
import "whatwg-fetch";

import { SubtitleRenderer } from "./subtitleRenderer";
import { PgsFromBuffer } from "./pgs/pgsFromBuffer";
import { PgsFromUrl } from "./pgs/pgsFromUrl";

export { SubtitleRenderer, PgsFromUrl, PgsFromBuffer }
