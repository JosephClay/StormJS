/*! Storm.JS - v0.0.9 - 2014-06-30
 * https://github.com/JosephClay/StormJS
 * Copyright (c) 2012-2014 Joe Clay; Licensed  */
(function(root, undefined) {

		/**
		 * Quick reference to Array.prototype.splice
		 * for duplicating arrays (while removing the 
		 * first parameter)
		 * @type {Function}
		 */
	var _ripFirstArg = (function(splice) {
			return function(arr) {
				return splice.call(arr, 0, 1)[0];
			};
		}([].splice)),
		
		/**
		 * Object merger
		 * @param {Objects}
		 * @return {Object}
		 */
		_extend = function() {
			var args = arguments,
				base = args[0],
				idx = 1, length = args.length,
				key, merger;
			for (; idx < length; idx += 1) {
				merger = args[idx];

				for (key in merger) {
					base[key] = merger[key];
				}
			}
		},

		/**
		 * Holds cached, parsed event keys by string
		 * @type {Object}
		 */
		_cache = {},

		/**
		 * Unique Id
		 * @type {Number}
		 */
		_id = 0,
		_uniqueId = function() {
			return _id++;
		},

		/**
		 * Cached regex used to parse event string
		 * @type {RegExp}
		 */
		_NAME_REGEX = /(?:([\w-]+):)?([\w-]*)(?:.([\w-]+))?/,
		_parseConfig = function(eventname) {
			var match = _NAME_REGEX.exec(eventname);
			return {
				// [0] : the entire match, don't care!
				// [1] : handle
				handle:    (match[1] === undefined) ? '' : match[1],
				// [2] : event
				evt:       (match[2] === undefined) ? '' : match[2],
				// [3] : namespace
				namespace: (match[3] === undefined) ? '' : match[3]
			};
		},

		_reassignEvents = function(handle, active, inactive) {
			inactive[handle] = inactive[handle] || {};
			inactive[handle] = _extend({}, active[handle]);
			delete active[handle];
		},

		_callEvents = function(events, args) {
			args = args || [];

			var idx = 0, length = events.length,
				evt;
			for (; idx < length; idx += 1) {
				evt = events[idx];
				if (!evt) { continue; }
				if (evt.apply(null, args) === false) { return; }
			}
		},

		_eventLookup = function(eventConfig, location) {
			var handle    = location[eventConfig.handle] || (location[eventConfig.handle] = {}),
				evt       = handle[eventConfig.evt]      || (handle[eventConfig.evt]      = {}),
				namespace = evt[eventConfig.namespace]   || (evt[eventConfig.namespace]   = []);

			return namespace;
		};


	var Signal = function() {
		/**
		 * Holds active events by handle + event + namespace
		 * @type {Object}
		 */
		this._active = {};

		/**
		 * Holds inactive events by handle - lazy creation
		 * @type {Object}
		 */
		// this._inactive;

		/**
		 * Holds subscriptions - lazy creation
		 * @type {Object}
		 */
		// this._subs;
	};

	_extend(Signal, {

		/**
		 * Returns a new Signal instance
		 * @return {Signal}
		 */
		construct: function() {
			return new Signal();
		},

		/**
		 * Klass extend method
		 * @param  {Function} constructor
		 * @param  {Object} extension   prototype extension
		 * @return {Function} constructor
		 */
		extend: function(constructor, extension) {
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
			_extend(fn, this);

			// Duplicate the prototype
			var NoOp = function() {};
			NoOp.prototype = this.prototype;
			fn.prototype = new NoOp();

			// Merge the prototypes
			_extend(fn.prototype, this.prototype, extension);
			fn.prototype.constructor = constructor || fn;

			return fn;
		}
	});

	Signal.prototype = {

		constructor: Signal,

		subscribe: function(name, func) {
			var subscriptions = this._subs || (this._subs = {});

			var id = _uniqueId(),
				location = subscriptions[name] || (subscriptions[name] = []);

			func.__subid__ = id;
			location.push(func);

			return id;
		},

		unsubscribe: function(name, id) {
			var subscriptions = this._subs || (this._subs = {});

			var location = subscriptions[name];
			if (!location) { return; }

			var idx = 0, length = location.length;
			for (; idx < length; idx += 1) {
				if (location[idx].__subid__ === id) {
					location.splice(idx, 1);
					return true;
				}
			}

			return false;
		},

		dispatch: function() {
			var subscriptions = this._subs || (this._subs = {});

			var args = arguments,
				name = _ripFirstArg(args),
				location = subscriptions[name] || (subscriptions[name] = []),
				idx = 0, length = location.length,
				func;
			for (; idx < length; idx++) {
				func = location[idx];
				if (func) { func.apply(null, args); }
			}
		},

		// Disable | Enable *************************************
		disable: function(handle) {
			var active = this._active,
				inactive = this._inactive || (this._inactive = {});
			
			_reassignEvents(handle, active, inactive);

			return this;
		},

		enable: function(handle) {
			var active = this._active,
				inactive = this._inactive || (this._inactive = {});
			
			_reassignEvents(handle, inactive, active);

			return this;
		},

		// On | Off ************************************************
		on: function(eventname, callback) {
			var eventConfig = _cache[eventname] || (_cache[eventname] = _parseConfig(eventname));

			_eventLookup(eventConfig, this._active).push(callback);

			return this;
		},
		bind: function() { this.on.apply(this, arguments); },

		off: function(eventname) {
			var active = this._active,
				eventConfig = _cache[eventname] || (_cache[eventname] = _parseConfig(eventname));

			if (eventConfig.evt === '') { // Removing a namespace

				var events = active[eventConfig.handle],
					eventName,
					namespaceName;
				for (eventName in events) {
					for (namespaceName in events[eventName]) {
						if (namespaceName === eventConfig.namespace) {
							active[eventConfig.handle][eventName][namespaceName].length = 0;
						}
					}
				}

			} else if (eventConfig.namespace !== '') { // Has a namespace
				
				active[eventConfig.handle][eventConfig.evt][eventConfig.namespace].length = 0;

			} else { // Does not have a namespace
				
				active[eventConfig.handle][eventConfig.evt] = { '': [] };

			}

			return this;
		},
		unbind: function() { this.off.apply(this, arguments); },

		// Based on underscore's once implementation
		once: function(eventname, callback) {
			var hasRan = false,
				memo;
			return this.on(eventname, function() {
				return function() {
					if (hasRan) { return memo; }
					hasRan = true;

					memo = callback.apply(this, arguments);
					callback = null;

					return memo;
				};
			});
		},

		// Trigger ************************************************
		trigger: function() {
			var args = arguments,
				active = this._active,
				eventname = _ripFirstArg(args),
				eventConfig = _cache[eventname] || (_cache[eventname] = _parseConfig(eventname)),
				// Always do an event lookup. This ensures that the location
				// of the event has been created so that calls to trigger
				// for events that haven't been registered don't throw exceptions
				location = _eventLookup(eventConfig, active);

			if (eventConfig.namespace !== '') { // If there's a namespace, trigger only that array
				
				_callEvents(location, args);

			} else { // Else, trigger everything registered to the event
				
				var subSignal = active[eventConfig.handle][eventConfig.evt],
					key;
				for (key in subSignal) {
					_callEvents(subSignal[key], args);
				}

			}

			return this;
		},

		// ListenTo | StopListening ********************************
		listenTo: function(obj, eventname, callback) {
			obj.on(eventname, callback);
			return this;
		},
		stopListening: function(obj, eventname) {
			obj.off(eventname);
			return this;
		}
	};

	// Create a pub/sub to expose Signal as
	// e.g. Signal.on(), Signal.trigger()
	var pubSub = new Signal();

	// Attach the Signal object as a property
	// of the exposed object so that new instances
	// can be constructed/extended
	// e.g. Signal.core.construct(), Signal.core.extend({})
	pubSub.core = Signal;

	// Expose
	root.Signal = pubSub;

}(this));

//----

(function(root, _, Signal, undefined) {
	// "root" is a safe reference to the environment.
	// setup so that this can be used in a node environment

//----

// Hold on to previous Storm reference (can release with noConflict)
var previousStorm = root.Storm,
	// Define Storm
	/** @namespace Storm */
	Storm = root.Storm = {
		name: 'StormJS',
		ajax: root.$ || { ajax: function() { console.error(_errorMessage('Storm.ajax', 'NYI')); } },
		$: root.$ || function() { console.error(_errorMessage('Storm.$', 'NYI')); }
	};


//----

// Helpers ##########################################################################

/**
 * Noop
 * @return {undefined}
 * @private
 */
var _noop = function() {};

// Small polyfill for console
var console = root.console || {};
console.log = console.log || _noop;
console.error = console.error || console.log;

/**
 * Easy slice function for array duplication
 * @param  {Array} arr
 * @return {Array} duplicate
 * @private
 */
var _slice = (function(ARRAY) {
	return function(arr) {
		return ARRAY.slice.call(arr);
	};
}([]));

/**
 * Existence check
 * @param  {*} value
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

	var _REGEX = new RegExp('{(.+?)}', 'g');

	return function(str, fill) {
		return str.replace(_REGEX, function(capture, value) {
			return _exists(fill[value]) ? fill[value] + '' : '';
		});
	};

}());

/**
 * Normalize how Storm returns strings of its
 * objects for debugging
 * @param  {String} name
 * @param  {Object} [props]
 * @return {String}
 * @private
 */
var _toString = function(name, props) {
	var hasProps = _exists(props);

	if (hasProps) {
		var key, arr = [];
		for (key in props) {
			arr.push(key + ': '+ props[key]);
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
 * @param  {String} name
 * @param  {String} message
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
 * @param  {*} prop
 * @private
 */
var _mixin = function(name, prop) {
	if (Storm[name] !== undefined) { return console.error(_errorMessage('mixin', 'Cannot mixin. "'+ name +'" already exists: '), name, Storm[name], prop); }
	Storm[name] = prop;
};


/**
 * Allows you to extend Storm with your own methods, classes and modules.
 * Pass a hash of `{name: function}` definitions to have your functions added.
 * @namespace Storm.mixin
 * @param  {String|Object} name Name of the object
 * @param  {Object}        prop The object to mixin
 */
Storm.mixin = function(name, prop) {
	// Mix single
	if (_.isString(name)) {
		return _mixin(name, prop);
	}

	// Mix multiple
	var key;
	for (key in name) {
		_mixin(key, name[key]);
	}
};


//----

var memo = Storm.memo = function(getter) {
	var secret;
	return function() {
		return secret || (secret = getter.call());
	};
};


//----

// Unique Id ########################################################################

/**
 * @typedef {Number} Id
 */

	/**
	 * Generates an ID number that is unique within the context of the current {@link Storm} instance.
	 * The internal counter does not persist between page loads.
	 * @function Storm.uniqId
	 * @param  {String} [prefix] Defines an optional scope (i.e., namespace) for the identifiers.
	 * @return {Id} Unique ID number.
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
	 * Generates an ID number prefixed with the given string that is unique within the context of the current {@link Storm} instance.
	 * The internal counter does not persist between page loads.
	 * @function Storm.uniqIdStr
	 * @param  {String} prefix String to prepend the generated ID number with.  Also used to scope (namespace) the unique ID number.
	 * @return {String} Unique ID number prefixed with the given string.
	 * @private
	 */
	_uniqIdStr = function(prefix) {
		return (prefix || 'id') + '' + _uniqId(prefix);
	};


//----

// Extend ###########################################################################

/**
 * Prototypical class extension
 * @see {@link https://github.com/JosephClay/Extend.git Extend}
 * @param {Function} [constructor]
 * @param {Object}   [extension]
 * @function Storm.Extend
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
 * Proxy to Signal.
 * @class Storm.Events
 * @see {@link https://github.com/JosephClay/Signal Signal}
 */
var Events = Storm.Events = Signal.core;

/**
 * Instantiate and merge a new Event system
 * into Storm so that Storm can be used as
 * a pub/sub
 */
_.extend(Storm, Events.construct());


//----

// Promise ##########################################################################

	/**
	 * The name of the class
	 * @const
	 * @type {String}
	 * @private
	 */
var _PROMISE = 'Promise',
	/**
	 * Status values, determines
	 * what the promise's status is
	 * @readonly
	 * @enum {Number}
	 * @alias Storm.Promise.STATUS
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
	 * @readonly
	 * @enum {Number}
	 * @alias Storm.Promise.CALL
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
 * API based on {@link https://api.jquery.com/promise/ jQuery.promises}
 * @class Storm.Promise
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
	 * @private
	 */
	this._calls = {};

	/**
	 * Current status
	 * @type {Number}
	 * @private
	 */
	this._status = _PROMISE_STATUS.idle;
};

Promise.STATUS = _PROMISE_STATUS;
Promise.CALL = _PROMISE_CALL;

Promise.prototype = /** @lends Storm.Promise# */ {
	constructor: Promise,

	/**
	 * Register a done call that is fired after a Promise is resolved
	 * @param  {Function} func
	 * @return {Storm.Promise}
	 */
	done: function(func) { return this._pushCall.call(this, _PROMISE_CALL.done, func); },
	/**
	 * Register a fail call that is fired after a Promise is rejected
	 * @param  {Function} func
	 * @return {Storm.Promise}
	 */
	fail: function(func) { return this._pushCall.call(this, _PROMISE_CALL.fail, func); },
	/**
	 * Register a call that fires after done or fail
	 * @param  {Function} func
	 * @return {Storm.Promise}
	 */
	always: function(func) { return this._pushCall.call(this, _PROMISE_CALL.always, func); },
	/**
	 * Register a progress call that is fired after a Promise is notified
	 * @param  {Function} func
	 * @return {Storm.Promise}
	 */
	progress: function(func) { return this._pushCall.call(this, _PROMISE_CALL.progress, func); },
	/**
	 * Register a pipe call that is fired before done or fail and whose return value
	 * is passed to the next pipe/done/fail call
	 * @param  {Function} func
	 * @return {Storm.Promise}
	 */
	pipe: function(func) { return this._pushCall.call(this, _PROMISE_CALL.pipe, func); },

	/**
	 * Pushes a function into a call array by type
	 * @param  {Storm.Promise.CALL} callType
	 * @param  {Function} func
	 * @return {Storm.Promise}
	 * @private
	 */
	_pushCall: function(callType, func) {
		this._getCalls(callType).push(func);
		return this;
	},

	/**
	 * Notify the promise - calls any functions in
	 * Promise.progress
	 * @return {Storm.Promise}
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
	 * @return {Storm.Promise}
	 */
	reject: function() {
		// If we've already called failed or done, go no further
		if (this._status === _PROMISE_STATUS.failed || this._status === _PROMISE_STATUS.done) { return this; }

		this._status = _PROMISE_STATUS.failed;

		// Never run the pipe on fail. Simply fail.
		// Running the pipe after an unexpected failure may lead to
		// more failures
		this._fire(_PROMISE_CALL.fail, arguments)
			._fire(_PROMISE_CALL.always, arguments);

		this._cleanup();

		return this;
	},

	/**
	 * Resolve the promise - calls any functions in
	 * Promise.done, then calls any functions in
	 * Promise.always
	 * @return {Storm.Promise}
	 */
	resolve: function() {
		// If we've already called failed or done, go no further
		if (this._status === _PROMISE_STATUS.failed || this._status === _PROMISE_STATUS.done) { return this; }

		this._status = _PROMISE_STATUS.done;

		var args = this._runPipe(arguments);
		this._fire(_PROMISE_CALL.done, args)
			._fire(_PROMISE_CALL.always, args);

		this._cleanup();

		return this;
	},

	/**
	 * Determine if the promise is in the status provided
	 * @param  {String|Storm.Promise.STATUS}  status key or STATUS value
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
	 * @param  {Storm.Promise.CALL} callType
	 * @param  {Array} args
	 * @return {Storm.Promise}
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
	 * @param  {Storm.Promise.CALL} type
	 * @return {Array}
	 * @private
	 */
	_getCalls: function(type) {
		return this._calls[_PROMISE_CALL_NAME[type]] || (this._calls[_PROMISE_CALL_NAME[type]] = []);
	},

	/**
	 * Allows a promise to be called like a
	 * Function.call() or Function.apply()
	 *
	 * Very useful for passing a promise as
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
	 * Cleanup references to functions stored in
	 * arrays that are no longer able to be called
	 * @private
	 */
	_cleanup: function() {
		this._getCalls(_PROMISE_CALL.done).length = 0;
		this._getCalls(_PROMISE_CALL.fail).length = 0;
		this._getCalls(_PROMISE_CALL.always).length = 0;
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
 * When to go with Promise. Used by calling `Storm.when()` and passing
 * promises to listen to. Storm.when can be chained with multiple calls
 * e.g. `Storm.when(p1, p2, p3).then(func).then(func).done(func).always(func);`
 * @function Storm.when
 * @param {...Storm.Promise} promises
 * @return {Storm.Promise} A new promise that resolves when all of the given <code>promises</code> resolve.
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
		 * @type {Storm.Promise}
		 */
		this._p = null;

		/**
		 * Store the promises being listened to
		 * @type {Array.<Promise>}
		 */
		this._events = [];
	};

	When.prototype = {
		constructor: When,

		/**
		 * Called by the public Storm.when function to initialize
		 * the when object
		 * @return {Storm.Promise}
		 */
		init: function() {
			this._events = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments);
			this._subscribe();

			var promise = new Promise();
			promise.then = function() { this.done.apply(this, arguments); };
			this._p = promise;
			return promise; // Return the promise so that it can be subscribed to
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
				if (evt.status() === Promise.STATUS.idle) { return; }
				if (evt.status() === Promise.STATUS.done) { done += 1; continue; }
				if (evt.status() === Promise.STATUS.failed) { failed += 1; continue; }
			}
			this._fire(total, done, failed, arguments);
		},

		/**
		 * Based on the statuses of our promises, fire the
		 * appropriate events
		 * @param  {Number}    total  total number of promises
		 * @param  {Number}    done   promises in a done state
		 * @param  {Number}    failed promises in a failed state
		 * @param  {Arguments} args   arguments to pass
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


//----

// Request ##########################################################################

/**
 * @const
 * @type {string}
 * @private
 */
var _REQUEST = 'request',

	/**
	 * Stores in-progress AjaxCalls by id
	 * @type {Object}
	 * @private
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
		 * @param  {Storm.AjaxCall} call
		 */
		send: function(call) {
			// this call is already being tracked, stop
			if (_requestsRecords[call.getId()]) { return; }
			_requestsRecords[call.getId()] = call;

			Storm.request.trigger('send', call);
		},

		/**
		 * Called when an AjaxCall is done, notifies Storm.request
		 * @param  {Storm.AjaxCall}   call
		 */
		done: function(call) {
			Storm.request.trigger('done', call);
		},

		/**
		 * Called when an AjaxCall fails, notifies Storm.request
		 * @param  {Storm.AjaxCall}   call
		 */
		fail: function(call) {
			Storm.request.trigger('fail', call);
		},

		/**
		 * Called when an AjaxCall is aborted, notifies Storm.request
		 * @param  {Storm.AjaxCall}   call
		 */
		abort: function(call) {
			Storm.request.trigger('abort', call);
		},

		/**
		 * Called when an AjaxCall is done/aborted/failed, notifies Storm.request
		 * Removes the call from the records
		 * @param  {Storm.AjaxCall}   call
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
 * Possible events are: `send`, `done`, `fail`, `abort`, `always`
 * 
 * @namespace Storm.request
 */
Storm.request = Events.construct();
_.extend(Storm.request, /** @lends Storm.request# */ {

	/**
	 * Get the requests in-progress.
	 * @function Storm.request.getQueue
	 * @return {Object}
	 */
	getQueue: function() {
		return _requestsRecords;
	},

	/**
	 * Get the total number of requests in-progress.
	 * @function Storm.request.getTotal
	 * @return {Number}
	 */
	getTotal: function() {
		return _.size(_requestsRecords);
	},

	/**
	 * Debug string
	 * @function Storm.request.toString
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
	 * @const
	 * @type {String}
	 * @private
	 */
var _AJAX_CALL = 'AjaxCall',
	/**
	 * Available classifications for a call to reside in.
	 * Gives flexibility to a call to be in a classification
	 * that gives it meaning to the application and not the
	 * server
	 * @readonly
	 * @enum {Number}
	 * @private
	 */
	_CLASSIFICATION = {
		nonblocking: 0,
		blocking: 1
	},
	/**
	 * @param {String} type
	 * @private
	 */
	_addClassification = function(type) {
		// The type has already been defined
		if (type in _CLASSIFICATION) { return; }

		// Using _.size ensures a unique id
		// for the type passed
		_CLASSIFICATION[type] = _.size(_CLASSIFICATION);
	};

/**
 * A wrapper for an ajax `call` configuration (referred to as a "call"). 
 * This object can ajax, abort and be passed around the application.
 *
 * @class Storm.AjaxCall
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

_.extend(AjaxCall, /** @lends Storm.AjaxCall */ {
	/**
	 * @readonly
	 * @enum {Number}
	 */
	CLASSIFICATION: _CLASSIFICATION,

	/**
	 * Add a classification type to the AjaxCall
	 * as a global option
	 * @param {String|Array.<String>} type
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

AjaxCall.prototype = /** @lends Storm.AjaxCall# */ {
	constructor: AjaxCall,

	/**
	 * Defaults.
	 * @type {Object}
	 */
	defaults: {
		name: '',
		type: 'GET',
		content: 'application/json; charset=utf-8',
		url: '',
		cache: false,
		classification: _CLASSIFICATION.nonblocking
	},

	/**
	 * Configure the call object so that it's ready to ajax
	 * @param {Object} providedCall call object
	 * @param {Object} opts         configurations for the url
	 * @param {Object} callTemplate
	 * @returns {Storm.AjaxCall}
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
	 * @param  {*} [data]
	 * @return {Storm.AjaxCall|*}
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
	 * @return {Id} id
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
	 * @type {@link Storm.AjaxCall.CLASSIFICATION}
	 * @param  {Storm.AjaxCall.CLASSIFICATION} classification
	 * @return {Boolean}
	 */
	isClassification: function(type) {
		return (type === this._call.classification);
	},

	/**
	 * Gets a property on the call configuration
	 * @param  {String} key    the key to get from the configuration
	 * @return {*}
	 */
	get: function(key) {
		return this._call[key];
	},

	/**
	 * Sets a property on the call configuration
	 * @param  {String} key    the key to replace in the configuration
	 * @param  {*}  value  the value to apply
	 * @return {Storm.AjaxCall}
	 */
	set: function(key, value) {
		this._call[key] = value;
		return this;
	},

	/**
	 * Uses {@link Storm.ajax} to ajax the stored call object
	 * @param  {Storm.Promise} [promise]
	 * @return {Storm.Promise} request
	 */
	send: function(promise) {
		promise = promise || new Storm.Promise();

		// Ensure the promise has the ability to abort
		promise.abort = _.bind(this.abort, this);

		var self = this,
			call = this._call,
			params = _.extend({}, call, {
				contentType: call.content,
				success: function(data) {
					if (promise) { promise.resolve(data); }
					self.success.apply(self, arguments);
					Request.done(self);
				},
				progress: function() {
					if (promise) { promise.notify(); }
				},
				error: function(req, status, err) {
					self.req = req;
					self.status = status;
					self.err = err;

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
					self.complete.apply(self, arguments);
					Request.always(self);
				}
			});

		// Record the call
		Request.send(this);

		var request = this.request = Storm.ajax.ajax(params);

		return promise;
	},

	/**
	 * Fired when an `xhr` request is successful.
	 * Feel free to override.
	 * @param  {Object|String|null} data
	 */
	success: function(data) {},

	/**
	 * Fired when an `xhr` request completes.
	 * Feel free to override.
	 */
	error: function(req, status, err) {},

	/**
	 * Fired when an `xhr` request completes.
	 * Feel free to override.
	 * @function
	 */
	complete: _noop,

	/**
	 * Aborts the current request
	 * @return {Storm.AjaxCall}
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
 * @const
 * @type {String}
 * @private
 */
var _DATA_CONTEXT = 'DataContext';

/**
 * Used to construct ajax calls to communicate with the server.
 * Is a central location for configuration data
 * to get and send data about models and collections
 * @class Storm.DataContext
 */
var DataContext = Storm.DataContext = function() {
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_DATA_CONTEXT);
};

_.extend(DataContext, /** @lends Storm.DataContext */ {
	/**
	 * Default settings for the DataContext,
	 * where we are is usually useful
	 * @type {Object}
	 */
	settings: (function() {
		var loc = root.location || {};
		return {
			host: loc.host,
			hostname: loc.hostname,
			origin: loc.origin,
			pathname: loc.pathname,
			port: loc.port
		};
	}()),

	/**
	 * Add settings to the global `DataContext.settings`
	 * object. Basically a protected `_.extend`
	 * @param {Object} settings
	 * @return {Object} DataContext.settings
	 */
	addSettings: function(settings) {
		return _.extend(DataContext.settings, settings);
	},

	/**
	 * Get a setting from the global `DataContext.settings`
	 * @param {String} setting
	 * @return {*} value
	 */
	getSetting: function(setting) {
		return DataContext.settings[setting];
	}
});

DataContext.prototype = /** @lends Storm.DataContext# */ {
	constructor: DataContext,

	/**
	 * AjaxCall, the constructor of the AjaxCall
	 * to use when configuring a new call object
	 * @type {Storm.AjaxCall}
	 */
	AjaxCall: AjaxCall,

	/**
	 * @type {Object}
	 */
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

	/**
	 * Get a setting from the global `DataContext.settings`
	 * @param {String} setting
	 * @return {*} value
	 */
	getSetting: function(setting) {
		return DataContext.getSetting(setting);
	},

	/**
	 * Add more options to this data context
	 * @param  {Object} opts
	 * @return {Storm.DataContext}
	 */
	extendOptions: function(opts) {
		this.options = _.extend({}, this.defaults, opts);
		return this;
	},

	/**
	 * Remove an option from this data context
	 * @param  {String} key
	 * @return {Storm.DataContext}
	 */
	removeOption: function(key) {
		delete this.options[key];
		return this;
	},

	/**
	 * Creates and returns a new AjaxCall
	 * @param  {Object}      call   see AjaxCall.defaults
	 * @param  {Object}      extensionData  Addition configurations for the url
	 * @return {Storm.AjaxCall}
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

// Template ########################################################################

/**
 * Centralized template registration for
 * holding, compiling and rendering client-side
 * templates
 *
 * The template engine only has one requirement,
 * a `compile` function that returns a render function.
 * The render function will be called with the data
 * as the first parameter.
 *
 * Common libraries that use this paradigm are:
 * Mustache, Handlebars, Underscore etc...
 *
 * @namespace Storm.template
 */
Storm.template = (function() {

		/**
		 * The name of this class
		 * @const
		 * @type {String}
		 * @private
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
	 * @param  {String|Function|Array} tpl
	 * @param  {Object} [opts]
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
	 * @param  {String|Function|Array} tpl
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
	 * @param  {Object} [data] passed to the template engine as a parameter
	 * @return {String} rendered template
	 */
	var _render = function(name, data) {
		var tpl = _retrieve(name);
		return tpl(data || {});
	};

	return /** @lends Storm.template */ {
		add: _register,
		remove: _remove,
		render: _render,

		/**
		 * Sets the client-side templating engine
		 * for `Storm.template` to use.
		 * @param {Object} engine
		 */
		setEngine: function(engine) {
			_engine = engine;
		},

		/**
		 * Return the registered template strings
		 * @param  {String} [key] a specific template
		 * @return {String|Object}
		 */
		toJSON: function(key) {
			var value = (key) ? _templates[key] : _templates;
			return value;
		},

		/**
		 * Debug string
		 * @return {String}
		 */
		toString: function() {
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
 * @const
 * @type {String}
 * @private
 */
var _VIEW = 'View';

/**
 * A view at its most basic. Sets up a couple
 * defaults for cloning and commonly used methods
 * @class Storm.View
 * @extends Storm.Events
 * @param {Object} [opts]
 */
var View = Storm.View = function(opts) {
	Events.call(this);

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

	/** @type {String} */
	this.template = this.template || opts.template || '';
};

_.extend(View.prototype, Events.prototype, /** @lends Storm.View# */ {
	constructor: View,

	/**
	 * Get the private id of the view
	 * @return {Number} id
	 */
	getId: function() { return this._id; },

	/**
	 * Returns a clone of the view
	 * @return {Storm.View}
	 */
	clone: function() {
		return new this.constructor(this.options);
	},

	/**
	 * Generates the HTML markup for the view.
	 * Must be overridden by subclasses.
	 * @function
	 * @return {String} HTML markup.
	 */
	render: _noop,

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
 * @const
 * @type {String}
 * @private
 */
var _MODEL = 'Model';

/**
 * The base data object for the application. Stores
 * and protects a piece of data and gives an interface
 * to manipulate it. Works in conjunction
 * with a Collection to organize data into sets.
 *
 * @class Storm.Model
 * @extends Storm.Events
 *
 * @param {Object} data Key-value pairs.
 * @param {Object} [opts]
 */
var Model = Storm.Model = function(data, opts) {
	Events.call(this);

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

	if (this.comparator) {
		/**
		 * If there's a Comparator, then bind it to this model
		 * @type {Storm.Comparator}
		 */
		this.comparator.bind(this);
	}
};

_.extend(Model.prototype, Events.prototype, /** @lends Storm.Model# */ {
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
	 * @return {Storm.Model}
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
	 * @return {Storm.Model}
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
	 * @return {Storm.Model}
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
	 * @param  {String|Array.<String>} prop
	 * @return {*|Array.<*>}
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
	 * @return {*}
	 * @private
	 */
	_get: function(prop) {
		// If a getter is set, call the function to get the return value
		if (this._getters[prop]) {
			return this._getters[prop].call(null, this.__data[prop]);
		}

		// Otherwise, return the value
		return this.__data[prop];
	},

	/**
	 * Sets the value of a property in the Model. Values can be set
	 * in key-value pairs in an object, or as string/value as
	 * separate parameters
	 * @param {String|Object} prop
	 * @param {*} data
	 * @param {Object} opts
	 * @return {Storm.Model}
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
	 * @param {*}  data
	 * @param {Object} [opts]
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
	 * @param {String|Object} prop
	 * @param {*} data
	 * @param {Object} [opts]
	 * @return {Storm.Model}
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
	 * items that pre-exist in the data. No remove event will be fired
	 * if the property has an undefined value. An array can be passed
	 * to remove multiple properties or a string as a single parameter
	 * @param {String|Array.<String>} prop
	 * @param {Object} [opts]
	 * @return {Storm.Model}
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
	 * @return {*}
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
	 * @param  {String}  [prop]
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
	 * @return {Storm.Model}
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
	 * @param  {*} data
	 * @return {*}
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
	 * Duplicates the current model data and assigns it
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
	 * @param {*} data
	 * @param {Object} [opts]
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
	 * @param {Object} [opts]
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
	 * @param  {*} data
	 * @param  {Object} [opts]
	 * @private
	 */
	_change: function(prop, data, opts) {
		this._backup();

		this.__data[prop] = this._duplicate(data);

		// Fire off change events
		if (_.isEqual(this.__previousData[prop], this.__data[prop])) { return; } // The data didn't actually change
		if (!this._validate()) { return (this.__data = this._duplicate(this.__previousData)); } // If invalid, revert changes
		if (opts && opts.isSilent) { return; } // Check if silent
		this.trigger('change:' + prop, data);
		this.trigger('model:change', prop, data);
	},

	/**
	 * Compares this model to another. Used by Collection for
	 * sorting. Checks for `Storm.Comparator` to use natively but
	 * can be overwritten
	 * @param  {Storm.Model} comparisonModel
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
	 * @const
	 * @type {String}
	 * @private
	 */
var _COMPARATOR = 'Comparator',
	/**
	 * Stores sort types to use to compare models
	 * Default is alphabetical (0)
	 * @readonly
	 * @enum {Number}
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
	 * @param {Function} fn comparator
	 */
	_addSort = function(type, fn) {
		// The type has already been defined
		if (type in _SORT) { return; }

		// Using _.size ensures a unique id
		// for the type passed
		_SORT[type] = _.size(_SORT);

		Comparator.prototype[type] = fn || _noop;
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
 * @class Storm.Comparator
 * @param {String} key the key on the model used for comparison
 * @param {Storm.Comparator.SORT} [type]
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
	 * @type {Storm.Comparator.SORT}
	 * @default alphabetical
	 * @private
	 */
	this._type = type || _SORT.alphabetical;
};

_.extend(Comparator, /** @lends Storm.Comparator */ {

	/**
	 * Default string to use if no value is present to
	 * compare against.
	 * @type {String}
	 */
	HOIST: '___',

	/**
	 * Sort types
	 * @readonly
	 * @enum {Number}
	 * @default alphabetical
	 */
	SORT: _SORT,

	/**
	 * Add a sort type to the Comparator
	 * as a global option
	 * @param {String|Array.<String>} type
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

Comparator.prototype = /** @lends Storm.Comparator# */ {
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
	 * @return {Storm.Comparator}
	 */
	invalidateSortValue: function(model) {
		delete _store[model.getId()];
		return this;
	},

	/**
	 * Get the value to sort by
	 * @param  {Storm.model}  model
	 * @return {*}
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
	 * @param  {Storm.Model}  model
	 * @return {String} value
	 */
	alphabetical: function(model) {
		var value = model.get(this._key);
		value = _.exists(value) ? (value + '').toLocaleLowerCase() : Comparator.HOIST;
		return value;
	},

	/**
	 * Default numeric sort.
	 * This method gets the value from the model
	 * and ensures a number return value
	 * @param  {Storm.Model}  model
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
	 * @param  {Storm.Model}  model
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
 * @const
 * @type {String}
 * @private
 */
var _COLLECTION = 'Collection';

var _getModelId = function(model) {
	return (model instanceof Storm.Model) ? model.getId() : parseInt(model, 10) || -1;
};

/**
 * A collection of Models
 * @param {Object} [data]
 * @class Storm.Collection
 * @extends Storm.Events
 */
var Collection = Storm.Collection = function(data) {
	Events.call(this);
	data = data || {};

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_COLLECTION);

	/**
	 * Storage for the models
	 * @type {Array.<Storm.Model>}
	 * @private
	 */
	this._models = [];

	this.add(data.models, _.extend({ isSilent: true }, data));
};

_.extend(Collection.prototype, Events.prototype, /** @lends Storm.Collection# */ {
	constructor: Collection,

	/** @type {Storm.Model} */
	Model: Model,

	/**
	 * Get the private id of the collection
	 * @return {Id} id
	 */
	getId: function() {
		return this._id;
	},

	/**
	 * Create a new model
	 * @param  {Object} model the model data
	 * @param  {Object} [opts]
	 * @return {Storm.Model}
	 */
	newModel: function(model, opts) {
		return new this.Model(model, opts);
	},

	/**
	 * Get all models
	 * @return {Array.<Storm.Model>}
	 */
	getModels: function() {
		return this._models;
	},

	/**
	 * Get a model by key-value
	 * @param  {String} key
	 * @param  {*} value
	 * @return {Storm.Model}
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
	 * same as `getModels().length`
	 * @return {Number} length
	 */
	length: function() {
		return this._models.length;
	},

	/**
	 * Clear all of the models from the collection
	 * @return {Storm.Collection}
	 */
	clear: function() {
		var models = this._models,
			idx = models.length;
		while (idx--) {
			models[idx].trigger('destroy');
		}
		this._models.length = 0;
		return this;
	},

	/**
	 * Overwrites the private models array
	 * with a new array of models
	 * @param  {Array.<Storm.Model>} models
	 * @return {Array.<Storm.Model>}
	 */
	overwrite: function(models) {
		return (this._models = models);
	},

	/**
	 * Retrieve a model at the provided index
	 * @param  {Number} idx
	 * @return {Storm.Model}
	 */
	at: function(idx) {
		return this._models[idx];
	},

	/**
	 * Get the index of a model
	 * @param  {Storm.Model|Id} model
	 * @return {Number} index
	 */
	indexOf: function(model) {
		var id = _getModelId(model),
			models = this._models,
			idx = models.length;
		while (idx--) {
			if (models[idx].getId() === id) { return idx; }
		}
		return -1;
	},

	/**
	 * Add models to the collection, creating new models
	 * if the model is not an instance of `Storm.Model`,
	 * sorting the models and firing events
	 * @param {Array.<Storm.Model>} models
	 * @param {Object} [opts]
	 * @param {Object} data additional data to pass to the new models
	 */
	add: function(models, opts) {
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
				model = this.newModel(model, opts);
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
				var i = 0, len = add.length;
				for (; i < len; i++) {
					this._models.splice(at + i, 0, add[i]);
				}
			} else {
				this._models = this._models.concat(add);

				// Only sort if we're not adding the models
				// at a specific point
				this.sort(opts);
			}
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
	 * @param  {Storm.Model} model
	 * @param  {Object} opts will be passed to remove
	 * @return {Storm.Model} the removed model
	 */
	push: function(model, opts) {
		opts = _.extend({ at: this._models.length }, opts);
		this.add(model, opts);
		return model;
	},

	/**
	 * As you would expect
	 * @param  {Storm.Model} model
	 * @param  {Object} opts will be passed to remove
	 * @return {Storm.Model} the removed model
	 */
	unshift: function(model, opts) {
		opts = _.extend({ at: 0 }, opts);
		this.add(model, opts);
		return model;
	},

	/**
	 * Remove a model from the collection
	 * @param  {Storm.Model|Storm.Model[]} models
	 * @param  {Object} [opts]
	 * @return {Storm.Collection}
	 */
	remove: function(models, opts) {
		models = _.isArray(models) ? models.slice() : [models];
		opts = opts || {};

		var idx = models.length, model;
		while (idx--) {
			model = models[idx];
			model = (model instanceof Storm.Model) ? model : this.get(model);
			if (!model) { continue; }

			var index = this.indexOf(model);
			if (index === -1) { continue; }

			this._models.splice(index, 1);
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
	 * @return {Storm.Model} the removed model
	 */
	shift: function(opts) {
		var model = this.at(0);
		this.remove(model, opts);
		return model;
	},

	/**
	 * As you would expect
	 * @param  {Object} opts will be passed to remove
	 * @return {Storm.Model} the removed model
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
	 * @return {Array.<Storm.Model>}
	 */
	slice: function(begin, end) {
		return this._models.slice(begin, end);
	},

	/**
	 * Force the collection to re-sort itself. You don't need to call this under
	 * normal circumstances, as the collection will maintain sort order as items
	 * are added.
	 * @param  {Object} [opts]
	 * @return {Storm.Collection}
	 */
	sort: function(opts) {
		opts = opts || {};

		if (opts.skipSort || // Skipping sort
			!this.length() || // Nothing to sort
			!this.at(0).comparator) { // Models not sortable
			return this;
		}

		Collection.arraySort.call(this._models, function(a, b) {
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
	 * @param  {Object} values Hash containing key-value pairs
	 * @param  {Boolean} [first] return first found
	 * @return {Storm.Model|Array.<Storm.Model>}
	 */
	where: function(values, first) {
		if (_.isEmpty(values)) { return first ? undefined : []; }

		var method = this[first ? 'find' : 'filter'];
		return method.call(this, function(model) {
			var key;
			for (key in values) {
				if (values[key] !== model.get(key)) { return false; }
			}
			return true;
		});
	},

	/**
	 * Proxy for `.where(values, true)`
	 * @param  {Object} values
	 * @return {Storm.Model}
	 */
	findWhere: function(values) {
		return this.where(values, true);
	},

	/**
	 * Find a model by id
	 * @param  {Id} id model _id
	 * @return {Storm.Model}
	 */
	findById: function(id) {
		if (!_exists(id)) { return null; }
		id = _.isNumber(id) ? id : parseInt(id, 10); // make sure id is a number

		var models = this.getModels(),
			idx = models.length,
			model;
		while (idx--) {
			model = models[idx];
			if (model && model.getId() === id) {
				return model;
			}
		}
		return null;
	},

	/**
	 * Get all model values of the provided key
	 * @param  {String} key
	 * @return {Array.<*>}
	 */
	pluck: function(key) {
		return _.invoke(this._models, 'get', key);
	},

	/**
	 * Gets a model by its id
	 * @param  {Id} id
	 * @return {Storm.Model}
	 */
	getById: function(id) {
		if (!_exists(id)) { return null; }
		id = parseInt(id, 10); // make sure id is a number

		var models = this._models,
			idx = models.length;
		while (idx--) {
			if (models[idx].getId() === id) {
				return models[idx];
			}
		}
		return null;
	},
	/**
	 * Proxy for getById
	 * @alias {#getById}
	 */
	get: function(modelOrId) {
		var id = modelOrId instanceof Storm.Model ? modelOrId.getId() : modelOrId;
		return this.getById(id);
	},

	/**
	 * Drops all models from the collection
	 * @param  {Object} [opts]
	 * @return {Storm.Collection}
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
	 * @return {Storm.Model}
	 */
	clone: function() {
		return new this.constructor({ model: this.model, models: this._models });
	},

	/**
	 * Similar to `Storm.Model.retrieve`, returns all model data
	 * in the collection
	 * @return {Array.<Object>}
	 */
	retrieve: function() { // To match model.retrieve()
		return _.map(this._models, function(model) {
			return model.retrieve();
		});
	},

	/**
	 * Return the data to serialize to JSON
	 * @return {Array.<Object>}
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

/** @type {Function} */
Collection.arraySort = Array.prototype.sort;

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
 * @const
 * @type {String}
 * @private
 */
var _MODULE = 'Module';

/**
 * A reusable module equipped with events
 * @class Storm.Module
 * @extends Storm.Events
 */
var Module = Storm.Module = function() {
	Events.call(this);

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_MODULE);
};

_.extend(Module.prototype, Events.prototype, /** @lends Storm.Module# */ {
	constructor: Module,
	
	/**
	 * Get the private id of the Module
	 * @return {Number} id
	 */
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
 * @const
 * @type {String}
 * @private
 */
var _CACHE = 'Cache';

/**
 * An in-memory key-value store
 * @class Storm.Cache
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

Cache.prototype = /** @lends Storm.Cache# */ {
	constructor: Cache,

	/**
	 * Stores data in the cache
	 * @param  {String|Object} key
	 * @param  {*} data
	 * @param  {Object} [opts]
	 * @return {Storm.Cache}
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
	 * @param  {String|String[]} key
	 * @return {*|Array.<*>}
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
	 * @param  {String|String[]} keys
	 * @return {Storm.Cache}
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
	 * Resets the cache, emptying it 
	 * and clearing any expirations
	 * @return {Storm.Cache}
	 */
	flush: function() {
		this._clearExpirations();
		this._cache = {};
		return this;
	},

	/**
	 * Stores data in the cache
	 * @param  {String} key
	 * @param  {*} data
	 * @param  {Object} [opts]
	 * @private
	 */
	_store: function(key, data, opts) {
		opts = opts || {};

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
	 * @param  {String} [key]
	 * @return {Object|Array} JSON object.
	 */
	toJSON: function(key) {
		var value = (key) ? this.get(key) : this._cache;
		return value;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_CACHE, {
			id: this._id,
			size: _.size(this._cache)
		});
	}
};

// Underscore methods that we want to implement on the Cache.
_.each([
	'keys',
	'values',
	'pairs',
	'functions',
	'pick',
	'omit',
	'tap',
	'has',
	'isEqual',
	'isEmpty',
	'each'
], function(method) {
	Cache.prototype[method] = function() {
		var args = _.toArray(arguments);

		// Add this Model's data as the first
		// argument
		args.unshift(this._cache);

		// the method is the underscore methods with
		// an underscore context and the arguments with
		// the models first
		return _[method].apply(_, args);
	};
});

/**
 * Expose a default cache to use in the application
 * @type {Storm.Cache}
 */
Storm.cache = new Cache();


//----

// Storage ##########################################################################

	/**
	 * The name of this class
	 * @const
	 * @type {String}
	 * @private
	 */
var _STORAGE = 'Storage',
	/**
	 * Stores timeouts for all
	 * instaces of Storage
	 * @type {Object}
	 * @private
	 */
	_timeouts = {},
	/**
	 * The storage type: local or session
	 * @readonly
	 * @enum {Number}
	 * @alias Storm.Storage.TYPE
	 */
	_STORAGE_TYPE = {
		cookie: 0,
		localStorage: 1,
		sessionStorage: 2
	};

/**
 * Based off of {@link https://gist.github.com/remy/350433 Remy's} polyfill. 
 *
 * Adapted to use the same Storage object for both local and session storage.
 * 
 * @class Storm.Storage
 * @param {Storm.Storage.TYPE} [type]
 * @param {Object} [opts]
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
	 * @type {Storm.Storage.TYPE}
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
	 * @type {String}
	 * @example localStorage || sessionStorage
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

Storage.prototype = /** @lends Storm.Storage# */ {
	constructor: Storage,

	/**
	 * Clear all data from storage
	 * @return {Storm.Storage}
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
	 * @param  {String|Array.<String>} key
	 * @return {*}
	 */
	getItem: function(key) {
		// Array is passed, get all values under
		// the keys
		if (_.isArray(key)) {
			var idx = key.length;
			while (idx--) {
				key[idx] = this.getItem(key[idx]);
			}
			return key;
		}

		if (this.hasStorage) {
			var storedValue = this.storage.getItem(key);
			if (!_exists(storedValue)) { return storedValue; }
			return (storedValue === '') ? '' : JSON.parse(storedValue);
		}

		return this.data[key];
	},
	/**
	 * Proxy for getItem
	 * @alias {#getItem}
	 */
	get: function() { return this.getItem.apply(this, arguments); },

	/**
	 * Adds to data
	 * @param {String|Object} key
	 * @param {*|undefined} value
	 * @param {Object} [opts] for setting the expiration
	 */
	setItem: function(key, value, opts) {
		// Not a string, must be an object,
		// multiple items are being set
		if (!_.isString(key)) {
			var k;
			for (k in key) {
				this.setItem(k, key[k], value);
			}
			return;
		}

		// Expiration
		if (opts) {
			if (_exists(opts.expiration)) {
				this._setExpiration(key, opts.expiration || 0);
			}
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

	/**
	 * Proxy for setItem
	 * @alias {#setItem}
	 */
	store: function() { this.setItem.apply(this, arguments); },
	/**
	 * Proxy for setItem
	 * @alias {#setItem}
	 */
	set: function() { this.setItem.apply(this, arguments); },

	/**
	 * Remove all data in storage
	 * @return {Storm.Storage}
	 */
	flush: function() {
		var key;
		for (key in this.data) {
		   this.removeItem(key);
		}
		return this;
	},

	/**
	 * Remove an item from storage by key
	 * @param {String} key
	 * @returns {*}
	 */
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
	/**
	 * Remove an item from storage by key
	 * @param {String} key
	 * @returns {Storm.Storage}
	 */
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
	 * @return {*}
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
	 * @private
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
	 * Removes data from a key after an interval
	 * @param {String} key
	 * @param {Number} duration
	 * @private
	 */
	_setExpiration: function(key, duration) {
		var self = this,
			timeoutKey = this._id + key;

		if (_timeouts[timeoutKey]) { clearTimeout(_timeouts[timeoutKey]); }

		_timeouts[timeoutKey] = setTimeout(function() {
			self.removeItem(key);
			delete _timeouts[timeoutKey];
		}, duration);
	},

	/**
	 * Return storage values for JSON serialization
	 * @param  {String} [key] return a specific value
	 * @return {*}
	 */
	toJSON: function(key) {
		var value = (key) ? this.get(key) : this._getData();
		return value;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_STORAGE, {
			type: _.invert(_STORAGE_TYPE)[this.type],
			length: this.length
		});
	}
};


/**
 * Expose a store for local storage
 * @type {Storm.Storage}
 */
Storm.store = new Storage(_STORAGE_TYPE.localStorage);

/**
 * Expose an instace of storage for the session
 * @type {Storm.Storage}
 */
Storm.session = new Storage(_STORAGE_TYPE.sessionStorage);


//----

// Extension ########################################################################

Events.extend = Cache.extend = AjaxCall.extend = DataContext.extend = Model.extend = Collection.extend = Comparator.extend = View.extend = Module.extend = Extend;


//----

// No Conflict ######################################################################

/**
 * Return the `Storm` global to its previous assignment
 * and return Storm back to caller.
 * @return {Storm}
 * @namespace Storm.noConflict
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