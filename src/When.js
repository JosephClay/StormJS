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
