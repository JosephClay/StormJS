module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-rename');

	var srcFiles = [
		'src/Intro.js',
		'src/Storm.js',
		'src/Helpers.js',
		'src/Constants.js',
		'src/Mixin.js',
		'src/UniqId.js',
		'src/Extend.js',
		'src/Events.js',
		'src/Promise.js',
		'src/When.js',
		'src/Animate.js',
		'src/Cache.js',
		'src/Request.js',
		'src/DataContext.js',
		'src/AjaxCall.js',
		'src/Model.js',
		'src/Comparator.js',
		'src/Collection.js',
		'src/Template.js',
		'src/View.js',
		'src/Module.js',
		'src/Storage.js',
		'src/Outro.js'
	];

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		banner:
			'/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
			' * Copyright (c) 2012-<%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
			' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
		directories: {
			dist: 'dist/<%= pkg.version %>'
		},
		filenames: {
			full: '<%= pkg.name %>-<%= pkg.version %>.js',
			minified: '<%= pkg.name %>-<%= pkg.version %>.min.js',
			sourcemap: '<%= pkg.name %>-<%= pkg.version %>.min.map'
		},
		clean: {
			files: [ '<%= directories.dist %>', '<%= filenames.full %>', '<%= filenames.minified %>', '<%= filenames.sourcemap %>' ]
		},
		jshint: {
			beforeconcat: [ 'src/**/*.js' ],
			afterconcat: [ '<%= filenames.full %>' ],
			options: {
				'-W093': true, // Disable "Did you mean to return a conditional instead of an assignment?" warning
				ignores: [ 'src/Intro.js', 'src/Outro.js' ]
			}
		},
		concat: {
			options: {
				banner: '<%= banner %>',
				stripBanners: true,
				separator: '\n\n//----\n\n'
			},
			dist: {
				src: srcFiles,
				dest: '<%= filenames.full %>'
			}
		},
		uglify: {
			options: {
				// Grunt-contrib-uglify does not support adding a banner alongside sourcemaps. Add the banner to your unminified source and then uglify.
				// banner: '<%= banner %>',

				sourceMap: '<%= filenames.sourcemap %>'
			},
			dist: {
				src: '<%= filenames.full %>',
				dest: '<%= filenames.minified %>'
			}
		},
		rename: {
			full: {
				src: '<%= filenames.full %>',
				dest: '<%= directories.dist %>/<%= filenames.full %>'
			},
			minified: {
				src: '<%= filenames.minified %>',
				dest: '<%= directories.dist %>/<%= filenames.minified %>'
			},
			sourcemap: {
				src: '<%= filenames.sourcemap %>',
				dest: '<%= directories.dist %>/<%= filenames.sourcemap %>'
			}
		}
	});

	grunt.registerTask('default', ['clean', 'jshint', 'concat', 'uglify', 'rename']);

};