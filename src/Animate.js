/* Animation Frame ==================================================================
===================================================================================== */
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
Storm.animate = (function() {
	var _hooks = {}, // Stores the index of loop functions
		_loop = [], // Stores function calls
		_raf = root.requestAnimationFrame,
		_id = null,
		_isRunning = true;
		_animate = function() {
			var idx = 0,
				length = _loop.length;
			while (idx < length) {
				_loop[idx]();
				idx += 1;
			}

			_id = root.requestAnimationFrame(_animate);
		};

	_animate(); // Auto-start

	return {
		/**
		 * Add a function to requestAnimationFrame
		 * @param  {Function} func
		 * @return {String}   id
		 */
		hook: function(func) {
			if (!_.isFunction(func)) { return console.error(STORM.name +': Parameter must be a function: ', func); }
			var id = _uniqueId('Animate');
			_hooks[id] = _loop.length;
			_loop.push(func);
			return id;
		},
		/**
		 * Remove a function from requestAnimationFrame
		 * @param  {String}       id Function id
		 * @return {this}
		 */
		unhook: function(id) {
			_loop.splice(_hooks[id], 1);
			delete _hooks[id];
			return this;
		},

		isRunning: function() {
			return this._isRunning;
		},

		/**
		 * Start requestAnimationFrame calling hooked functions
		 * @return {this}
		 */
		start: function() {
			if (_isRunning) { return; }
			_isRunning = true;

			_animate();
			return this;
		},

		/**
		 * Stop requestAnimationFrame from calling hooked functions
		 * @return {this}
		 */
		stop: function() {
			if (!_isRunning) { return; }
			_isRunning = false;

			root.cancelAnimationFrame(_id);
			return this;
		}
	};
}());