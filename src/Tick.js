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
if (!Date.now) {
	Date.now = function () {
		return new Date().valueOf();
	};
}

/**
 * Hook into requestAnimationFrame through Storm. Keeps
 * a single raf so that there aren't multiple calls or miss-calls
 * that would cause raf from functioning, e.g.:
 *
 * var update = function() { raf(update); };
 * raf(update);
 *
 * later in the application:
 * raf(update);
 *
 * Also automatically calls TWEEN if it's present
 * https://github.com/sole/tween.js/
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
		 * Stores the index of loop functions
		 * @type {Object}
		 * @private
		 */
		_hooks = {},
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
		 * Reference to requestAnimationFrame
		 * @type {requestAnimationFrame}
		 */
		_raf = root.requestAnimationFrame,
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

			_e.now = Date.now();

			while (idx < length) {
				_loop[idx](_e);
				idx += 1;
			}

			_id = root.requestAnimationFrame(_tick);
		};

	_tick(); // Auto-start

	return {
		/**
		 * Add a function to requestAnimationFrame
		 * @param  {Function} func
		 * @return {String}   id
		 */
		hook: function(func) {
			if (_.isArray(func)) {
				var idx = 0, length = func.length;
				for (; idx < length; idx++) {
					func[idx] = this.hook(func[idx]);
				}
				return func;
			}

			if (!_.isFunction(func)) { return console.error(_errorMessage(_TICK, 'Parameter must be a function'), func); }
			var id = _uniqId(_TICK);
			_hooks[id] = _loop.length;
			_loop.push(func);
			return id;
		},

		/**
		 * Remove a function from requestAnimationFrame
		 * @param  {String} id Function id
		 * @return {Storm.tick}
		 */
		unhook: function(id) {
			_loop.splice(_hooks[id], 1);
			delete _hooks[id];
			return this;
		},

		/**
		 * Check if animate is running
		 * @return {Boolean}
		 */
		isRunning: function() {
			return this._isRunning;
		},

		/**
		 * Start requestAnimationFrame calling hooked functions
		 * @return {Storm.tick}
		 */
		start: function() {
			if (_isRunning) { return this; }
			_isRunning = true;

			_tick();
			return this;
		},

		/**
		 * Stop requestAnimationFrame from calling hooked functions
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
