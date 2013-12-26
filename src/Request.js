//###################################################################################
// Request ##########################################################################
//###################################################################################

var Request = Storm.request = (function() {

	var _categories = {},
		_totalQueued = 0;

	var Request = function() {
		Events.core.call(this);
		
		// Abort is a special little case
		// cause it's called from the outside
		// on a call
		var self = this;
		this.on('abort', function(e, req, status, err, call) {
			self.erase(call);
		});
	};

	_extend(Request.prototype, Events.core.prototype, {
		constructor: Request,

		record: function(call) {
			var config = call.getConfiguration(),
				category = _categories[config.category] || (_categories[config.category] = {});
			
			// this call is already being tracked
			if (category[call.getId()]) { return this; }

			category[call.getId()] = call;
			_totalQueued++;
			
			this.trigger('record', call);

			return this;
		},

		erase: function(call) {
			var cat = call.getConfiguration().category,
				id = call.getId();

			if (_categories[cat] && _categories[cat][id]) {
				delete _categories[cat][id];
				_totalQueued--;
				
				this.trigger('erase', call);
			}
			

			return this;
		},

		getTotalQueued: function() {
			return _totalQueued;
		},

		/* Add ****************************************/
		addCategories: function(name) {
			if (_.isString(name)) {
				this.addCategory(name);
				return this;
			}

			var categories = name;
			_.each(categories, function(cat) {
				this.addCategory(name);
			});

			return this;
		},

		addCategory: function(name) {
			if (STORM.category[name] !== undefined) {
				return console.error(STORM.name +': Cannot add category, "'+ name + '" already exists: ', STORM.category[name]);
			}

			// _.size() on Storm.category ensures a unique
			// value for this category (in case we need
			// to reverse-look-up)
			STORM.category[name] = _.size(STORM.category);
			
			return this;
		},

		getCategories: function() {
			return _categories;
		},

		getCategory: function(cat) {
			return _categories[cat];

		},

		toString: function() {
			return '[Storm Request]';
		}
	});

	return new Request();

}());