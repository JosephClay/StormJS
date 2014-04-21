var _ = require('underscore'),
	_outdir = env.opts.destination,
	_utils = require('./utils'),

	fs = require('jsdoc/fs'),
	path = require('jsdoc/path');

module.exports = {
	buildFilePaths: function(data, files) {
		// build a list of source files
		var filePaths = [];
		data().each(function(doclet) {
			if (!doclet.meta) { return; }

			var pth = _utils.getPathFromDoclet(doclet);
			files[pth] = {
				resolved: pth,
				shortened: null
			};

			if (filePaths.indexOf(pth) === -1) {
				filePaths.push(pth);
			}
		});

		return filePaths;
	},

	createDir: function(packages) {
		// update _outdir if necessary, then create _outdir
		var packageInfo = (packages || [])[0];
		if (packageInfo && packageInfo.name) {
			_outdir = path.join(_outdir, packageInfo.name, packageInfo.version);
		}
		fs.mkPath(_outdir);
	},

	templateStaticFiles: function(files, dir) {
		// copy the template's static files to _outdir
		files.forEach(function(fileName) {
			var toDir = fs.toDir(fileName.replace(dir, _outdir));
			fs.mkPath(toDir);
			fs.copyFileSync(fileName, toDir);
		});
	},

	userStaticFiles: function(files) {
		if (!files) { return; }

		// copy user-specified static files to _outdir
		var staticFilePaths = files.paths || [],
			staticFileFilter = new (require('jsdoc/src/filter')).Filter(files),
			staticFileScanner = new (require('jsdoc/src/scanner')).Scanner();

		_.each(staticFilePaths, function(filePath) {
			var extraStaticFiles = staticFileScanner.scan([filePath], 10, staticFileFilter);

			extraStaticFiles.forEach(function(fileName) {
				var sourcePath = fs.toDir(filePath);
				var toDir = fs.toDir( fileName.replace(sourcePath, _outdir) );
				fs.mkPath(toDir);
				fs.copyFileSync(fileName, toDir);
			});
		});
	},

	saveFile: function(html, fileName) {
		var outpath = path.join(_outdir, fileName);
		fs.writeFileSync(outpath, html, 'utf8');
	}
};