var _helper = require('jsdoc/util/templateHelper'),
	_utils = require('./utils'),
	_hbs = require('./handlebar-helpers'),

	_data,
	_examples,

	_links = [];

var _registerLink = function(name) {
	_links.push(name);
};

var _externalLink = '<a href="{url}" target="_blank">{name}</a>';
var _internalLink = '<a href="#{url}">{name}</a>';
var _formatLinks = function(str) {
	return (str || '').replace(/\{\@link([^}]*)\}/g, function(match) {
		match = (match || '').trim();

		var linkTo = _hbs.linkTo(match),
			isLinkable = _hbs.ifLinkable(linkTo.url),
			link = (isLinkable) ? _internalLink : _externalLink;

		return _utils.strFormat(link, {
			url: linkTo.url,
			name: linkTo.name
		});
	});
};

var _codeBlock = '<code class="code">{code}</code>';
var _formatCode = function(str) {
	return (str || '').replace(/`([^`]*)`/g, function(match, capture) {
		capture = (capture || '');

		return _utils.strFormat(_codeBlock, {
			code: capture
		});
	});
};

var _formatExamples = function(examples) {
	if (!examples) { return []; }

	examples.forEach(function(example) {
		example.code = _examples[example.code] || example.code || '';
	});

	return examples;
};

var _formatParams = function(item) {
	var params = item.params;
	if (!params || !params.length) { return; }

	// sort subparams under their parent params (like opts.classname) 
	var parentParam = null;
	params.forEach(function(param, idx) {
		if (!param) { return; }

		if (parentParam && param.name && param.name.indexOf(parentParam.name + '.') === 0) {
			param.name = param.name.substr(parentParam.name.length + 1);
			parentParam.subparams = parentParam.subparams || [];
			parentParam.subparams.push(param);
			params[idx] = null;
		} else {
			parentParam = param;
		}
	});

	return this;
};

module.exports = {
	setData: function(data) {
		_data = data;
		return this;
	},

	setExamples: function(examples) {
		_examples = examples;
		return this;
	},

	registerLink: _registerLink,
	getLinks: function() {
		return _links;
	},

	removeAttribs: function() {
		// attrib data isn't used YAGNI
		_data().each(function(doclet) {
			delete doclet.attribs;
		});
		return this;
	},
	removeComments: function() {
		// comment data isn't used YAGNI
		_data().each(function(doclet) {
			delete doclet.comment;
		});
		return this;
	},

	formatParams: _formatParams,

	formatExamples: function() {
		_data().each(function(doclet) {
			if (!doclet.examples) { return; }

			doclet.examples = doclet.examples.map(function(example) {
				var caption, code;

				if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
					caption = RegExp.$1;
					code    = RegExp.$3;
				}

				return {
					caption: caption || '',
					code: code || example
				};
			});
		});
		return this;
	},

	formatSees: function() {
		_data().each(function(doclet) {
			if (!doclet.see) { return; }

			doclet.see.forEach(function(see, idx) {
				doclet.see[idx] = _utils.hashToLink(doclet, see);
			});
		});
		return this;
	},

	addSignatureReturns: function(doclet) {
		var returnTypes = [];
		if (!doclet.returns) { return []; }

		doclet.returns.forEach(function(ret) {
			if (ret && ret.type && ret.type.names) {
				if (!returnTypes.length) {
					returnTypes = ret.type.names;
				}
			}
		});

		return returnTypes;
	},

	addMethods: function(item) {
		var methods = _helper.find(_data, { kind: 'function', memberof: item.longname }) || [];

		// meta data isn't used YAGNI
		methods.forEach(function(method) { delete method.meta; });
		// format the params for each method
		methods.forEach(_formatParams);
		// format the links and code in the descriptions
		methods.forEach(function(method) { method.description = _formatLinks(method.description); });
		methods.forEach(function(method) { method.description = _formatCode(method.description); });
		// format the examples
		methods.forEach(function(method) { method.examples = _formatExamples(method.examples); });

		item.methods = methods;

		return this;
	},

	addClasses: function(item) {
		if (item.kind === 'globalobj') { return []; }

		var classes = _helper.find(_data, { kind: 'class', memberof: item.longname }) || [];
		
		// format the links and code in the descriptions
		classes.forEach(function(cls) { cls.description = _formatLinks(cls.description); });
		classes.forEach(function(cls) { cls.description = _formatCode(cls.description); });
		// format the examples
		classes.forEach(function(cls) { cls.examples = _formatExamples(cls.examples); });

		item.classes = classes;

		return this;
	},

	addNamespaces: function(item) {
		if (item.kind === 'globalobj') { return []; }

		var namespaces = _helper.find(_data, { kind: 'namespace', memberof: item.longname }) || [];
		
		// format the links and code in the descriptions
		namespaces.forEach(function(ns) { ns.description = _formatLinks(ns.description); });
		namespaces.forEach(function(ns) { ns.description = _formatCode(ns.description); });
		// format the examples
		namespaces.forEach(function(ns) { ns.examples = _formatExamples(ns.examples); });

		item.namespaces = namespaces;

		return this;
	},

	addMembers: function(item) {
		var members = _helper.find(_data, { kind: 'member', memberof: item.longname }) || [];
		
		item.members = members;
		
		return this;
	},

	addEvents: function(item) {
		var events = _helper.find(_data, { kind: 'event', memberof: item.longname }) || [];

		item.events = events;

		return this;
	},

	getAncestors: function(doclet) {
		var ancestors = [],
			doc = doclet.memberof;

		while (doc) {
			doc = _helper.find(_data, { longname: doc });
			if (doc) { doc = doc[0]; }
			if (!doc) { break; }

			ancestors.unshift(doc);
			doc = doc.memberof;
		}

		// hand-pink what is needed
		ancestors = ancestors.map(function(ancestor) {
			return {
				name: ancestor.name,
				longname: ancestor.longname,
				// add punctuation
				scopePunc: _helper.scopeToPunc[doclet.scope] || ''
			};
		});

		return ancestors;
	},

	getSignatureParams: function(doclet) {
		var paramNames = [];
		if (!doclet.params) { return paramNames; }

		doclet.params.forEach(function(param) {
			if (!param.name || param.name.indexOf('.') !== -1) { return; }
			paramNames.push(param);
		});

		return paramNames;
	}
};