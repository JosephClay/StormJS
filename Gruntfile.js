module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-rename');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-mkdir');
	grunt.loadNpmTasks('grunt-exec');

	var libs = {
		signal: 'src/libs/Signal.js'
	};

	var srcFiles = [
		'src/Intro.js',

		'src/Storm.js',
		'src/Helpers.js',
		'src/Mixin.js',
		'src/Memo.js',
		'src/UniqId.js',
		'src/Extend.js',

		'src/Events.js',
		'src/Promise.js',
		'src/When.js',

		'src/Tick.js',

		'src/Request.js',
		'src/AjaxCall.js',
		'src/DataContext.js',

		'src/Template.js',

		'src/View.js',
		'src/Model.js',
		'src/Comparator.js',
		'src/Collection.js',

		'src/Module.js',

		'src/Cache.js',
		'src/Storage.js',

		'src/Extensions.js',
		'src/NoConflict.js',
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
		mkdir: {
			all: {
				options: {
					create: ['<%= directories.dist %>']
				}
			}
		},
		filenames: {
			full: '<%= pkg.name %>-<%= pkg.version %>.js',
			minified: '<%= pkg.name %>-<%= pkg.version %>.min.js',
			sourcemap: '<%= pkg.name %>-<%= pkg.version %>.min.map',

			rootfull: '<%= pkg.name %>.js',
			rootminified: '<%= pkg.name %>.min.js',
			rootsourcemap: '<%= pkg.name %>.min.map',

			withsignal: '<%= pkg.name %>-signal.js',
			withsignalminified: '<%= pkg.name %>-signal.min.js'
		},
		clean: {
			files: [
				'<%= directories.dist %>/*',

				'<%= filenames.full %>',
				'<%= filenames.minified %>',
				'<%= filenames.sourcemap %>',
				
				'<%= filenames.rootfull %>',
				'<%= filenames.rootminified %>',
				'<%= filenames.rootsourcemap %>',
				
				'<%= filenames.withsignal %>',
				'<%= filenames.withsignalminified %>'
			]
		},
		jshint: {
			before: [ 'src/**/*.js' ],
			after: [ '<%= filenames.full %>' ],
			options: {
				'-W093': true, // Disable "Did you mean to return a conditional instead of an assignment?" warning
				ignores: [ 'src/Intro.js', 'src/Outro.js' ]
			}
		},
		concat: {
			options: {
				banner: '<%= banner %>',
				stripBanners: true,
				separator: '\n\n//----\n\n',
			},
			dist: {
				files: {
					'<%= filenames.full %>': srcFiles,
					'<%= filenames.rootfull %>': srcFiles,
					'<%= filenames.withsignal %>': [libs.signal].concat(srcFiles)
				},
				nonull: true
			}
		},
		uglify: {
			basic: {
				options: {
					sourceMap: '<%= filenames.sourcemap %>'
				},
				files: {
					'<%= filenames.minified %>': '<%= filenames.full %>'
				}
			},
			root: {
				options: {
					sourceMap: '<%= filenames.rootsourcemap %>'
				},
				files: {
					'<%= filenames.rootminified %>': '<%= filenames.rootfull %>',
					'<%= filenames.withsignalminified %>': '<%= filenames.withsignal %>'
				}
			}
		},
		compress: {
			basic: {
				options: {
					mode: 'gzip'
				},
				expand: true,
				src: ['<%= filenames.rootminified %>' ],
				dest: '<%= directories.dist %>',
				ext: '.gz.js'
			},
			pkged: {
				options: {
					mode: 'gzip'
				},
				expand: true,
				src: ['<%= filenames.withsignalminified %>' ],
				dest: '<%= directories.dist %>',
				ext: '.gz.js'
			}
		},
		rename: {
			basic: {
				files: [
					{
						// full
						src: '<%= filenames.full %>',
						dest: '<%= directories.dist %>/<%= filenames.full %>'
					},
					{
						// minified
						src: '<%= filenames.minified %>',
						dest: '<%= directories.dist %>/<%= filenames.minified %>'
					},
					{
						// sourcemap
						src: '<%= filenames.sourcemap %>',
						dest: '<%= directories.dist %>/<%= filenames.sourcemap %>'
					}
				]
			}
		},
		exec: {
			doc: {
				command: 'jsdoc -c jsdoc.conf.json'
			}
		},
		copy: {
			doc: {
				files: [
					{
						expand: true,
						src: [
							'<%= filenames.rootfull %>',
							'<%= filenames.rootminified %>',
							'<%= filenames.withsignal %>',
							'<%= filenames.withsignalminified %>'
						],
						dest: 'doc/scripts',
						filter: 'isFile'
					}
				]
			}
		}
	});

	grunt.registerTask('default', [
		'mkdir',
		'clean',

		'jshint:before',
		'concat',
		'jshint:after',

		'uglify:basic',
		'uglify:root',
		'compress:basic',
		'compress:pkged',

		'rename:basic'
	]);

	grunt.registerTask('doc', function() {
		var pkg = grunt.file.readJSON('package.json'),
			config = {
				source: {
					include: [
						"StormJS.js"
					]
				},
				opts: {
					pkg: {
						name: pkg.name,
						title: pkg.title,
						version: pkg.version,
						repo: pkg.repository.url
					},
					encoding: "utf8",
					template: "templates/default",
					destination: "doc"
				},
				tags: {
					allowUnknownTags: true
				}
			};

		grunt.file.write('jsdoc.conf.json', JSON.stringify(config));

		grunt.task.run(['exec:doc', 'copy:doc']);
	});

};
