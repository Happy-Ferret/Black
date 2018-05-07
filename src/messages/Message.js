/**
 * Message holds all information about dispatched event. This is a pooled object.
 *
 * @cat messages
 */
/* @echo EXPORT */
class Message {
  constructor() {
    /** @type {MessageDispatcher} The `MessageDispatcher` object, which posted this message. */
    this.sender = null;

    /** @type {string} The name of message. */
    this.name = '';

    /** @type {Object} `GameObject` which receives this message. */
    this.target = null;

    /** @type {boolean} Specifies if invocation of this message was canceled. */
    this.canceled = false;

    /** @type {MessageType} Message type. See `MessageType` enum. */
    this.type = MessageType.DIRECT;
  }

  /**
   * Cancels message invocation.
   *
   * @return {void}
   */
  cancel() {
    this.canceled = true;
  }

  // @ifdef DEBUG
  /**
   * Generates message string representation.
   *
   * @return {string}
   */
  toString() {
    let name = '';

    let isGameObject = this.sender instanceof GameObject;
    if (isGameObject === true)
      name = /** @type {GameObject}*/ (this.sender).name;

    return `MESSAGE: { name: '${this.name}', sender: '${name}', target: '${this.target.name}', path: '${this.path}' }`;
  }
  // @endif

  /**
   * @ignore
   * @returns {Message}
   */
  __reset() {
    this.sender = null;
    this.name = '';
    this.pathMask = null;
    this.componentMask = null;
    this.target = null;
    this.canceled = false;
    this.type = MessageType.DIRECT;
    return this;
  }

  /**
  * @event Message#progress
  */
  static get PROGRESS() { return 'progress'; }

  /**
   * @event Message#complete
   */
  static get COMPLETE() { return 'complete'; }
}

/**
 * Pool for messages.
 *
 * @type {ObjectPool}
 * @nocollapse
 *
 */
Message.pool = new ObjectPool(Message);