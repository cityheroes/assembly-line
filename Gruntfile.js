//
// Mauro Trigo - CityHeroes
//

module.exports = function (grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		devConfig: {
			connectPort: 9044,
			livereload: 35744
		},

		files: {
			mainFileName: 'assembly-line',
			srcDir: './src',
			destDir: './dist',
			demoDir: './demo',
			src: '<%= files.srcDir %>/<%= files.mainFileName %>.js',
			dest: '<%= files.destDir %>/<%= files.mainFileName %>.js'
		},

		// Build tasks

		meta: {
			version: '<%= pkg.version %>',
			banner:
				'// <%= pkg.name %>\n' +
				'// ----------------------------------\n' +
				'// v<%= pkg.version %>\n' +
				'//\n' +
				'// Copyright (c)<%= grunt.template.today("yyyy") %> <%= pkg.author.name %>, <%= pkg.author.organization %>.\n' +
				'// Distributed under <%= pkg.license %> license\n' +
				'\n',
		},

		clean: {
			all: [
				'<%= files.dest %>',
				'<%= files.demoDir %>/js/<%= files.mainFileName %>.js',
			]
		},

		indent: {
			scripts: {
				src: [
					'<%= files.srcDir %>/*.js'
				],
				dest: '<%= files.destDir %>/',
				options: {
					style: 'tab',
					change: 1
				}
			}
		},

		umd: {
			all: {
				options: {
					src: '<%= files.dest %>',
					dest: '<%= files.dest %>', // optional, if missing the src will be used
					objectToExport: 'AssemblyLine', // optional, internal object that will be exported
					amdModuleId: 'assembly-line', // optional, if missing the AMD module will be anonymous
					// globalAlias: 'Assembly', // optional, changes the name of the global variable
					template: './build_extras/umd.hbs',
					deps: { // optional, `default` is used as a fallback for rest!
						args : ['_'],
						separator: ', ',
						'default': ['_', 'moment'],
						amd: ['_', 'moment'],
						cjs: ['_', 'moment'],
						global: ['_', 'moment']
					}
				}
			}
		},

		concat: {
			options: {
				banner: '<%= meta.banner %>'
			},
			main: {
				src: '<%= files.dest %>',
				dest: '<%= files.dest %>'
			}
		},

		uglify: {
			main: {
				src: '<%= files.dest %>',
				dest: '<%= files.destDir %>/<%= files.mainFileName %>.min.js',
				options: {
					banner: '<%= meta.banner %>',
					sourceMap: '<%= files.destDir %>/<%= files.mainFileName %>.min.map'
				}
			}
		},

		copy: {
			build: {
				files: [{
					expand: true,
					flatten: true,
					dest: '<%= files.demoDir %>/js/',
					src: [
						'<%= files.dest %>'
					]
				}]
			}
		},

		// Dev tasks

		watch: {
			js: {
				files: ['<%= files.demoDir %>/js/{,*/}*.js'],
				options: {
					livereload: '<%= devConfig.livereload %>'
				}
			},
			css: {
				files: ['<%= files.demoDir %>/css/{,*/}*.css'],
				options: {
					livereload: '<%= devConfig.livereload %>'
				}
			},
			livereload: {
				options: {
					livereload: '<%= devConfig.livereload %>'
				},
				files: [
					'<%= files.demoDir %>/{,*/}*.html'
				]
			}
		},

		connect: {
			demo: {
				options: {
					livereload: '<%= devConfig.livereload %>',
					port: '<%= devConfig.connectPort %>',
					hostname: 'localhost',
					base: [
						'<%= files.demoDir %>'
					],
					open: true
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-indent');
	grunt.loadNpmTasks('grunt-umd');

	grunt.registerTask('build', function (target) {

		grunt.task.run([
			'clean:all',
			'indent:scripts',
			'umd:all',
			'concat',
			'uglify',
			'copy:build'
		]);
	});

	grunt.registerTask('serve', function (target) {

		grunt.task.run([
			'connect:demo',
			'watch'
		]);
	});

};