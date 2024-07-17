export enum PgsRendererResult {
  /**
   * The renderer has loaded and processed the subtitle stream.
   */
  Success,

  /**
   * The renderer is still processing the subtitle stream.
   */
  Pending,

  /**
   * Processing the subtitle stream failed due to an invalid magic number. Probably not a PGS file.
   */
  ErrInvalidMagicNumber,

  /**
   * Processing the subtitle stream failed due to an unexpected end of the stream.
   */
  ErrUnexpectedEndOfStream,

  /**
   * Processing the subtitle stream failed due to an unknown segment type.
   */
  ErrUnknownSegment,

  /**
   * Processing the subtitle stream failed due to a stream position mismatch after reading a segment.
   */
  ErrStreamPositionMismatch,

  /**
   * Loading the subtitle stream failed due to an HTTP error.
   */
  ErrHttp
}
