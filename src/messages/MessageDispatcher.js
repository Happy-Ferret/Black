/**
 * The MessageDispatcher class is the base class for all classes that posts messages.
 *
 * Global messages will not be dispatched on non GameObject objects.
 *
 * @cat messages
 */
/* @echo EXPORT */
class MessageDispatcher {
  constructor() {
    this.mListeners = null;
  }

  /**
   * Adds listener by given name and callback.
   *
   * @public
   * @param {string} message Message name.
   * @param {Function} callback Function to be called on message send.
   * @param {*} [context=null] Object to be used as `this` in callback function.
   * @return {void}
   */
  on(name, cb, context) {
    return this.__on(name, cb, false, context);
  }

  /**
   * Adds listener by given name and callback. Binding will be automatically removed after first execution.
   *
   * @public
   * @param {string} message Message name.
   * @param {Function} callback Function to be called on message send.
   * @param {*} [context=null] Object to be used as `this` in callback function.
   * @return {void}
   */
  once(name, cb, context) {
    return this.__on(name, cb, true, context);
  }

  /**
   * Posts message with a given params.
   * 
   * Adding `~` character to the begging of the name will bubble message to the top of the tree.
   *
   * @public
   * @param {string} message  The name of a message
   * @param {...*} params A list of params to send
   * @return {void}
   */
  post(name, ...params) {
    let message = this.__draftMessage(name);

    if (message.type === MessageType.DIRECT)
      this.__invoke(this, message, ...params);
    else if (message.type === MessageType.BUBBLE)
      this.__postBubbles(this, message, true, ...params);

    if (message.canceled === false)
      this.__invokeOverheard(this, message, ...params);

    Message.pool.release(message);
  }

  /**
   * Returns parent MessageDispatcher.
   * 
   * @readonly
   * @return {MessageDispatcher|null}
   */
  get parent() {
    return null;
  }

  /**
   * Returns the stage Game Object to which this belongs to or null if not added onto stage.
   *
   * @readonly
   * @return {Stage|null}
   */
  get stage() {
    return null;
  }

  /**
   * Returns string representing a url like path to this object in the display
   * tree.
   *
   * @readonly
   * @return {string|null}
   */
  get path() {
    return null;
  }

  /**
   * @private
   * @ignore
   * @param {string} name
   * @param {Function} callback
   * @param {boolean} [isOnce=false]
   * @param {*} [context=null]
   * @return {void}
   */
  __on(name, callback, isOnce = false, context = null) {
    Debug.assert(name !== null, 'name cannot be null.');
    Debug.assert(name.trim().length > 0, 'name cannot be null.');
    Debug.assert(!(name.indexOf('~') === 0), 'Using `~` is not tot allowed here.');
    Debug.assert(callback !== null, 'callback cannot be null.');

    let earIndex = name.indexOf('@');
    if (earIndex !== -1) {
      let messageName = name.substring(0, earIndex);
      let pathPattern = name.substring(earIndex + 1);
      let global = MessageDispatcher.mOverheardHandlers;

      if (global.hasOwnProperty(messageName) === false)
        global[messageName] = [];

      let bindings = global[messageName];
      bindings.push(new MessageBinding(this, messageName, callback, isOnce, context, pathPattern));
      return;
    }

    if (this.mListeners === null)
      this.mListeners = {};

    if (this.mListeners.hasOwnProperty(name) === false)
      this.mListeners[name] = [];

    let binding = new MessageBinding(this, name, callback, isOnce, context);
    this.mListeners[name].push(binding);

    return binding;
  }

  /**
   * @ignore
   * @param {MessageBinding} binding 
   */
  __off(binding) {
    if (this.mListeners === null)
      return;

    if (this.mListeners.hasOwnProperty(binding.name) === false)
      return;

    let bindings = this.mListeners[binding.name];
    const ix = bindings.indexOf(binding);
    if (ix === -1)
      return;

    bindings.splice(ix, 1);
  }

  /**
   * @private
   * @ignore
   * @param {MessageDispatcher} sender 
   * @param {Message} message 
   * @param {...*} params 
   * @return {void}
   */
  __invoke(sender, message, ...params) {
    if (message.canceled === true)
      return;

    if (this.mListeners === null)
      return;

    if (this.stage === null && (this instanceof Stage) === false)
      return;

    let bindings = (this.mListeners[message.name]);

    if (bindings === undefined || bindings.length === 0)
      return;

    let cloned = bindings.slice(0);

    for (let i = 0; i < cloned.length; i++) {
      message.target = this;

      let binding = cloned[i];
      binding.callback.call(binding.context, message, ...params);

      if (binding.isOnce === true)
        this._off(binding);

      if (message.canceled === true)
        return;
    }
  }

  /**
   * @private
   * @ignore
   * @param {MessageDispatcher}  sender
   * @param {Message}  message
   * @param {...*} params
   * @return {void}
   */
  __invokeOverheard(sender, message, ...params) {
    if (message.canceled === true)
      return;

    let bindings = MessageDispatcher.mOverheardHandlers[message.name];

    if (bindings === undefined || bindings.length === 0)
      return;

    let cloned = bindings.slice(0);

    for (let i = 0; i < cloned.length; i++) {
      let binding = cloned[i];

      if (binding.owner.stage === null)
        continue;

      if (!this.__checkPath(sender.path, binding))
        continue;

      message.target = this;
      binding.callback.call(binding.context, message, ...params);

      if (binding.isOnce === true)
        this._off(binding);

      if (message.canceled === true)
        return;
    }
  }

  /**
   * Message will always reach the stage even if some of the middle nodes were removed during process of invocation.
   * 
   * @private
   * @ignore
   * @param {*}  sender
   * @param {Message}  message
   * @param {boolean}  toTop
   * @param {...*} params
   * @return {void}
   */
  __postBubbles(sender, message, toTop, ...params) {
    message.origin = this;

    let list = [this];

    let current = this;
    while (current.parent !== null) {
      list.push(current.parent);
      current = current.parent;
    }

    for (let i = 0; i < list.length; i++) {
      let dispatcher = list[i];
      dispatcher.__invoke(sender, message, ...params);

      if (message.canceled === true)
        return;
    }
  }

  /**
   * @private
   * @ignore
   * 
   * @param {string} name 
   * @returns {Message}
   */
  __draftMessage(name) {
    const message = Message.pool.get();
    message.__reset();

    message.sender = this;

    if (name.startsWith('~') === true) {
      message.name = name.substr(1);
      message.type = MessageType.BUBBLE;
    } else {
      message.name = name;
    }

    return message;
  }

  /**
   * @ignore
   * @private
   * @param {string} path
   * @param {MessageBinding} binding
   * @returns {boolean}
   */
  __checkPath(path, binding) {
    if (path === null || binding.pathPattern === null)
      return false;

    if (path === binding.pathPattern)
      return true;

    if (binding.pathPattern.indexOf('*') === -1)
      return path === binding.pathPattern;
    
    return binding.glob.test(path);
  }
}

/**
 * @private
 * @type {Object.<string, Array>}
 */
MessageDispatcher.mOverheardHandlers = {};