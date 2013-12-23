/* Promise =========================================================================
===================================================================================== */
var Promise = Storm.Promise = (function() {

	var _STATUS = {
			idle:       0,
			progressed: 1,
			failed:     2,
			done:       3
		},
		_CALL = {
			done:     0,
			fail:     1,
			always:   2,
			progress: 3,
			pipe:     4
		},
		_CALL_NAME = _.invert(_CALL);

	var Promise = function() {
		this._calls = {};
		this.status = _STATUS.idle;
	};

	Promise.STATUS = _STATUS;
	Promise.CALL = _CALL;

	Promise.prototype = {
		constructor: Promise,

		done:     function(func) { return this.pushCall.call(this, _CALL.done,     func); },
		fail:     function(func) { return this.pushCall.call(this, _CALL.fail,     func); },
		always:   function(func) { return this.pushCall.call(this, _CALL.always,   func); },
		progress: function(func) { return this.pushCall.call(this, _CALL.progress, func); },
		pipe:     function(func) { return this.pushCall.call(this, _CALL.pipe,     func); },

		pushCall: function(callType, func) {
			this._getCalls(callType).push(func);
			return this;
		},

		notify: function() {
			this.status = _STATUS.progressed;

			var args = this._runPipe(arguments);
			this._fire(_CALL.progress, args)._fire(_CALL.always, args);

			return this;
		},
		reject: function() {
			this.status = _STATUS.failed;

			// Never run the pipe on fail. Simply fail.
			// Running the pipe after an unexpected failure may lead to
			// more failures
			this._fire(_CALL.fail, arguments)._fire(_CALL.always, arguments);

			return this;
		},
		resolve: function() {
			this.status = _STATUS.done;

			var args = this._runPipe(arguments);
			this._fire(_CALL.done, args)._fire(_CALL.always, args);

			return this;
		},

		_fire: function(callType, args) {
			var calls = this._getCalls(callType),
				idx = 0, length = calls.length;
			for (; idx < length; idx++) {
				calls[idx].apply(null, args);
			}
			return this;
		},

		_runPipe: function(args) {
			var pipes = this._getCalls(_CALL.pipe),
				idx = 0, length = pipes.length, val;
			for (; idx < length; idx++) {
				val = pipes[idx].apply(null, args);
				if (val !== undefined) { args = [val]; }
			}

			return args;
		},

		_ensureCallType: function(type) {
			this._calls[_CALL_NAME[callType]]
		},

		// Allows a promise to be called like a
		// Function.call or Function.apply
		//
		// Very usefull for passing a promise as
		// a callback function to 3rd party code
		call: function() {
			var args = _.toArray(arguments);
			args.splice(0, 1); // The context
			this.notify.apply(this, args);
		},
		apply: function(ctx, args) {
			this.notify.apply(this, args);
		},

		toString: function() {
			return '[Storm Promise]';
		}
	};

	return Promise;

}());