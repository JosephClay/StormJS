var helper = require('jsdoc/util/templateHelper'),
	path = require('jsdoc/path');

module.exports = {
	// turn {@link foo} into <a href="foodoc.html">foo</a>
	// takes an html string
	resolveLinks: helper.resolveLinks,

	hasHash: function(str) {
		return str.indexOf('#') > -1;
	},

	hashToLink: function(doclet, hash) {
		if (!/^(#.+)/.test(hash)) { return hash; }

		var url = helper.createLink(doclet);
		url = url.replace(/(#.+|$)/, hash);

		return '<a href="' + url + '">' + hash + '</a>';
	},

	shortenFilePaths: function(files, commonPrefix) {
		Object.keys(files).forEach(function(file) {
			files[file].shortened = files[file].resolved
											.replace(commonPrefix, '')
											// always use forward slashes
											.replace(/\\/g, '/');
		});

		return files;
	},

	getPathFromDoclet: function(doclet) {
		if (!doclet.meta) { return; }

		return doclet.meta.path && doclet.meta.path !== 'null' ?
			path.join(doclet.meta.path, doclet.meta.filename) :
			doclet.meta.filename;
	},

	needsSignature: function(doclet) {
		// function and class definitions always get a signature
		if (doclet.kind === 'function' || doclet.kind === 'class') {
		
			return true;
		
		// typedefs that contain functions get a signature, too
		} else if (doclet.kind === 'typedef' && doclet.type && doclet.type.names && doclet.type.names.length) {
			var idx = doclet.type.names.length;
			while (idx--) {
				if (doclet.type.names[idx].toLowerCase() === 'function') {
					return true;
				}
			}
		}

		return false;
	},

	strFormat: function(str, obj) {
		str = str || '';

		var key;
		for (key in obj) {
			str = str.replace('{' + key + '}', obj[key]);
		}

		return str;
	}
};