// Tick ##########################################################################

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
(function() {
	var lastTime = 0,
		vendors = ['ms', 'moz', 'webkit', 'o'],
		idx = 0, length = vendors.length;
	for (; idx < length && !root.requestAnimationFrame; idx++) {
		root.requestAnimationFrame = root[vendors[idx] + 'RequestAnimationFrame'];
		root.cancelAnimationFrame = root[vendors[idx] + 'CancelAnimationFrame'] || root[vendors[idx] + 'CancelRequestAnimationFrame'];
	}

	if (!root.requestAnimationFrame) {
		root.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime(),
				timeToCall = Math.max(0, 16 - (currTime - lastTime)),
				id = root.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (!root.cancelAnimationFrame) {
		root.cancelAnimationFrame = function(id) { clearTimeout(id); };
	}
}());

// Date.now polyfill
var _now = (function(Date) {

	return Date.now || function() {
		return new Date().valueOf();
	};

}(Date));

/**
 * A hook into a polyfilled `requestAnimationFrame`.
 * Keeps a single raf that can be hooked into and
 * prevent multiple implementations of raf.
 *
 * @namespace Storm.tick
 */
Storm.tick = (function() {

		/**
		 * The name of the class
		 * @const
		 * @type {String}
		 * @private
		 */
	var _TICK = 'tick',
		/**
		 * Our event object (for reuse)
		 * @type {Object}
		 */
		_e = {},
		/**
		 * Stores function calls
		 * @type {Array.<Function>}
		 * @private
		 */
		_loop = [],
		/**
		 * The id of this animation until another
		 * is called
		 * @type {Id}
		 * @private
		 */
		_id = null,
		/**
		 * Whether the _loop is running
		 * @type {Boolean}
		 * @private
		 */
		_isRunning = true,
		/**
		 * Runs the functions in the _loop
		 * @private
		 */
		_tick = function() {
			var idx = 0,
				length = _loop.length;

			_e.now = _now();

			while (idx < length) {
				_loop[idx](_e);
				idx += 1;
			}

			_id = root.requestAnimationFrame(_tick);
		};

	_tick(); // Auto-start

	return /** @lends Storm.tick */ {
		/**
		 * Add a function to `raf`.
		 * @param  {Function|Array.<Function>} func A function or an array of functions to hook.
		 * @return {Id|Array.<Id>} Unique ID assigned to the hook, or an array of unique IDs if <code>func</code> was an array of functions.
		 */
		hook: function(func) {
			if (_.isArray(func)) {
				var ids = [],
					idx = 0,
					length = func.length;
				for (; idx < length; idx++) {
					ids[idx] = this.hook(func[idx]);
				}
				return ids;
			}

			if (!_.isFunction(func)) {
				return console.error(_errorMessage(_TICK, 'Parameter must be a function'), func);
			}

			var id = _uniqId(_TICK);
			func.__hook__ = id;
			_loop.push(func);
			return id;
		},

		/**
		 * Remove a function from `raf`.
		 * @param  {Id} id Hook function ID to remove.
		 * @return {Storm.tick}
		 */
		unhook: function(id) {
			// Quick indexOf check based
			// on the loop function __hook__
			var index = -1,
				idx = _loop.length;
			while (idx--) {
				if (_loop[idx].__hook__ === id) {
					index = idx;
					break;
				}
			}

			// id wasn't in the loop ;()
			if (index === -1) { return this; }

			_loop.splice(index, 1);
			return this;
		},

		/**
		 * Check if animate is running.
		 * @return {Boolean}
		 */
		isRunning: function() {
			return _isRunning;
		},

		/**
		 * Start `raf` calling hooked functions.
		 * @return {Storm.tick}
		 */
		start: function() {
			if (_isRunning) { return this; }
			_isRunning = true;

			_tick();
			return this;
		},

		/**
		 * Stop `raf` from calling hooked functions.
		 * @return {Storm.tick}
		 */
		stop: function() {
			if (!_isRunning) { return this; }
			_isRunning = false;

			root.cancelAnimationFrame(_id);
			return this;
		}
	};
}());
