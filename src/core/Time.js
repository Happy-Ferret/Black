/**
 * Provides time related methods.
 *
 * @cat core
 * @static
 */
/* @echo EXPORT */
class Time {
  constructor() {
  }

  /**
   * Time since start in seconds.
   * 
   * @static
   * @ignore
   * @returns {number}
   * @deprecated Use Time.now() instead.
   */
  static get time() {
    return Time.mTime;
  }

  /**
   * Time since start in seconds.
   * 
   * @static
   * @returns {number}
   */
  static get now() {
    return Time.mTime;
  }

  /**
   * Time since last frame
   * 
   * @static
   * @returns {number}
   */
  static get dt() {
    return Time.mDeltaTime;
  }

  /**
   * Gets/Sets timescale for engine
   * 
   * @returns {number}
   */
  static get scale() {
    return Time.mScale;
  }

  /**
   * @ignore
   * @param {number} value
   */
  static set scale(value) {
    Debug.assert(value >= 0, 'Time.scale must be >= 0.');

    Time.mScale = value;
  }
}

/**
 * @ignore
 * @type {number}
 */
Time.mTime = 0;

/** 
 * @ignore
 * @type {number}
 */
Time.mDeltaTime = 0;

/** 
 * @ignore
 * @type {number}
 */
Time.mScale = 1;
