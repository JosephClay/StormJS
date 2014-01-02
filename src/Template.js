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