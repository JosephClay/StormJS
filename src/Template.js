//###################################################################################
// Tempalate ########################################################################
//###################################################################################

Storm.template = (function() {
	
	var _templates = {},
		_compiledTemplates = {},
		_engine;

	/* Register *****************************************************/
	var _register = function(name, tpl) {
		// If an object, multiple items are being registered.
		if (!_.isString(name)) {
			var key, obj = name;
			for (key in obj) {
				_register(key, obj[key]);
			}
			return this;
		}

		// Not an object, must be a string. If it's an
		// id string, go get the html for the template
		if (name[0] === '#') {
			var element = document.getElementById(name.substring(1, name.length));
			if (!element) { return console.error(STORM.name +': Cannot find reference to "'+ name +'" in DOM'); }
			tpl = element.innerHTML;
		}

		_templates[name] = _coerceTemplateToString(tpl);
		return this;
	};

	var _coerceTemplateToString = function(tpl) {
		if (_.isFunction(tpl)) { tpl = tpl.call(); }
		if (_.isString(tpl)) { return tpl.trim(); }
		if (_.isArray(tpl)) { return tpl.join('\n').trim(); }
		console.error(STORM.name +': Template (or the return value) was of unknown type');
	};

	/* Retrieve | Remove *****************************************************/
	var _retrieve = function(name) {
		// If there's a compiled template, return that one
		var compTpl = _compiledTemplates[name];
		if (compTpl) { return compTpl; }

		if (!_engine) { console.error(STORM.name +': No template engine has been registered');
		return (_compiledTemplates[name] = _engine.compile(_templates[name]));
	};

	var _remove = function(name) {
		delete _templates[name];
		delete _compiledTemplates[name];
	};

	/* Render **************************************************/
	var _render = function(name, data) {
		var tpl = _retrieve(name);
		return tpl(data || {});
	};

	return {
		add: _register,
		remove: _remove,
		render: _render,
		setEngine: function(engine) {
			_engine = engine;
		},
		toJSON: function(key) {
			var value = (key) ? _templates[key] : _templates;
			return value;
		},
		toString: function(key) {
			var value = (key) ? _templates[key] : _templates;
			return JSON.stringify(value);
		}
	};
}());