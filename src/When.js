//###################################################################################
// When #############################################################################
//###################################################################################

var When = Storm.when = (function(Promise) {

	var When = function() {
		this._p = null; // So we'll store the promise here
		this._events = [];
	};

	When.prototype = {
		constructor: When,

		init: function() {
			this._events = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments);
			this._subscribe();

			var promise = new Promise();
			promise.then = function() { this.done.apply(this, arguments); };
			this._p = promise;
			return promise; // Return the promise so that it can be subscibed to
		},

		_subscribe: function() {
			var check = this._checkStatus.bind(this),
				fireProgress = this._fireProgress.bind(this),
				events = this._events,
				idx = events.length;
			while (idx--) {
				events[idx].done(check).fail(check).progress(fireProgress);
			}
		},

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

		_fire: function(total, done, failed, args) {
			var promise = this._p; // Our promise

			// If everything completed, call done (this will call always)
			if (done === total) { return promise.resolve.apply(promise, args); }
			// If everything failed, call fail (this will call always)
			if (failed === total) { return promise.reject.apply(promise, args); }
			// If everything fired, but they're not all one thing, then just call always
			if ((done + failed) === total) { return promise._fire(Promise.CALL.always, args); }
		},

		// Handled separately from fire because we want to trigger
		// anytime any of the promises progress regardless of sate
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