module.exports = function(grunt) {

  var date = grunt.template.today('yyyymmdd');
  var dist = "coindevelopmentindex";
  var assetdir = "./assets/";
  var buildPathHTML  = "build/";
  var buildPathCSS  = "build/assets/css/";
  var buildPathIMG  = "build/assets/img/";
  var buildPathJSON = "build/assets/json/";
  var buildPathFONT = "build/assets/fonts/";
  var buildPathJS = "build/assets/js/";

  ////////////////////////////////////////////
  // INIT
  ////////////////////////////////////////////

  var initObj = {
    assetdir: assetdir,
    pkg: grunt.file.readJSON('package.json'),

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // WATCH
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    watch: {
      html: {
        files: ['*.html'],
        tasks: ['build'],
        options: {
          livereload: true
        }
      },
      css: {
        files: ['<%= assetdir %>css/_*/*.scss'],
        tasks: ['sass', 'cssmin', 'concat', 'clean'],
        options: {
          livereload: true
        }
      },
      js: {
        files: ['<%= assetdir %>js/**/*.js'],
        tasks: ['import:js','uglify:js'],
        options: {
          livereload: true
        }
      },
      json: {
        files: ['<%= assetdir %>json/**/*.json'],
        tasks: ['copy:buildJSON']
      }
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // SASS
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    sass: {
      dist: {
        options: {
          outputStyle: 'compressed',
          sourceMap: false
        },
        files: [{
          expand: true,
          cwd: assetdir+'css/_partials/',
          src: ['*.scss'],
          dest: assetdir+'css/',
          ext: '.css',
          extDot: 'first'
        }]
      }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // CSSMIN
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    cssmin: {
      dist: {
        files: {
          'assets/css/cryptocoins.min.css': [
            assetdir+'vendor/cryptocoins-master/webfont/cryptocoins.css',
            assetdir+'vendor/cryptocoins-master/webfont/cryptocoins-colors.css',
          ],
          'assets/css/footer-distributed.min.css': assetdir+'css/footer-distributed.css',
          'assets/css/jumbotron.min.css': assetdir+'css/jumbotron.css'
        }
      }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // HTMLMIN
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    htmlmin: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          expand: true,
          cwd: './',
          src: ['*.html'],
          dest: buildPathHTML,
          ext: '.html'
        }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // CONCAT
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    concat: {
      css: {
        src: [
            'node_modules/bootstrap-v4-dev/dist/css/bootstrap.min.css',
            'node_modules/font-awesome/css/font-awesome.min.css',
            assetdir+'css/*.min.css',
          ],
          dest: buildPathCSS+dist+'.css',
      }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // IMPORT FOR JS
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    import: {
      js: {
        options: {
          footer: 'var endofline="%file_name%";' // added onto js files to insure commented code at the end of the files isn't dropped
        },
        files: [{
          expand: true,
          cwd: assetdir+'js/_source/',
          src: ['*.js'],
          dest: assetdir+'js/',
          ext: '.js'
        }]
      },
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // CLEAN - DELETES FILES
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    clean : {
      tmpdir: {
        src: ['build/**/tmp/']
      }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // COPY FILES
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    copy: {
      buildFonts: {
        files: [{
          expand: true,
          cwd: assetdir+'vendor/cryptocoins-master/webfont/',
          src: [ '*.woff', '*.woff2', '*.ttf'],
          dest: buildPathFONT
        },
        {
          expand: true,
          cwd: 'node_modules/font-awesome/fonts',
          src: [ '*.woff', '*.woff2', '*.ttf'],
          dest: buildPathFONT
        }]
      },
      buildJSON: {
        files: [{
          expand: true,
          cwd: '<%= assetdir %>json/',
          src: ['*.json'],
          dest: buildPathJSON,
            rename: function(dest, src) {
                return buildPathJSON + src;
          }
        }],
      },
      misc: {
        files: [
          { src:'BingSiteAuth.xml', dest:'build/BingSiteAuth.xml' },
          { src:'sitemap.xml', dest:'build/sitemap.xml' },
          { src:'favicon.ico', dest:'build/favicon.ico' },
        ]
      }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // IMAGE MIN
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    imagemin: {
        options: {
            optimizationLevel: 3,
            svgoPlugins: [{removeViewBox: false}]
        },
        files: {
            expand: true,
            cwd: '<%= assetdir %>img/',
            src: ['**/*.{png,jpg,gif,svg}'],
            dest: buildPathIMG,
              rename: function(dest, src) {
                return buildPathIMG + src;
            }
        }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // UGLIFY - MINIFY JS FILES
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    uglify: {
      options: {
        report: 'min',
            maxLineLen: 0,
        preserveComments: /^\/*!/,
        compress: {
          unused: false,
          hoist_funs: false,
          sequences: false
        }
      },
      js: {
        files: [{
          src: [
            'node_modules/jquery/dist/jquery.min.js',
            'node_modules/underscore/underscore-min.js',
            'node_modules/tether/dist/js/tether.min.js',
            'node_modules/bootstrap-v4-dev/dist/js/bootstrap.min.js',
            assetdir+'vendor/gh3-master/gh3.min.js',
            assetdir+'js/**/*.js',
          ],
          dest: buildPathJS+dist+'.js',
        }]
      }
    }
  };

  // Project configuration.
  grunt.initConfig(initObj);

  // Load plugins
  grunt.loadNpmTasks('grunt-import');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['watch']);
  grunt.registerTask('css', ['sass', 'cssmin', 'concat']);
  grunt.registerTask('js', ['import:js', 'uglify:js']);
  grunt.registerTask('build', ['css', 'js', 'htmlmin', 'copy', 'clean', 'imagemin']);

};