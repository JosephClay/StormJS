// Promise ##########################################################################

	/**
	 * Status values, determines
	 * what the promise's status is
	 * @type {Object}
	 */
var _PROMISE_STATUS = {
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
		return _toString('Promise', {
			status: _.invert(_PROMISE_STATUS)[this._status],
			done: this._getCalls(_PROMISE_CALL.done).length,
			fail: this._getCalls(_PROMISE_CALL.fail).length,
			always: this._getCalls(_PROMISE_CALL.always).length,
			progress: this._getCalls(_PROMISE_CALL.progress).length,
			pipe: this._getCalls(_PROMISE_CALL.pipe).length
		});
	}
};
