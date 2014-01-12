/*! StormJS - v0.0.1 - 2014-01-12
 * https://github.com/dci-artform/StormJS
 * Copyright (c) 2012-2014 Joe Clay; Licensed  */
(function(root, _, Signal, undefined) {
	// "root" is a safe reference to the environment.
	// setup so that this can be used in a node environment

//----

// Hold on to previous Storm reference (can release with noConflict)
var previousStorm = root.Storm,
	// Define Storm
	Storm = root.Storm = {
		name: 'StormJS',
		VERSION: '0.0.1',
		ajax: root.$ || { ajax: function() { console.error(_errorMessage('Storm.ajax', 'NYI')); } },
		$: root.$ || function() { console.error(_errorMessage('Storm.$', 'NYI')); }
	};

//----

// Helpers ##########################################################################

// Small polyfill for console
var console = root.console || {};
console.log = console.log || function() {};
console.error = console.error || console.log;

/**
 * Easy slice function for array duplication
 * @param  {Array} arr
 * @return {Array} duplicate
 * @private
 */
var _slice = (function(ARRAY) {
	return function(arr) {
		ARRAY.slice.call(arr);
	};
}([]));

/**
 * Existance check
 * @param  {Value} value
 * @return {Boolean}
 * @private
 */
var _exists = function(value) {
	return (value !== null && value !== undefined);
};

/**
 * Format a string using an object. Keys in the object
 * will match {keys} in the string
 * @return {String} e.g. _stringFormat('hello {where}', { where: 'world' }) === 'hello world'
 * @private
 */
var _stringFormat = (function() {

	var _REGEX = new RegExp('{([^}])+}', 'g');

	return function(str, fill) {
		return str.replace(_REGEX, function(capture, value) {
			return fill[value] || '';
		});
	};

}());

/**
 * Normalize how Storm returns strings of its
 * objects for debugging
 * @param  {String} name  required
 * @param  {Object} props [optional]
 * @return {String}
 * @private
 */
var _toString = function(name, props) {
	var hasProps = _exists(props);

	if (hasProps) {	
		var key, arr = [];
		for (key in obj) {
			arr.push(key + ': '+ obj[key]);
		}
		props = arr.join(', ');
	}
	
	return _stringFormat('[{storm}: {name}{spacer}{props}]', {
		storm: Storm.name,
		name: name,
		spacer: hasProps ? ' - ' : '',
		props: hasProps ? props : ''
	});
};

/**
 * Normalize how Storm logs an error message for debugging
 * @param  {String} name  required
 * @param  {String} message required
 * @return {String}
 * @private
 */
var _errorMessage = function(name, message) {
	return _stringFormat('{storm}: {name}, {message}', {
		storm: Storm.name,
		name: name,
		message: message
	});
};

//----

// Mixin ############################################################################

/**
 * Mix a key-value into Storm, protecting Storm from
 * having a pre-existing key overwritten. Of course,
 * items can be directly assigned to Storm via Storm.foo = foo;
 * but in this framework, I'm considering it a bad practice
 * @param  {String} name
 * @param  {Value} prop
 * @private
 */
var _mixin = function(name, prop) {
	if (Storm[name] !== undefined) { return console.error(_errorMessage('mixin', 'Cannot mixin. "'+ name +'" already exists: '), name, Storm[name], prop); }
	Storm[name] = prop;
};

/**
 * Protect Storm from mixins that would overwrite pre-existing keys.
 * @param  {String||Object} name Name of the object
 * @param  {Object}         prop The object to mixin
 */
Storm.mixin = function(name, prop) {
	// Mix single
	if (_.isString(name)) {
		_mixin(name, prop);
	}

	// Mix multiple
	var key;
	for (key in name) {
		_mixin(key, name[key]);
	}
};


//----

// Unique Id ########################################################################

	/**
	 * Generate a unique id
	 * @param  {String}         prefix [optional] Defines a scope for the identifiers
	 * @return {Number||String} id
	 * @private
	 */
var _uniqId = Storm.uniqId = (function() {
		
		var _scopedIdentifiers = {};

		return function(scope) {
			scope = scope || '';
			var inc = (_scopedIdentifiers[scope] || 0) + 1;
			return (_scopedIdentifiers[scope] = inc);
		};
		
	}()),
	/**
	 * Generates a unqiue id string - prefixed with the scope
	 * @param  {String} scope
	 * @return {String} id
	 * @private
	 */
	_uniqIdStr = Storm.uniqIdStr = function(scope) {	
		return (scope || 'id') + '' + _uniqId(scope);
	};

//----

// Extend ###########################################################################

/**
 * Prototypical class extension
 * From: https://github.com/JosephClay/Extend.git
 * @param {Function} constructor   optional
 * @param {Object}   extension     optional
 */
var Extend = Storm.Extend = function(constructor, extension) {
	var hasConstructor = (typeof constructor === 'function');
	if (!hasConstructor) { extension = constructor; }

	var self = this,
		fn = function() {
			var ret = self.apply(this, arguments);
			if (hasConstructor) {
				ret = constructor.apply(this, arguments);
			}
			return ret;
		};

	// Add properties to the object
	_.extend(fn, this);

	// Duplicate the prototype
	var NoOp = function() {};
	NoOp.prototype = this.prototype;
	fn.prototype = new NoOp();

	// Merge the prototypes
	_.extend(fn.prototype, this.prototype, extension);
	fn.prototype.constructor = constructor || fn;

	return fn;
};

//----

// Events ###########################################################################

/**
 * Proxy to Signal. Use "Events" internally
 * so that it's easier to change to a different
 * pub/sub system if need be
 * @class  Events
 * @type {Signal}
 */
var Events = Storm.Events = Signal;

/**
 * Instantiate and merge a new Event system
 * into Storm so that Storm can be used as
 * a pub/sub
 */
_.extend(Storm, Events.core.construct());

//----

// Promise ##########################################################################

	/**
	 * The name of the class
	 * @type {String}
	 * @private
	 */
var _PROMISE = 'Promise',
	/**
	 * Status values, determines
	 * what the promise's status is
	 * @type {Object}
	 */
	_PROMISE_STATUS = {
		idle:       0,
		progressed: 1,
		failed:     2,
		done:       3
	},
	/**
	 * Call values, used to determine
	 * what kind of functions to call
	 * @type {Object}
	 */
	_PROMISE_CALL = {
		done:     0,
		fail:     1,
		always:   2,
		progress: 3,
		pipe:     4
	},
	_PROMISE_CALL_NAME = _.invert(_PROMISE_CALL);

/**
 * A lightweight implementation of promises.
 * API based on jQuery.promise: https://api.jquery.com/promise/
 * @class Promise
 */
var Promise = Storm.Promise = function() {
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_PROMISE);

	/**
	 * Registered functions organized by _PROMISE_CALL
	 * @type {Object}
	 */
	this._calls = {};

	/**
	 * Current status
	 * @type {Number}
	 */
	this._status = _PROMISE_STATUS.idle;
};

Promise.STATUS = _PROMISE_STATUS;
Promise.CALL = _PROMISE_CALL;

Promise.prototype = {
	/** @constructor */
	constructor: Promise,

	/**
	 * Register a done call that is fired after a Promise is resolved
	 * @param  {Function}
	 * @return {Promise}
	 */
	done: function(func) { return this._pushCall.call(this, _PROMISE_CALL.done, func); },
	/**
	 * Register a fail call that is fired after a Promise is rejected
	 * @param  {Function}
	 * @return {Promise}
	 */
	fail: function(func) { return this._pushCall.call(this, _PROMISE_CALL.fail, func); },
	/**
	 * Register a call that fires after done or fail
	 * @param  {Function}
	 * @return {Promise}
	 */
	always: function(func) { return this._pushCall.call(this, _PROMISE_CALL.always, func); },
	/**
	 * Register a progress call that is fired after a Promise is notified
	 * @param  {Function}
	 * @return {Promise}
	 */
	progress: function(func) { return this._pushCall.call(this, _PROMISE_CALL.progress, func); },
	/**
	 * Register a pipe call that is fired before done or fail and whose return value
	 * is passed to the next pipe/done/fail call
	 * @param  {Function}
	 * @return {Promise}
	 */
	pipe: function(func) { return this._pushCall.call(this, _PROMISE_CALL.pipe, func); },

	/**
	 * Pushes a function into a call array by type
	 * @param  {CALL[type]} callType
	 * @param  {Function} func
	 * @return {Promise}
	 * @private
	 */
	_pushCall: function(callType, func) {
		this._getCalls(callType).push(func);
		return this;
	},

	/**
	 * Notify the promise - calls any functions in
	 * Promise.progress
	 * @return {Promise}
	 */
	notify: function() {
		this._status = _PROMISE_STATUS.progressed;

		var args = this._runPipe(arguments);
		this._fire(_PROMISE_CALL.progress, args)._fire(_PROMISE_CALL.always, args);

		return this;
	},

	/**
	 * Reject the promise - calls any functions in
	 * Promise.fail, then calls any functions in
	 * Promise.always
	 * @return {Promise}
	 */
	reject: function() {
		this._status = _PROMISE_STATUS.failed;

		// Never run the pipe on fail. Simply fail.
		// Running the pipe after an unexpected failure may lead to
		// more failures
		this._fire(_PROMISE_CALL.fail, arguments)._fire(_PROMISE_CALL.always, arguments);

		return this;
	},
	
	/**
	 * Resolve the promise - calls any functions in
	 * Promise.done, then calls any functions in
	 * Promise.always
	 * @return {Promise}
	 */
	resolve: function() {
		this._status = _PROMISE_STATUS.done;

		var args = this._runPipe(arguments);
		this._fire(_PROMISE_CALL.done, args)._fire(_PROMISE_CALL.always, args);

		return this;
	},

	/**
	 * Determine if the promise is in the status provided
	 * @param  {String || Number}  STATUS key or STATUS value
	 * @return {Boolean}
	 */
	is: function(status) {
		if (_.isNumber(status)) { return (this._status === status); }
		return (this._status === Promise.STATUS[status]);
	},

	/**
	 * Returns the status of the Promise
	 * @return {Number} STATUS
	 */
	status: function() {
		return this._status;
	},

	/**
	 * Fires a _PROMISE_CALL type with the provided arguments
	 * @param  {CALL[type]} callType
	 * @param  {Array} args
	 * @return {Promise}
	 * @private
	 */
	_fire: function(callType, args) {
		var calls = this._getCalls(callType),
			idx = 0, length = calls.length;
		for (; idx < length; idx++) {
			calls[idx].apply(null, args);
		}
		return this;
	},

	/**
	 * Runs the pipe, catching the return value
	 * to pass to the next pipe. Returns the
	 * arguments to used by the calling method
	 * to proceed to call other methods (e.g. done/fail/always)
	 * @param  {Array} args
	 * @return {Array} args
	 * @private
	 */
	_runPipe: function(args) {
		var pipes = this._getCalls(_PROMISE_CALL.pipe),
			idx = 0, length = pipes.length, val;
		for (; idx < length; idx++) {
			val = pipes[idx].apply(null, args);
			if (val !== undefined) { args = [val]; }
		}

		return args;
	},

	/**
	 * Lazy generate arrays based on type to
	 * avoid creating disposable arrays for 
	 * methods that aren't going to be used/called
	 * @param  {CALL[type]} type 
	 * @return {Array}
	 * @private
	 */
	_getCalls: function(type) {
		return this._calls[_PROMISE_CALL_NAME[callType]] || (this._calls[_PROMISE_CALL_NAME[callType]] = []);
	},

	/**
	 * Allows a promise to be called like a
	 * Function.call() or Function.apply()
	 * 
	 * Very usefull for passing a promise as
	 * a callback function to 3rd party code
	 * (as long as the third party code doesn't
	 * try to invoke the Promise directly)
	 */
	call: function() {
		var args = _.toArray(arguments);
		args.splice(0, 1); // Throw away the context
		this.notify.apply(this, args);
	},
	apply: function(ctx, args) {
		this.notify.apply(this, args);
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_PROMISE, {
			id: this._id,
			status: _.invert(_PROMISE_STATUS)[this._status],
			done: this._getCalls(_PROMISE_CALL.done).length,
			fail: this._getCalls(_PROMISE_CALL.fail).length,
			always: this._getCalls(_PROMISE_CALL.always).length,
			progress: this._getCalls(_PROMISE_CALL.progress).length,
			pipe: this._getCalls(_PROMISE_CALL.pipe).length
		});
	}
};


//----

// When #############################################################################

/**
 * When to go with Promise. Used by calling Storm.when() and passing
 * promises to listen to. Storm.when can be chained with multiple calls
 * e.g. Storm.when(p1, p2, p3).then(func).then(func).done(func).always(func);
 */
var When = Storm.when = (function(Promise) {

	/**
	 * The when object. It's not exposed to the user,
	 * they only see a promise (with a .then() method),
	 * but all the magic happens here
	 */
	var When = function() {
		/**
		 * Store our promise
		 * @type {Promise}
		 */
		this._p = null;

		/**
		 * Store the promises being listened to
		 * @type {Array[Promise]}
		 */
		this._events = [];
	};

	When.prototype = {
		/** @constructor */
		constructor: When,

		/**
		 * Called by the public Storm.when function to initialize
		 * the when object
		 * @return {Promise}
		 */
		init: function() {
			this._events = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments);
			this._subscribe();

			var promise = new Promise();
			promise.then = function() { this.done.apply(this, arguments); };
			this._p = promise;
			return promise; // Return the promise so that it can be subscibed to
		},

		/**
		 * Subscribe to the promises passed and react
		 * when they fire events
		 * @private
		 */
		_subscribe: function() {
			var check = _.bind(this._checkStatus, this),
				fireProgress = _.bind(this._fireProgress, this),
				events = this._events,
				idx = events.length;
			while (idx--) {
				events[idx].done(check).fail(check).progress(fireProgress);
			}
		},

		/**
		 * Check the status of all promises when
		 * any one promise fires an event
		 * @private
		 */
		_checkStatus: function() {
			var events = this._events, evt,
				total = events.length,
				done = 0, failed = 0,
				idx = total;
			while (idx--) {
				evt = events[idx];
				// We're waiting for everything to complete
				// so if there's an item with no status, stop
				if (evt.status === Promise.STATUS.idle) { return; }
				if (evt.status === Promise.STATUS.done) { done += 1; continue; }
				if (evt.status === Promise.STATUS.failed) { failed += 1; continue; }
			}
			this._fire(total, done, failed, arguments);
		},

		/**
		 * Based on the statuses of our promises, fire the
		 * appropriate events
		 * @param  {Number}   total  total number of promises
		 * @param  {Number}   done   promises in a done state
		 * @param  {Number}   failed promises in a failed state
		 * @param  {Array}    args   arguments to pass
		 * @private
		 */
		_fire: function(total, done, failed, args) {
			var promise = this._p; // Our promise

			// If everything completed, call done (this will call always)
			if (done === total) { return promise.resolve.apply(promise, args); }
			
			// If everything failed, call fail (this will call always)
			if (failed === total) { return promise.reject.apply(promise, args); }
		
			// If everything fired, but they're not all one thing, then just call always.
			// The only way to do that without exposing a public function in Promise is
			// to use the private _fire event
			if ((done + failed) === total) { return promise._fire(Promise.CALL.always, args); }
		},

		/**
		 * Handled separately from fire because we want to trigger
		 * anytime any of the promises progress regardless of sate
		 * @private
		 */
		_fireProgress: function() {
			var promise = this._p;
			promise.notify.apply(promise, arguments);
		}
	};

	return function() {
		var w = new When();
		return w.init.apply(w, arguments);
	};

}(Promise));

//----

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
		 * @type {Array}
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
		 * @return {Tick}
		 */
		unhook: function(id) {
			_loop.splice(_hooks[id], 1);
			delete _hooks[id];
			return this;
		},

		/**
		 * Check if animate is running
		 * @return {Tick}
		 */
		isRunning: function() {
			return this._isRunning;
		},

		/**
		 * Start requestAnimationFrame calling hooked functions
		 * @return {Tick}
		 */
		start: function() {
			if (_isRunning) { return; }
			_isRunning = true;

			_tick();
			return this;
		},

		/**
		 * Stop requestAnimationFrame from calling hooked functions
		 * @return {Tick}
		 */
		stop: function() {
			if (!_isRunning) { return; }
			_isRunning = false;

			root.cancelAnimationFrame(_id);
			return this;
		}
	};
}());

//----

// Request ##########################################################################

var _REQUEST = 'request',

	/**
	 * Stores in-progress AjaxCalls by id
	 * @type {Object}
	 */
	_requestsRecords = {},

	/**
	 * Private AjaxCall tracker. Only gets called from AjaxCall
	 * when the state of the call changes
	 * @private
	 */
	Request = {

		/**
		 * Called when an AjaxCall is sent, notifies Storm.request
		 * Records the call in the records
		 * @param  {AjaxCall} call
		 */
		send: function(call) {
			// this call is already being tracked, stop
			if (_requestsRecords[call.getId()]) { return; }
			_requestsRecords[call.getId()] = call;
			
			Storm.request.trigger('send', call);
		},

		/**
		 * Called when an AjaxCall is done, notifies Storm.request
		 * @param  {AjaxCall}   call
		 */
		done: function(call) {
			Storm.request.trigger('done', call);
		},

		/**
		 * Called when an AjaxCall fails, notifies Storm.request
		 * @param  {AjaxCall}   call
		 */
		fail: function(call) {
			Storm.request.trigger('fail', call);
		},

		/**
		 * Called when an AjaxCall is aborted, notifies Storm.request
		 * @param  {AjaxCall}   call
		 */
		abort: function(call) {
			Storm.request.trigger('abort', call);
		},

		/**
		 * Called when an AjaxCall is done/aborted/failed, notifies Storm.request
		 * Removes the call from the records
		 * @param  {AjaxCall}   call
		 */
		always: function(call) {
			// This call is not being tracked, stop
			if (!_requestsRecords[call.getId()]) { return; }
			delete _requestsRecords[call.getId()];
			
			Storm.request.trigger('always', call);
		}
	};

/**
 * Ajax tracking mechanism. Operates via events
 * passing the AjaxCalls that trigger the events.
 *
 * Possible events are: 'send', done', 'fail', 'abort', 'always'
 */
Storm.request = Events.core.construct();
_.extend(Storm.request, {
	
	/**
	 * Get the requests in-progress
	 * @return {Object}
	 */
	getQueue: function() {
		return _requestsRecords;
	},

	/**
	 * Get the total number of requests in-progress
	 * @return {Number}
	 */
	getTotal: function() {
		return _.size(_requestsRecords);
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_REQUEST);
	}	
});

//----

// Ajax Call ########################################################################

	/**
	 * The name of the class
	 * @type {String}
	 * @private
	 */
var _AJAX_CALL = 'AjaxCall',
	/**
	 * Available classifications for a call to reside in.
	 * Gives flexibility to a call to be in a classification
	 * that gives it meaning to the application and not the
	 * server 
	 * @type {Object[Number]}
	 */
	_CLASSIFICATION = {
		nonblocking: 0,
		blocking: 1
	};
	_addClassification = function(type) {
		// The type has already been defined
		if (type in _CLASSIFICATION) { return; }

		// Using _.size ensures a unique id
		// for the type passed
		_CLASSIFICATION[type] = _.size(_CLASSIFICATION);
	};

/**
 * A wrapper for an ajax "call" configuration (referred to as a call
 * within AjaxCall). This object can ajax, abort and be passed
 * around the application.
 *
 * @class AjaxCall
 * @param {Object} callObj
 * @param {Object} opts
 * @param {Object} callTemplate
 */
var AjaxCall = Storm.AjaxCall = function(callObj, opts, callTemplate) {
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_AJAX_CALL);

	/**
	 * The call object that will be sent to Storm.ajax
	 * @type {Object}
	 * @private
	 */
	this._call = this._configure(callObj, opts, callTemplate);
};

_.extend(AjaxCall, {
	CLASSIFICATION: _CLASSIFICATION,

	/**
	 * Add a classification type to the AjaxCall
	 * as a global option
	 * @param {String || Array} type
	 */
	addClassification: function(type) {
		if (_.isArray(type)) {
			var idx = 0, length = type.length;
			for (; idx < length; idx++) {
				_addClassification(type[idx]);
			}
		} else {
			_addClassification(type);
		}
	}
});

AjaxCall.prototype = {
	/** @constructor */
	constructor: AjaxCall,

	/**
	 * Defaults
	 * @type {Object}
	 */
	defaults: {
		name: '',
		type: 'GET',
		content: 'application/json; charset=utf-8',
		url: '',
		cache: false,
		/**
		 * The classification of this call.
		 * @type {Number} classification id
		 * @default nonblocking
		 */
		classification: _CLASSIFICATION.nonblocking
	},

	/**
	 * Configure the call object so that it's ready to ajax
	 * @param  {Object} providedCall call object
	 * @param  {Object} opts      configurations for the url
	 * @return {Object} call
	 * @private
	 */
	_configure: function(providedCall, opts, callTemplate) {
		var call = _.extend({}, this.defaults, callTemplate, providedCall);

		call.url = _stringFormat(call.url, opts);

		return call;
	},

	/**
	 * Get or set the data on the call. Passing a parameter
	 * will set the data where-as no parameters will return
	 * the data on the call
	 * @param  {Value || undefined} data
	 * @return {Value || AjaxCall}
	 */
	data: function(data) {
		if (!arguments.length) { return this._call.data; }
		
		this._call.data = data;
		return this;
	},

	/**
	 * Returns the call object
	 * @return {Object}
	 */
	getConfiguration: function() {
		return this._call;
	},

	/**
	 * Get the private id of the AjaxCall
	 * @return {Number} id
	 */
	getId: function() {
		return this._id;
	},

	/**
	 * Determine if the type passed is the same as this
	 * call's configuration
	 * @param  {String}  type GET, POST, PUT, DELETE 
	 * @return {Boolean}
	 */
	isType: function(type) {
		return (type.toUpperCase() === this._call.type.toUpperCase());
	},

	/**
	 * Determine if the classification passed is the same as this
	 * call's classification
	 * @param  {Number}  Storm.AjaxCall.CLASSIFICATION
	 * @return {Boolean}
	 */
	isClassification: function(type) {
		return (type === this._call.classification);
	},

	/**
	 * Gets a property on the call configuration
	 * @param  {String} key    the key to get from the configuration
	 * @return {Value}
	 */
	get: function(key) {
		return this.call[key];
	},
	
	/**
	 * Sets a property on the call configuration
	 * @param  {String} key    the key to replace in the configuration
	 * @param  {Value}  value  the value to apply
	 * @return {AjaxCall}
	 */
	set: function(key, value) {
		this.call[key] = value;
		return this;
	},

	/**
	 * Uses Storm.ajax to ajax the stored call object
	 * @param  {Storm.Promise} promise optional
	 * @return {Storm.ajax} request
	 */
	send: function(promise) {
		var self = this,
			call = this.call;

		var request = this.request = STORM.ajax.ajax({
			type: call.type,
			url: call.url,
			contentType: call.content,
			data: call.data,
			cache: call.cache,
			success: function(data) {
				if (promise) { promise.resolve(data); }
				self.success.apply(self, arguments);
				Request.done(self);
			},
			error: function(req, status, err) {
				if (promise) { promise.reject(req); }

				// Abort
				if (req.status === 0) {
					Request.abort(req, status, err, self);
					return;
				}

				// Fail
				self.error.apply(self, arguments);
				Request.fail(self);
			},
			complete: function() {
				if (promise) { promise.resolve(data); }
				self.complete.apply(self, arguments);
				Request.always(self);
			}
		});

		// Record the call
		Request.send(this);

		return request;
	},

	/**
	 * Fired when an xhr request is successful
	 * Feel free to overwrite
	 * @param  {Object||String||null} data
	 */
	success: function(data) {},
	
	/**
	 * Fired when an xhr request completes.
	 * Feel free to overwrite
	 */
	error: function(req, status, err) {},

	/**
	 * Fired when an xhr request completes.
	 * Feel free to overwrite
	 */
	complete: function() {},

	/**
	 * Aborts the current request
	 * @return {AjaxCall}
	 */
	abort: function() {
		if (this.request) {
			this.request.abort();
			this.request = null;
		}
		return this;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_AJAX_CALL, {
			id: this._id,
			call: JSON.stringify(this._call)
		});
	}
};

//----

// Data Context #####################################################################

/**
 * The name of the class
 * @type {String}
 * @private
 */
var _DATA_CONTEXT = 'DataContext';

/**
 * Used to construct AjaxCalls to communicate with the server.
 * Intended to be a central location for configuration data
 * to get and send data about a specific model/collection type
 * @class DataContext
 */
var DataContext = Storm.DataContext = function() {
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_DATA_CONTEXT);
};

/**
 * Default settings for the DataContext,
 * where we are is usually useful
 * @type {Object}
 */
DataContext.settings = (function() {
	var loc = root.location || {};
	return {
		host: loc.host,
		hostname: loc.hostname,
		origin: loc.origin,
		pathname: loc.pathname,
		port: loc.port
	};
}());

/**
 * Add settings to the global DataContext.settings
 * object. Basically a protected _.extend
 * @param {Object} settings
 * @return {Object} DataContext.settings
 */
DataContext.addSettings = function(settings) {
	return _.extend(DataContext.setting, settings);
};

DataContext.prototype = {
	/** @constructor */
	constructor: DataContext,

	/**
	 * AjaxCall, the constructor of the AjaxCall
	 * to use when configuring a new call object
	 * @type {AjaxCall}
	 */
	AjaxCall: AjaxCall,

	defaults: {},

	/**
	 * The merged defaults and passed options
	 * @type {Object}
	 */
	options: {},
	
	/**
	 * Overrides AjaxCall's defaults
	 * @type {Object}
	 */
	callTemplate: {},

	getSetting: function() { 
		return DataContext.getSetting.apply(arguments);
	},
	removeSetting: function() { 
		return DataContext.removeSetting.apply(arguments);
	},

	/**
	 * Add more options to this data context
	 * @param  {Object} options
	 * @return {DataContext}
	 */
	extendOptions: function(opts) {
		this.options = _.extend({}, this.defaults, opts);
		return this;
	},

	/**
	 * Remove an option from this data context
	 * @param  {String} key
	 * @return {DataContext}
	 */
	removeOption: function(key) {
		delete this.options[key];
		return this;
	},

	/**
	 * Creates and returns a new AjaxCall
	 * @param  {Object}      call   see AjaxCall.defaults
	 * @param  {Object}      extensionData  Addition configurations for the url
	 * @return {AjaxCall}
	 */
	createCall: function(call, extensionData) {
		var configuration = _.extend({}, DataContext.settings, this.options, extensionData);
		return new this.AjaxCall(call, configuration, this.callTemplate);
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_DATA_CONTEXT, {
			id: this._id
		});
	}
};


//----

// Tempalate ########################################################################

/**
 * Centralized template registration for
 * holding, compiling and rendering client-side
 * templates
 *
 * The template engine only has one requirement,
 * a "compile" function that returns a render function.
 * The render function will be called with the data
 * as the first parameter.
 *
 * Common libraries that use this paradigm are:
 * Mustache, Handlebars, Underscore etc...
 */
Storm.template = (function() {
	
		/**
		 * The name of this class
		 * @type {String}
		 */
	var _TEMPLATE = 'template',
		/**
		 * Template strings registered by an id string
		 * @type {Object}
		 * @private
		 */
		_templates = {},
		/**
		 * Compiled templates registered by an id string
		 * @type {Object}
		 * @private
		 */
		_compiledTemplates = {},
		/**
		 * The current template engine being used. Use
		 * underscore by default and proxy "compile" to
		 * "template"
		 * @private
		 */
		_engine = {
			compile: _.template
		};

	/**
	 * Register a template
	 * @param  {String} name id
	 * @param  {String || Function || Array} tpl
	 * @param  {Object} opts [optional]
	 * @return {Storm.template}
	 */
	var _register = function(name, tpl, opts) {
		opts = opts || {};

		// If an object, multiple items are being registered
		// and tpl is actually opts
		if (!_.isString(name)) {
			var key, obj = name;
			for (key in obj) {
				_register(key, obj[key], tpl);
			}
			return this;
		}

		// Not an object, must be a string. If it's an
		// id string, go get the html for the template
		if (name[0] === '#') {
			var element = document.getElementById(name.substring(1, name.length));
			if (!element) { return console.error(_errorMessage(_TEMPLATE, 'Cannot find reference to "'+ name +'" in DOM'), name, tpl); }
			tpl = element.innerHTML;
		}

		// If the tpl is a compiled template @type {Function},
		// then register it to _compiledTemplates
		if (opts.isCompiled) {
			_compiledTemplates[name] = tpl;
			return this;
		}

		_templates[name] = _coerceTemplateToString(tpl);
		return this;
	};

	/**
	 * Coerce a template to a string value. If a function is
	 * passed, it's executed and coercion continues. If an array
	 * is passed, it is joined. All strings are trimmed to prevent
	 * any problems with the templating engine
	 * @param  {String || Function || Array} tpl
	 * @return {String}
	 * @private
	 */
	var _coerceTemplateToString = function(tpl) {
		if (_.isFunction(tpl)) { tpl = tpl.call(); }
		if (_.isString(tpl)) { return tpl.trim(); }
		if (_.isArray(tpl)) { return tpl.join('\n').trim(); }
		console.error(_errorMessage(_TEMPLATE, 'Template (or the return value) was of unknown type'), tpl);
		return '';
	};

	/**
	 * Get a template via a name
	 * @param  {String} name id
	 * @return {Function} compiled template
	 * @private
	 */
	var _retrieve = function(name) {
		// If there's a compiled template, return that one
		var compTpl = _compiledTemplates[name];
		if (compTpl) { return compTpl; }

		if (!_engine) { console.error(_errorMessage(_TEMPLATE, 'No template engine is available'), _engine); }
		return (_compiledTemplates[name] = _engine.compile(_templates[name]));
	};

	/**
	 * Remove a template from Storm.template.
	 * Removes both the string and compiled versions
	 * @param  {String} name id
	 */
	var _remove = function(name) {
		delete _templates[name];
		delete _compiledTemplates[name];
	};

	/**
	 * Render a registered template
	 * @param  {String} name id of the template
	 * @param  {Object} data [optional] passed to the template engine as a parameter
	 * @return {String} rendered template
	 */
	var _render = function(name, data) {
		var tpl = _retrieve(name);
		return tpl(data || {});
	};

	return {
		add: _register,
		remove: _remove,
		render: _render,
		
		/**
		 * Sets the client-side templating engine
		 * for Storm.template to use.
		 * @param {TemplatingEngine} engine
		 */
		setEngine: function(engine) {
			_engine = engine;
		},

		/**
		 * Return the registered template strings
		 * @param  {String} key [optional] a specific template
		 * @return {String || Object}
		 */
		toJSON: function(key) {
			var value = (key) ? _templates[key] : _templates;
			return value;
		},

		/**
		 * Debug string
		 * @return {String}
		 */		
		toString: function(key) {
			return _toString(_TEMPLATE, {
				size: _.size(_templates)
			});
		}
	};
}());

//----

// View #############################################################################

/**
 * The name of this class
 * @type {String}
 */
var _VIEW = 'View';

/**
 * A view at its most basic. Sets up a couple
 * defaults for cloning and commonly used methods
 * @class View
 * @param {Object} opts [optional]
 */
var View = Storm.View = function(opts) {
	Events.core.call(this);

	opts = opts || {};

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_VIEW);
	
	/** @type {Object} */
	this.options = opts || {};
	
	/** @type {Element} */
	this.elem = opts.elem || null;

	/** @type {String} id */
	this.template = this.template || opts.template || '';
};

_.extend(View.prototype, Events.core.prototype, {
	/** @constructor */
	constructor: View,

	/**
	 * Returns a clone of the view
	 * @return {View}
	 */
	clone: function() {
		return new this.constructor(this.options);
	},

	/**
	 * Here to be overwritten
	 */
	render: function() {},

	/**
	 * Returns the cached elem or caches and returns
	 * an elem using render
	 * @return {Element}
	 */
	getElem: function() {
		return this.elem || (this.elem = this.render());
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_VIEW, {
			id: this._id
		});
	}
});

//----

// Model ############################################################################

/**
 * The name of the class
 * @type {String}
 * @private
 */
var _MODEL = 'Model';

/**
 * The base data object for the application. Stores
 * and protects a piece of data and gives an interface
 * to follow and manipulate the data. Works in conjunction
 * with a Collection to organize data into sets 
 * 
 * @class Model
 * @param {Object} data
 * @param {Object} opts
 */
var Model = Storm.Model = function(data, opts) {
	Events.core.call(this);

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_MODEL);

	/**
	 * Hold on to the passed options both for
	 * reference inside the model and for cloning
	 * @type {Object}
	 */
	this.options = opts;

	/**
	 * getters (recorded by key as a function)
	 * @type {Object}
	 */
	this._getters = {};
	
	/**
	 * setters (recorded by key as a function)
	 * @type {Object}
	 */
	this._setters = {};

	// Merge the data and the defaults
	data = _.extend({}, this.defaults, data);
	
	/**
	 * Protect the data, __ === secret... gentleman's agreement
	 * @type {Object}
	 */
	this.__data = this._duplicate(data);
	
	/**
	 * Create duplicate of the original data to
	 * compare against for checks and allow restoration.
	 * Make sure these are protected as well
	 * @type {Object}
	 */
	this.__originalData = this.__previousData = this._duplicate(data);

	/**
	 * If there's a Comparator, then bind it to this model
	 * @type {Comparator}
	 */
	if (this.comparator) { this.comparator.bind(this); }
};

_.extend(Model.prototype, Events.core.prototype, {
	/** @constructor */
	constructor: Model,
	
	/**
	 * If not supporting complex data types (default), the model
	 * creates a reference-free version of the data to keep the
	 * data from being contaminated.
	 *
	 * If supporting complex data types, non-primitive values
	 * will be maintained in the model data, but exposes the
	 * possibility of contaminating the data object by outside
	 * sources
	 *
	 * @type {Boolean}
	 * @default false
	 */
	supportComplexDataTypes: false,

	/**
	 * The defaults to be merged into the
	 * data object when constructed
	 * @type {Object}
	 */
	defaults: {},

	/**
	 * Get the private id of the Model
	 * @return {Number} id
	 */
	getId: function() { return this._id; },

	/**
	 * Restores the data of the model back to the
	 * original value
	 * @param  {Object} opts
	 * @return {Model}
	 */
	restore: function(opts) {
		// Set the current data back to the original data
		this.__data = this._duplicate(this.__originalData);
		// Check if silent
		if (opts && !opts.isSilent) { return this; }
		
		// Let every property know that it has
		// been changed and fire a restore event
		var prop;
		for (prop in this.__data) {
			this.trigger('change:' + prop, this.__data[prop]);
			this.trigger('model:change', prop, this.__data[prop]);
		}
		this.trigger('model:restore');

		return this;
	},

	/**
	 * Adds a getter for the property
	 * @param  {String}   prop
	 * @param  {Function} func
	 * @return {Model}
	 */
	getter: function(prop, func) {
		if (!_.isFunction(func)) { return console.error(_errorMessage(_MODEL, 'Getter must be a function.', prop, func)); }
		if (this._getters[prop]) { return console.error(_errorMessage(_MODEL, 'Getter is already defined', prop, func)); }
		this._getters[prop] = func;
		return this;
	},

	/**
	 * Adds a setter for the property
	 * @param  {String}   prop
	 * @param  {Function} func
	 * @return {Model}
	 */
	setter: function(prop, func) {
		if (!_.isFunction(func)) { return console.error(_errorMessage(_MODEL, 'Setter must be a function', prop, func)); }
		if (this._setters[prop]) { return console.error(_errorMessage(_MODEL, 'Setter is already defined', prop, func)); }
		this._setters[prop] = func;
		return this;
	},

	/**
	 * Get a value from the Model, passing it through the getter
	 * method if one exists. An array can be passed to get multiple
	 * values or a string to get a single value
	 * @param  {String || Array[String]} prop
	 * @return {Value || Array[Values]}
	 */
	get: function(prop) {
		if (_.isArray(prop)) {
			// Reuse the array passed, replacing
			// each index with the value retrieved
			// from the model.
			var idx = prop.length;
			while (idx--) {
				prop[idx] = this._get(prop[idx]);
			}
			return prop;
		}

		return this._get(prop);
	},
	
	/**
	 * Private version of get. Gets single values
	 * @param {String} prop
	 * @return {Data}
	 * @private
	 */
	_get: function(prop) {
		// If a getter is set, call the function to get the return value
		if (this._getters[prop]) {
			return this._getters[prop].call(null, this.__data[args.prop]);
		}

		// Otherwise, return the value
		return this.__data[prop];
	},

	/**
	 * Sets the value of a property in the Model. Values can be set
	 * in key-value pairs in an object, or as string + value as
	 * separate parameters
	 * @param {String || Object} prop
	 * @param {Data} data
	 * @param {Object} opts
	 * @return {Model}
	 */
	set: function(prop, data, opts) {
		// If prop is not a string (is an object), then set
		// each key in the object to the value
		if (!_.isString(prop)) {
			var key;
			for (key in prop) {
				this._set(key, prop[key], opts);
			}
			return this;
		}

		// Otherwise, set the value
		this._set(prop, data, opts);
		return this;
	},
	
	/**
	 * Private version of set. Sets single values
	 * @param {String} prop
	 * @param {Value}  data
	 * @param {Object} opts [optional]
	 * @private
	 */
	_set: function(prop, data, opts) {
		// If a setter is set
		if (this._setters[prop]) {
			data = this._setters[prop].call(null, data);
		}

		this._change(prop, data, opts);
	},
	
	/**
	 * Adds properties/values to the model data. Only works to add
	 * additional data to the model data, it will not modify any
	 * pre-existing data. An object can be passed to set multiple
	 * key-values or a string and value as separate parameters
	 * @param {String || Object} prop
	 * @param {Value} data
	 * @param {Object} opts [optional]
	 * @return {Model}
	 */
	add: function(prop, data, opts) {
		// If the prop is not a string (is an object)
		// then add multiple key-values in one pass
		if (!_.isString(prop)) {
			var key;
			for (key in prop) {
				this._add(key, prop[key], opts);
			}
			return this;
		}

		this._add(prop, data, opts);
		return this;
	},

	/**
	 * Removes properties from the model data. Only works to remove
	 * data the pre-exists in the data. No remove event will be fired
	 * if the property has an undefined value. An array can be passed
	 * to remove multiple properties or a string as a single parameter
	 * @param {String || Array[String]} prop
	 * @param {Object} opts [optional]
	 * @return {Model}
	 */
	remove: function(prop, opts) {
		if (_.isArray(prop)) {
			var idx = prop.length;
			while (idx--) {
				this._remove(prop[idx], opts);
			}
			return this;
		}

		this._remove(prop, opts);
	},

	/**
	 * Returns the previous value for the property
	 * @param  {String} prop
	 * @return {Value}
	 */
	previous: function(prop) {
		return this.__previousData[prop];
	},

	/**
	 * Checks if the model data has the provided property
	 * @param  {String}  prop
	 * @return {Boolean}
	 */
	has: function(prop) {
		return _exists(prop) ? (prop in this.__data) : false;
	},

	/**
	 * Checks if the model data has changed from the original data.
	 * If a prop is passed, then it will check if that property's value
	 * has changed and not the entire model data
	 * @param  {String}  prop [optional]
	 * @return {Boolean}
	 */
	hasChanged: function(prop) {
		if (_exists(prop)) {
			return (this.__originalData[prop] === this.__data[prop]) ? false : true;
		}

		var key;
		for (key in this.__data) {
			if (this.hasChanged(key)) { return true; }
		}
		return false;
	},

	/**
	 * Returns a clone of the model
	 * @return {Model}
	 */
	clone: function() {
		return new this.constructor(this._duplicate(this.__data), this.options);
	},

	/**
	 * If not supporting complex data types (default), _duplicate
	 * creates a reference-free version of the data passed
	 * using native JSON.parse and JSON.stringify.
	 *
	 * If supporting complex data types, underscore's _.clone
	 * method is used, which will not create a reference-free
	 * version of complex data types, which may lead to pollution
	 * of the data, but will allow non-primitive values
	 * 
	 * @param  {Value} data
	 * @return {Value}
	 * @private
	 */
	_duplicate: function(data) {
		// Keep null/undefined from being passed to JSON
		// or needlessly cloned as both are primitives
		if (!_exists(data)) { return data; }

		return this.supportComplexDataTypes ? _.clone(data) : JSON.parse(JSON.stringify(data));
	},

	/**
	 * Retrieve the model data
	 * @return {Object}
	 */
	retrieve: function() {
		return this.__data;
	},

	/**
	 * Duplicates the current model data and assignes it
	 * to previous data
	 * @private
	 */
	_backup: function() {
		// Previous data should not be a reference, but a separate object
		this.__previousData = this._duplicate(this.__data);
	},

	/**
	 * Adds a new property and data to the model data
	 * @param {String} prop
	 * @param {Value} data
	 * @param {Object} opts [optional]
	 * @private
	 */
	_add: function(prop, data, opts) {
		this._backup();
		if (this.__previousData[prop] !== undefined) { return; } // This data isn't actually an addition

		this.__data[prop] = this._duplicate(data);

		if (this.__previousData[prop] === this.__data[prop]) { return; } // The data didn't actually change
		if (opts && opts.isSilent) { return; } // Check if silent
		this.trigger('add:' + prop, data);
		this.trigger('model:add', prop, data);
	},

	/**
	 * Removes a property from the model data
	 * @param {String} prop
	 * @param {Object} opts [optional]
	 * @private
	 */
	_remove: function(prop, opts) {
		this._backup();
		if (this.__previousData[prop] === undefined) { return; } // The property is not present

		var data = this.__data[prop];
		delete this.__data[prop];

		if (opts && opts.isSilent) { return; } // Check if silent
		this.trigger('remove:' + prop, data);
		this.trigger('model:remove', prop, data);
	},

	/**
	 * Changes a value on the model data
	 * @param  {String} prop
	 * @param  {Value} data
	 * @param  {Object} opts [optional]
	 * @private
	 */
	_change: function(prop, data, opts) {
		this._backup();

		this.__data[prop] = this._duplicate(data);

		// Fire off change events
		if (_.isEqual(this.__previousData[prop], this.__data[prop])) { return; } // The data didn't actually change
		if (!this._validate()) { return this.__data = this._duplicate(this.__previousData); } // If invalid, revert changes
		if (opts && opts.isSilent) { return; } // Check if silent
		this.trigger('change:' + prop, data);
		this.trigger('model:change', prop, data);
	},

	/**
	 * Compares this model to another. Used by Collection for
	 * sorting. Checks for Storm.Comparator to use natively but
	 * can be overwritten
	 * @param  {Model} comparisonModel
	 * @return {Number} sort order (1, 0, -1)
	 */
	compareTo: function(comparisonModel) {
		if (!this.comparator || !comparisonModel || !comparisonModel.comparator) { return 0; }
		return this.comparator.getSortValue(this)
								.localeCompare(this.comparator.getSortValue(comparisonModel));
	},

	/**
	 * Validates the model when a value is changed via
	 * .set(). Looks for a .validate() method on the model.
	 * @return {Boolean}
	 * @default true
	 * @private
	 */
	_validate: function() {
		if (!this.validate) { return true; }
		var isValid = !!this.validate();
		if (!isValid) { this.trigger('model:invalid'); }
		return isValid;
	},

	/**
	 * Returns the data for serialization
	 * @return {Object}
	 */
	toJSON: function() {
		return this.__data;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_MODEL, {
			id: this._id
		});
	}
});

// Underscore methods that we want to implement on the Model.
_.each([
	'each',
	'isEqual',
	'isEmpty',
	'size',
	'keys',
	'values',
	'pairs',
	'invert',
	'pick',
	'omit'
], function(method) {
	Model.prototype[method] = function() {
		var args = _.toArray(arguments);

		// Add this Model's data as the first argument
		args.unshift(this.__data);

		// the method is the underscore methods with
		// an underscore context and the arguments with
		// the models first
		return _[method].apply(_, args);
	};
});

//----

// Comparator #######################################################################

	/**
	 * The name of the class
	 * @type {String}
	 * @private
	 */
var _COMPARATOR = 'Comparator',
	/**
	 * Stores sort types to use to compare models
	 * Default is alphabetical (0)
	 * @type {Object}
	 * @default alphabetical
	 */
	_SORT = {
		alphabetical: 0,
		numeric: 1,
		date: 2
	},
	
	/**
	 * Reverse look-up for _SORT
	 * @type {Object}
	 */
	_SORT_NAMES = _.invert(_SORT),
	
	/**
	 * Add a sort type to the _SORT object
	 * @param {String} type
	 */
	_addSort = function(type) {
		// The type has already been defined
		if (type in _SORT) { return; }

		// Using _.size ensures a unique id
		// for the type passed
		_SORT[type] = _.size(_SORT);
	},

	/**
	 * Caching of the sort value by model id
	 * @type {Object}
	 */
	_store = {};

/**
 * Used by the Collection to sort Models. Having
 * a separate object used by the model normalizes
 * sorting and allows optimization by caching values
 * @class Comparator
 * @param {String} key the key on the model used for comparison
 * @param {Storm.Comparator.SORT} type [optional]
 */
var Comparator = Storm.Comparator = function(key, type) {
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_COMPARATOR);

	/**
	 * The model key to use to sort
	 * @type {String}
	 * @private
	 */
	this._key = key;

	/**
	 * The type of sorting we'll be doing
	 * @default SORT.alphabetical
	 * @type {SORT} type
	 * @private
	 */
	this._type = type || _SORT.alphabetical;
};

_.extend(Comparator, {

	/**
	 * Default string to use if no value is present to
	 * compare against.
	 * @type {String}
	 */
	HOISTING_STR: '___',
	
	/**
	 * Expose _SORT as its values are needed
	 * in order to setup specific Comparators
	 * @type {Object}
	 */
	SORT: _SORT,
	
	/**
	 * Add a sort type to the Comparator
	 * as a global option
	 * @param {String || Array} type
	 */
	addSort: function(type) {
		// If is an array, add multiple types
		if (_.isArray(type)) {
			var idx = 0, length = type.length;
			for (; idx < length; idx++) {
				_addSort(type[idx]);
			}
		} else {
			_addSort(type);
		}

		// Refresh the sort names after addition
		_SORT_NAMES = _.invert(_SORT);
	}
});

Comparator.prototype = {
	/** @constructor */
	constructor: Comparator,
	
	/**
	 * Bind to the key on the model that the comparator
	 * watches. If the key changes, invalidate the sort
	 * value so that it's recalculated
	 * @param  {Storm.Model} model
	 */
	bind: function(model) {
		model.on('change:' + this._key, _.bind(this.invalidateSortValue, this, model));
	},

	/**
	 * Invalidates the sort value of a model
	 * by deleting it from the store
	 * @param  {Storm.Model} model
	 * @return {Comparator}
	 */
	invalidateSortValue: function(model) {
		delete this.store[model.getId()];
		return this;
	},

	/**
	 * Get the value to sort by
	 * @param  {Storm.model}  model
	 * @return {Value}
	 */
	getSortValue: function(model) {
		var id = model.getId();
		if (_store[id]) { return _store[id]; }

		if (!this[_SORT_NAMES[this._type]]) { return console.error(_errorMessage('Comparator', 'No method for the sort type assigned'), this._type, _SORT_NAMES[this._type]); }
		var value = this[_SORT_NAMES[this._type]].call(this, model);
		
		_store[id] = value;
		return value;
	},

	/**
	 * Default alphabetical sort.
	 * This method gets the value from the model
	 * and ensures a string return value
	 * @param  {Model}  model
	 * @return {String} value
	 */
	alphabetical: function(model) {
		var value = model.get(this._key);
		value = _.exists(value) ? (value + '').toLocaleLowerCase() : Comparator.HOISTING_STR;
		return value;
	},
	
	/**
	 * Default numeric sort.
	 * This method gets the value from the model
	 * and ensures a number return value
	 * @param  {Model}  model
	 * @return {Number} value
	 */
	numeric: function(model) {
		var value = model.get(this._key) || 0;
		value = +value;
		return value;
	},

	/**
	 * Default date sort.
	 * This method gets the value from the model
	 * and ensures a date return value
	 * @param  {Model}  model
	 * @return {Date}   value
	 */
	date: function(model) {
		var value = model.get(this._key) || new Date();
		value = _.isDate(value) ? value : new Date(value);
		return value;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_COMPARATOR, {
			id: this._id,
			key: this._key,
			type: _SORT_NAMES[this._type]
		});
	}
};

//----

// Collection #######################################################################

/**
 * The name of the class
 * @type {String}
 */
var _COLLECTION = 'Collection';

/**
 * A collection of Models
 * @param {Object} data [optional]
 * @class Collection
 */
var Collection = Storm.Collection = function(data) {
	Events.core.call(this);
	data = data || {};

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_COLLECTION);
	
	/**
	 * Storage for the models
	 * @type {Array[Model]}
	 * @private
	 */
	this._models = [];

	this.add(data.models, data, { isSilent: true });
};

_.extend(Collection.prototype, Events.core.prototype, {
	/** @constructor */
	constructor: Collection,

	/** @type {Model} */
	Model: Model,

	/**
	 * Get the private id of the Collection
	 * @return {Number} id
	 */
	getId: function() {
		return this._id;
	},

	/**
	 * Create a new model
	 * @param  {Object} model the model data
	 * @param  {Object} opts [optional]
	 * @param  {Object} data additional data to pass to the new models
	 * @return {Model}
	 */
	newModel: function(model, opts, data) {
		return new this.Model(model, opts, data);
	},

	/**
	 * Get all models
	 * @return {Array}
	 */
	getModels: function() {
		return this._models;
	},

	/**
	 * Get a model by key-value
	 * @param  {String} key
	 * @param  {Value} value
	 * @return {Model}
	 */
	getBy: function(key, value) {
		var models = this._models,
			idx = models.length;
		while (idx--) {
			if (models[idx].get(key) === value) {
				return models[idx];
			}
		}
		return null;
	},

	/**
	 * Return the length of the models,
	 * same as getModels().length
	 * @return {Number} length
	 */
	length: function() {
		return this._models.length;
	},

	/**
	 * Retrieve a model at the provided index
	 * @param  {Number} idx
	 * @return {Model}
	 */
	at: function(idx) {
		return this._models[idx];
	},

	/**
	 * Get the index of a model
	 * @param  {Model} model
	 * @return {Number} index
	 */
	indexOf: function(model) {
		var id = model.getId(),
			models = this._models,
			idx = models.length;
		while (idx--) {
			if (models[idx].getId() === id) { return idx; }
		}
		return -1;
	},

	/**
	 * Add models to the collection, creating new models
	 * if the model is not an instance of Storm.Model,
	 * sorting the models and firing events
	 * @param {Array[Model]} models
	 * @param {Object} opts [optional]
	 * @param {Object} data additional data to pass to the new models
	 */
	add: function(models, data, opts) {
		models = _.isArray(models) ? models.slice() : [models];
		opts = opts || {};

		var idx = 0, length = models.length,
			model,
			add = [],
			at = opts.at;

		for (; idx < length; idx++) {
			model = models[idx];

			if (!model) { continue; }

			// If the model is not a Storm.Model, make it into one
			if (!(model instanceof Storm.Model)) {
				model = this.newModel(model, opts, data);
			}

			// Check if the model is valid
			if (!model._validate()) {
				if (!opts.isSilent) {
					this.trigger('collection:invalid', model, models);
				}
				continue;
			}

			// If the model is a duplicate prevent it from being added and
			// optionally merge it into the existing model.
			if (this.get(model.getId())) {
				if (opts.merge) {
					var key,
						obj = models[idx];
					for (key in obj) {
						model.set(key, obj[key], opts);
					}
					if (!opts.isSilent) {
						model.trigger('collection:merge');
					}
				}
				continue;
			}

			// This is a new model, push it to the add list
			add.push(model);
		}

		// Add the new models
		if (add.length) {
			if (_exists(at)) {
				this._models.splice(([at, 0]).concat(add));
			} else {
				this._models.push(add);
			}

			this.sort(opts);
		}

		// Stop if silent
		if (opts.isSilent) { return this; }

		var self = this;
		_.each(add, function(model, idx) {
			model.trigger('collection:add', self);
		});

		this.trigger('add', add, opts);

		return this;
	},
	/** Proxy for add */
	set: function() { this.add.apply(this, arguments); },

	/**
	 * As you would expect
	 * @param  {Object} opts will be passed to remove 
	 * @return {Model} the removed model
	 */
	push: function(model, opts) {
		opts = _.extend({ at: this._models.length }, opts);
		this.add(model, opts);
		return model;
	},

	/**
	 * As you would expect
	 * @param  {Object} opts will be passed to remove 
	 * @return {Model} the removed model
	 */
	unshift: function(model, opts) {
		opts = _.extend({ at: 0 }, opts);
		this.add(model, opts);
		return model;
	},

	/**
	 * Remove a model from the collection
	 * @param  {Model || Array[Model]} models
	 * @param  {Object} opts   [optional]
	 * @return {Collection}
	 */
	remove: function(models, opts) {
		models = _.isArray(models) ? models.slice() : [models];
		opts = opts || {};

		var idx = 0, length = models.length,
			index, model;
		for (; idx < length; idx++) {
			model = this.get(models[idx]);
			if (!model) { continue; }

			this._models.splice(idx, 1);
			if (!opts.isSilent) {
				model.trigger('collection:remove', this);
			}
		}

		if (opts.isSilent) { return this; }
		this.trigger('remove', models, opts);
		return this;
	},

	/**
	 * As you would expect
	 * @param  {Object} opts will be passed to remove 
	 * @return {Model} the removed model
	 */
	shift: function(opts) {
		var model = this.at(0);
		this.remove(model, opts);
		return model;
	},

	/**
	 * As you would expect
	 * @param  {Object} opts will be passed to remove 
	 * @return {Model} the removed model
	 */
	pop: function(opts) {
		var model = this.at(this.length - 1);
		this.remove(model, opts);
		return model;
	},

	/**
	 * As you would expect
	 * @param  {Number} begin
	 * @param  {Number} end
	 * @return {Array}
	 */
	slice: function(begin, end) {
		return this._models.slice(begin, end);
	},

	/**
	 * Force the collection to re-sort itself. You don't need to call this under
	 * normal circumstances, as the collection will maintain sort order as items
	 * are added.
	 * @param  {Objet} opts [optional]
	 * @return {Collection}
	 */
	sort: function(opts) {
		opts = opts || {};

		if (opts.skipSort || // Skipping sort
			!this.length() || // Nothing to sort
			!this.at(0).comparator) { // Models not sortable
			return this;
		}

		this._models.sort(function(a, b) {
			return a.compareTo(b);
		});
		
		if (!opts.silent) {
			var self = this;
			this.each(function(model, idx) {
				model.trigger('collection:sort', self, idx);
			});
			this.trigger('sort', this, opts);
		}

		return this;
	},

	/**
	 * Get models matching the key-values passed
	 * @param  {Object} values
	 * @param  {Boolean} first [optional] return first found
	 * @return {Model || Array}
	 */
	where: function(values, first) {
		if (_.isEmpty(values)) { return first ? undefined : []; }

		var method = this[first ? 'find' : 'filter'];
		return method(function(model) {
			var key;
			for (key in values) {
				if (values[key] !== model.get(key)) { return false; }
			}
			return true;
		});
	},

	/**
	 * Proxy for where(values, true)
	 * @param  {Object} values
	 * @return {Model}
	 */
	findWhere: function(values) {
		return this.where(values, true);
    },
	
	/**
	 * Get all model values of the provided key
	 * @param  {String} key
	 * @return {Array[Value]}
	 */
	pluck: function(key) {
		return _.invoke(this._models, 'get', key);
	},

	/**
	 * Gets a model by its id
	 * @param  {Number} id
	 * @return {Model}
	 */
	getModelById: function(id) {
		if (!_exists(id)) { return null; }

		var models = this._models,
			idx = models.length;
		while (idx--) {
			if (models[idx].getId() === id) {
				return models[idx];
			}
		}
		return null;
	},
	/** Proxy for getModelById */
	get: function() { return this.getModelById.apply(this, arguments); },

	/**
	 * Drops all models from the collection
	 * @param  {Object} opts [optional]
	 * @return {Collection}
	 */
	reset: function(opts) {
		opts = opts || {};
		this._models.length = 0;
		if (!opts.isSilent) {
			this.trigger('reset');
		}
		return this;
	},
	
	/**
	 * Returns a clone of the collection
	 * @return {Model}
	 */
	clone: function() {
		return new this.constructor({ model: this.model, models: this._models });
	},

	/**
	 * Similar to Model.retrieve, returns all model data
	 * in the collection
	 * @return {Array[Object]}
	 */
	retrieve: function() { // To match model.retrieve()
		return _.map(this._models, function(model) {
			return model.retrieve();
		});
	},

	/**
	 * Return the data to serialize to JSON
	 * @return {Array[Object]}
	 */
	toJSON: function() {
		return this.retrieve();
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_COLLECTION, {
			id: this._id,
			length: this.length()
		});
	}
});

// Underscore methods that we want to implement on the Collection.
_.each([
	'forEach',
	'each',
	'map',
	'collect',
	'reduce',
	'foldl',
	'inject',
	'reduceRight',
	'foldr',
	'find',
	'detect',
	'filter',
	'select',
	'reject',
	'every',
	'all',
	'some',
	'any',
	'include',
	'contains',
	'invoke',
	'max',
	'min',
	'toArray',
	'size',
	'first',
	'head',
	'take',
	'initial',
	'rest',
	'tail',
	'drop',
	'last',
	'without',
	'difference',
	'indexOf',
	'shuffle',
	'lastIndexOf',
	'isEmpty',
	'chain'
], function(method) {
	Collection.prototype[method] = function() {
		var args = _.toArray(arguments);

		// Add this Collection's models as the first
		// argument
		args.unshift(_slice(this._models));

		// the method is the underscore methods with
		// an underscore context and the arguments with
		// the models first
		return _[method].apply(_, args);
	};
});

// Underscore methods that take a property name as an argument.
_.each([
	'groupBy',
	'countBy',
	'sortBy'
], function(method) {
	Collection.prototype[method] = function(value, context) {
		var iterator = _.isFunction(value) ? value : function(model) {
			return model.get(value);
		};
		return _[method](this._models, iterator, context);
	};
});

//----

// Module ###########################################################################

/**
 * The name of the class
 * @type {String}
 * @private
 */
var _MODULE = 'Module';

/**
 * A reusable module equipped with events
 * @class Module
 */
var Module = Storm.Module = function() {
	Events.core.call(this);
	
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_MODULE);
};

_.extend(Module.prototype, Events.core.prototype, {
	/** @constructor */
	constructor: Module,

	getId: function() {
		return this._id;
	},
	
	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_MODULE, {
			id: this._id
		});
	}
});


//----

// Cache ############################################################################
	
/**
 * The name of the class
 * @type {String}
 * @private
 */
var _CACHE = 'Cache';

/**
 * An in-memory key-value store
 * @class Cache
 */
var Cache = Storm.Cache = function() {
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_CACHE);
	
	/**
	 * Holds the private cache
	 * @type {Object}
	 * @private
	 */
	this._cache = {};

	/**
	 * Holds timeouts used to expire the cache
	 * @type {Object}
	 * @private
	 */
	this._timeouts = {};
};

Cache.prototype = {
	/** @constructor */
	constructor: Cache,

	/**
	 * Stores data in the cache
	 * @param  {String || Object} key
	 * @param  {Value} data
	 * @param  {Object} opts [optional]
	 * @return {Cache}
	 */
	store: function(key, data, opts) {
		opts = opts || {};

		if (!_.isString(key)) {
			opts = data;
			data = key;
			var prop;
			for (prop in data) {
				this._store(prop, data[prop], opts);
			}
			return this;
		}

		this._store(key, data, opts);

		return this;
	},

	/**
	 * Gets an item from cache or an array
	 * of values
	 * @param  {String || Array[String]} key
	 * @return {Value || Array[Values]}
	 */
	get: function(key) {
		if (_.isArray(key)) {
			// Reuse the array passed, replacing
			// each index with the value retrieved
			// from the cache.
			var idx = key.length;
			while (idx--) {
				key[idx] = this._cache[key[idx]];
			}
			return key;
		}

		return this._cache[key];
	},

	/**
	 * Remove an item from cache or multiple
	 * items if an array is passed
	 * @param  {String || Array[String]} keys
	 * @return {Cache}
	 */
	remove: function(keys) {
		keys = _.isArray(keys) ? keys : [keys];

		var idx = keys.length;
		while (idx--) {
			this._clearExpiration(keys[idx]);
			delete this._cache[keys[idx]];
		}

		return this;
	},

	/**
	 * Resets the cache, emptying the cache
	 * and clearing any expirations
	 * @return {Cache}
	 */
	flush: function() {
		this._clearExpirations();
		this._cache = {};
		return this;
	},

	/**
	 * Stores data in the cache
	 * @param  {String} key
	 * @param  {Value} data
	 * @param  {Object} opts [optional]
	 * @private
	 */
	_store: function(key, data, opts) {
		// Expiration
		if (_exists(opts.expiration)) {
			this._setExpiration(key, opts.expiration);
		}

		// Extend
		if (opts.extend) {
			data = _.extend(this._cache[key], data);
		}

		this._cache[key] = data;
	},

	/**
	 * Sets a key in the cache to expire
	 * after a set duration by storing a
	 * timeout
	 * @param {String} key
	 * @param {Number} duration
	 * @private
	 */
	_setExpiration: function(key, duration) {
		if (this._timeouts[key]) {
			clearTimeout(this._timeouts[key]);
		}

		var self = this;
		this._timeouts[key] = setTimeout(function() {
			
			delete self._cache[key];
			delete self._timeouts[key];

		}, _.isNaN(duration) ? 0 : duration);
	},

	/**
	 * Clears all expirations
	 * @private
	 */
	_clearExpirations: function() {
		var key;
		for (key in this._timeouts) {
			this._clearExpiration(key);
		}
	},

	/**
	 * Clears a specific expiration
	 * @param  {String} key
	 * @private
	 */
	_clearExpiration: function(key) {
		clearTimeout(this._timeouts[key]);
		delete this._timeouts[key];
	},
	
	/**
	 * Gets the value (or entire cache) to
	 * serialize to JSON
	 * @param  {String} key [optional]
	 * @return {Object || Value}
	 */
	toJSON: function(key) {
		var value = (key) ? this.get(key) : this._cache;
		return value;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function(key) {
		return _toString(_CACHE, {
			id: this._id,
			size: _.size(this._cache)
		});
	}
};

/**
 * Expose a default cache to use in the application
 */
Storm.cache = new Cache();

//----

// Storage ##########################################################################

	/**
	 * The name of this class
	 * @type {String}
	 */
var _STORAGE = 'Storage',
	/**
	 * The storage type: local or session
	 * @type {Object}
	 */
	_STORAGE_TYPE = {
		cookie: 0,
		localStorage: 1,
		sessionStorage: 2
	};

/**
 * Based off of Remy's polyfill: https://gist.github.com/remy/350433
 * 
 * Adapted to use the same Storage object for both
 * local and session storage (for simplicity)
 * @class Storage
 * @param {TYPE} type
 * @param {Object} opts [optional]
 */
var Storage = Storm.Storage = function(type, opts) {
	opts = opts || {};

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_STORAGE);

	/**
	 * The type of storage
	 * @default STORAGE_TYPE.cookie
	 * @type {STORAGE_TYPE}
	 */
	this.type = type || _STORAGE_TYPE.cookie;

	var storageTypeName = _.invert(_STORAGE_TYPE);

	/**
	 * The name of the store.
	 * @type {String}
	 */
	this.name = opts.name || storageTypeName[this.type];
	
	/**
	 * The type of storage we're using
	 * @type {String} localStorage || sessionStorage
	 */
	this.storage = root[storageTypeName[this.type]];
	
	/**
	 * Whether we have access to native local/session storage
	 * @type {Boolean}
	 */
	this.hasStorage = _exists(this.storage);
	
	/**
	 * The data stored
	 * @type {Object}
	 */
	this.data = this._getData();

	/**
	 * The storage length
	 * @type {Number}
	 */
	this.length = (this.hasStorage) ? this.storage.length : _.size(this.data);
};

Storage.TYPE = _STORAGE_TYPE;

Storage.prototype = {
	/** @constructor */
	constructor: Storage,
	
	/**
	 * Clear all data from storage
	 * @return {Storage}
	 */
	clear: function() {
		this.data = {};
		this.length = 0;

		if (this.hasStorage) {
			this.storage.clear();
			return this;
		}

		this._clearCookieData();
		return this;
	},

	/**
	 * Get a key at the specified index
	 * @param  {Number} idx
	 * @return {String} key
	 */
	key: function(idx) {
		if (this.hasStorage) {
			return this.storage.key(idx);
		}

		// not perfect, but works
		var key, index = 0;
		for (key in this.data) {
			if (index === idx)  {
				return k;
			} else {
				index++;
			}
		}
		return null;
	},

	/**
	 * Retrieve item from data
	 * @param  {String || Array} key
	 * @return {Value}
	 */
	getItem: function(key) {
		// Array is passed, get all values under
		// the keys
		if (_.isArray) {
			var idx = key.length;
			while (idx--) {
				key[idx] = this.getItem(key[idx]);
			}
			return key;
		}

		if (this.hasStorage) {
			var storedValue = this.storage.getItem(key);
			if (!_exists(storedValue)) { return storedValue; }
			return JSON.parse(storedValue);
		}

		return this.data[key];
	},
	/** Proxy for getItem */
	get: function() { return this.getItem.apply(this, arguments); },

	/**
	 * Adds to data
	 * @param {String || Object} key
	 * @param {Value} value
	 */
	setItem: function(key, value) {
		// Not a string, must be an object,
		// multiple items are being set
		if (!_.isString(key)) {
			var k;
			for (k in key) {
				this.setItem(k, key[k]);
			}
			return;
		}

		if (this.hasStorage) {
			var storage = this.storage.setItem(key, JSON.stringify(value));
			this.length = this.storage.length;
			return storage;
		}

		this.data[key] = value;
		this.length++;
		this._setCookieData();
	},
	/** Proxy for setItem */
	store: function() { this.setItem.apply(this, arguments); },
	/** Proxy for setItem */
	set: function() { this.setItem.apply(this, arguments); },

	removeItem: function(key) {
		if (this.hasStorage) {
			var storage = this.storage.removeItem(key);
			this.length = this.storage.length;
			return storage;
		}

		delete this.data[key];
		this.length--;
		this._setCookieData();
	},
	remove: function(key) {
		this.removeItem(key);
		return this;
	},

	/**
	 * Create a cookie of the data
	 * @private
	 */
	_createCookie: function(value) {
		var days = (this.type === Storage.TYPE.session) ? 0 : 365,
			date = new Date(),
			expires;

		if (days > 0) {
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			expires = date.toGMTString();
		} else {
			expires = '0';
		}

		document.cookie = _stringFormat('{name}={value}; expires={expiration}; path=/', {
			name: this.name,
			value: value,
			expiration: expires
		});
	},

	/**
	 * Return data from the cookie
	 * @return {Value}
	 * @private
	 */
	_readCookie: function() {
		var nameEq = this.name + '=',
			ca = document.cookie.split(';'),
			idx = 0, length = ca.length, c;

		for (; idx < length; idx++) {
			c = ca[idx];
			while (c.charAt(0) === ' ') {
				c = c.substring(1, c.length);
			}

			if (c.indexOf(nameEq) === 0) {
				return c.substring(nameEq.length, c.length);
			}
		}
		return null;
	},

	/**
	 * Serializes the data in storage to a JSON
	 * string and stores it in a cookie
	 * @private
	 */
	_setCookieData: function() {
		var data = JSON.stringify(this.data);
		this._createCookie(data, 365);
	},

	/**
	 * Clear the cooke
	 */
	_clearCookieData: function() {
		this._createCookie('', 365);
	},

	/**
	 * Get all data in storage
	 * @return {Object}
	 * @private
	 */
	_getData: function() {
		var data = (this.hasStorage) ? null : this._readCookie();
		return (data) ? JSON.parse(data) : {};
	},

	/**
	 * Return storage values for JSON serialization
	 * @param  {String} key [optional] return a specific value
	 * @return {Value}
	 */
	toJSON: function(key) {
		var value = (key) ? this.get(key) : this._getData();
		return value;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function(key) {
		return _toString(_STORAGE, {
			type: _.invert(_STORAGE_TYPE)[this.type],
			length: this.length
		});
	}
};


/**
 * Expose a store for local storage
 * @type {Storage}
 */
Storm.store = new Storage(_STORAGE_TYPE.localStorage);

/**
 * Expose an instace of storage for the session
 * @type {Storage}
 */
Storm.session = new Storage(_STORAGE_TYPE.sessionStorage);

//----

// Extension ########################################################################

Events.extend = Cache.extend = AjaxCall.extend = DataContext.extend = Model.extend = Collection.extend = Comparator.extend = View.extend = Module.extend = Extend;


//----

// No Conflict ######################################################################

/**
 * Return the "Storm" global to its previous assignment
 * and return Storm back to caller.
 * @return {Storm}
 */
Storm.noConflict = function() {
	root.Storm = previousStorm;
	return this;
};

//----

	
	// Expose Storm as an AMD module
	if (typeof define !== 'undefined' && define.amd) {
		define('Storm', [], function() {
			return Storm;
		});
	}

}(this, _, Signal));