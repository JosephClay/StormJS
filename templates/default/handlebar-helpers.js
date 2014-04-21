var handlebars = require('handlebars'),
	_helper = require('jsdoc/util/templateHelper'),
	_typer = require('./typer'),
	
	fs = require('jsdoc/fs'),

	_links = [],
	_data;

var _compile = function(p) {
	var file = fs.readFileSync(p, { encoding: 'utf8' });
	return handlebars.compile(file.toString());
};

var __helpers = {
	if_any: function() {
		var args = [].slice.call(arguments),
			options = args.pop(),
			allow = false;

		var idx = args.length;
		while (idx--) {
			if (args[idx]) {
				allow = true;
				break;
			}
		}

		return allow ? options.fn(this) : options.inverse(this);
	},

	if_is_code: function(thing, options) {
		return (thing === 'object' || thing === 'array') ? options.fn(this) : options.inverse(this);
	},

	if_size: function(arr, options) {
		return (arr && Array.isArray(arr) && arr.length) ? options.fn(this) : options.inverse(this);
	},

	if_linkable: function(item, options) {
		item = item || '';
		var shouldLink = (item === '' || _links.indexOf(item) === -1) ? false : true;
		return shouldLink ? options.fn(this) : options.inverse(this);
	},

	find: function(spec) {
		return _helper.find(_data, spec);
	},

	linkTo: function(linker, options) {
		var data = (linker || '').replace(/[{}]+/g, '').split(' '),
			url = data[1],
			name = data[2] || url;
		return options.fn({
			url: url,
			name: name
		});
	},

	withNormalType: function(type, options) {
		var normalizedType = _typer.normalize(type);
		return options.fn({
			type: normalizedType || type,
			mdn: normalizedType ? _typer.mdnUrl(normalizedType) : null
		});
	},

	lineUrl: function(meta) {
		meta = meta || {};
		return (meta.filename || '') + '.html#line' + (meta.lineno || 0);
	},

	if_equal: function(a, b, options) {
		return (a === b) ? options.fn(this) : options.inverse(this);
	},

	if_not_equal: function(a, b, options) {
		return (a !== b) ? options.fn(this) : options.inverse(this);
	},

	join: function(arr, delimiter) {
		if (!Array.isArray(arr)) { return ''; }
		return arr.join(delimiter || '');
	},

	foreach: function(arr, options) {
		if (!arr || !arr.length) { return options.inverse(this); }

		return arr.map(function(item, idx) {
			item.$index = idx;
			item.$first = idx === 0;
			item.$last  = idx === (arr.length - 1);
			return options.fn(item);
		}).join('');
	},

	eachValue: function(arr, options) {
		if (!arr || !arr.length) { return options.inverse(this); }

		return arr.map(function(val, idx) {
			return options.fn({
				val:    val,
				$index: idx,
				$first: idx === 0,
				$last:  idx === (arr.length - 1)
			});
		}).join('');
	},

	toJSON: function(thing) {
		if (thing === undefined) { return ''; }
		return JSON.stringify(thing);
	}
};

module.exports = {
	compile: _compile,

	setData: function(data) {
		_data = data;
	},

	registerHelpers: function(handlebars) {
		var key;
		for (key in __helpers) {
			handlebars.registerHelper(key, __helpers[key]);
		}
	},

	registerLinks: function(links) {
		links = links || [];
		links = links.filter(function(link) {
			return (link !== null && link !== undefined && link !== '');
		});
		_links = links;
	},

	setPartials: function(handlebars, partials) {
		var key;
		for (key in partials) {
			handlebars.registerPartial(key, _compile(partials[key]));
		}

	},

	ifLinkable: function(item) {
		item = item || '';
		var shouldLink = (item === '' || _links.indexOf(item) === -1) ? false : true;
		return shouldLink;
	},

	linkTo: function(linker) {
		var data = (linker || '').replace(/[{}]+/g, '').split(' '),
			url = data[1],
			name = data[2] || url;
		return {
			url: url,
			name: name
		};
	}
};