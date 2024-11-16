export interface SubtitleDecoderOptions {
  /**
   * Async pgs streams can return partial updates. When invoked, the `displaySets` and `updateTimestamps` are updated
   * to the last available subtitle. There is a minimum threshold of one-second to prevent to many updates.
   */
  onProgress?: () => void;
}
