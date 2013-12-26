//###################################################################################
// Data Context #####################################################################
//###################################################################################

var DataContext = Storm.DataContext = (function(AjaxCall) {

	var DataContext = function() {
		this._id = _uniqueId('DataContext');
	};

	/* Setup (global) ************************************************/
	DataContext.globalCallTemplate = {};

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

	DataContext.setup = function(settings) {
		_.extend(DataContext.setting, settings);
	};
	DataContext.getSetting = function(settingName) {
		return DataContext.settings[settingName];
	};
	DataContext.removeSetting = function(settingName) {
		if (DataContext.settings[settingName]) {
			delete DataContext.settings[settingName];
			return true;
		}
		return false;
	};

	DataContext.prototype = {
		constructor: DataContext,
		
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

		/* Settings ************************************************/
		getSetting: function() { 
			return DataContext.getSetting.apply(arguments);
		},
		removeSetting: function() { 
			return DataContext.removeSetting.apply(arguments);
		},

		/* Extend Options ************************************************/
		/**
		 * Add more options to this data context
		 * @param  {Object} options
		 * @return {this}
		 */
		extendOptions: function(options) {
			this.options = _.extend({}, this.defaults, options);
			return this;
		},

		/**
		 * Remove an option from this data context
		 * @param  {String} key
		 * @return {this}
		 */
		removeOption: function(key) {
			delete this.options[key];
			return this;
		},

		/* Create Call ************************************************/
		/**
		 * Creates and returns a new AjaxCall
		 * @param  {Object}      callData   A base call object
		 * @param  {Object}      extensionData  Addition configurations for the url
		 * @return {AjaxCall}
		 */
		createCall: function(callData, extensionData) {
			return new AjaxCall(callData, extensionData, this.options);
		},

		toString: function() {
			return '[Storm DataContext]';
		}
	};

	return DataContext;

}(AjaxCall));