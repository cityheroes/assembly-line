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

		preprocess: {
      umd: {
        src: 'src/build/umd.js',
        dest: '.tmp/<%= files.mainFileName %>.js'
      },
    },

		concat: {
			options: {
				banner: '<%= meta.banner %>'
			},
			main: {
				src: '<%= preprocess.umd.dest %>',
				dest: '<%= files.dest %>'
			}
		},

		uglify: {
			main: {
				src: '<%= files.dest %>',
				dest: '<%= files.destDir %>/<%= files.mainFileName %>.min.js',
				options: {
					banner: '<%= meta.banner %>',
					sourceMap: '<%= files.destDir %>/<%= files.mainFileName %>.min.map',
					sourceMappingURL: '<%= files.mainFileName %>.min.map'
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
			// 'indent:scripts',
			// 'umd:all',
			'preprocess:umd',
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