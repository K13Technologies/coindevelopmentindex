module.exports = function(grunt) {

  var date          = grunt.template.today('yyyymmdd'),
      environment   = grunt.option('env') || 'DEVELOPMENT',
      admin         = 'admin',
      dist          = 'coindevelopmentindex',
      assetdir      = './assets/',
      buildPathHTML = 'build/',
      buildPathCSS  = 'build/assets/css/',
      buildPathIMG  = 'build/assets/img/',
      buildPathJSON = 'build/assets/json/',
      buildPathFONT = 'build/assets/fonts/',
      buildPathJS   = 'build/assets/js/',
      buildPathHBS  = 'build/assets/js/templates/';


  ////////////////////////////////////////////
  // INIT
  ////////////////////////////////////////////

  var initObj = {
    environment: environment,
    assetdir: assetdir,
    admin: admin,
    dist: dist,
    buildPathCSS: buildPathCSS,
    buildPathJS: buildPathJS,
    pkg: grunt.file.readJSON('package.json'),

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // WATCH
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    watch: {
      html: {
        files: ['**/*.html'],
        tasks: ['build'],
        options: {
          livereload: true
        }
      },
      css: {
        files: ['<%= assetdir %>css/_**/*.scss'],
        tasks: ['sass', 'cssmin', 'concat', 'clean:tmpdir'],
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
      hbs: {
        files: ['<%= assetdir %>hbs/**/*.hbs'],
        tasks: ['handlebars'],
        options: {
          livereload: true
        }
      },
      json: {
        files: ['<%= assetdir %>json/**/*.json'],
        tasks: ['copy:buildJSON'],
        options: {
          livereload: true
        }
      }
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // SASS
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    sass: {
      dist: {
        options: {
          outputStyle: 'compressed',
          sourceMap: true
        },
        files: [{
          expand: true,
          cwd: '<%= assetdir %>css/_partials/',
          src: ['*.scss'],
          dest: '<%= assetdir %>css/',
          ext: '.min.css',
          // extDot: 'first'
        }]
      }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // CSSMIN
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    cssmin: {
      dist: {
        files: {
          '<%= assetdir %>css/cryptocoins.min.css': [
            '<%= assetdir %>vendor/cryptocoins-master/webfont/cryptocoins.css',
            '<%= assetdir %>vendor/cryptocoins-master/webfont/cryptocoins-colors.css',
          ]
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
          cwd: buildPathHTML,
          src: '**/*.html',
          dest: buildPathHTML,
          ext: '.html'
        }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // HTMLBUILD
    //////////////////////////////////////////////////////////////////////////////////////////
    htmlbuild: {
      dist: {
        src: ['**/*.html', '!node_modules/**', '!build/**', '!assets/**'],
        dest: buildPathHTML,
        options: {
          basePath: true,
          // scripts: {
          //     templates: { '/assets/js/templates/*.js' }
          // },
          sections: {
              head: '<%= assetdir %>templates/layout/head.html',
              layout: {
                header: '<%= assetdir %>templates/layout/header.html',
                footer: '<%= assetdir %>templates/layout/footer.html'
              }
          },
          data: {
              // Data to pass to templates
              environment: environment
          }
        }
      }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // CONCAT
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    concat: {
      css: {
        options: {
          separator: grunt.util.linefeed,
        },
        src: [
            'node_modules/bootstrap-beta/dist/css/bootstrap.min.css',
            'node_modules/font-awesome/css/font-awesome.min.css',
            '<%= assetdir %>css/*.min.css',
          ],
          dest: '<%= buildPathCSS %><%= dist %>.css',
      }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // CLEAN - DELETES FILES
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    clean : {
      builddir: {
        src: ['build/*', '!build/sftp-config.json']
      },
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
          cwd: '<%= assetdir %>vendor/cryptocoins-master/webfont/',
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
          { src: 'sitemaps/**', dest: buildPathHTML }
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
    // IMPORT FOR JS
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    import: {
      js: {
        options: {

        },
        files: [{
          expand: true,
          cwd: '<%= assetdir %>js/',
          src: ['*.js'],
          dest: 'build/tmp/js/',
          ext: '.js'
        }]
      },
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // UGLIFY - MINIFY JS FILES
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    uglify: {
      options: {
        report: 'min',
        maxLineLen: 0,
        preserveComments: /^\/*!/,
        mangle: false,
        compress: {
          unused: false,
          hoist_funs: false,
          sequences: false
        }
      },
      js: {
        files: [{
          src: [
            'node_modules/popper.js/dist/umd/popper.min.js',
            'node_modules/jquery/dist/jquery.min.js',
            'node_modules/underscore/underscore-min.js',
            'node_modules/tether/dist/js/tether.min.js',
            'node_modules/bootstrap-beta/dist/js/bootstrap.min.js',
            'node_modules/handlebars/dist/handlebars.runtime.min.js',
            'node_modules/floatthead/dist/jquery.floatThead.min.js',
            'build/tmp/js/production.js'
          ],
          dest: '<%= buildPathJS %><%= dist %>.js',
        },
        {
          src: [
            'build/tmp/js/admin.js'
          ],
          dest: '<%= buildPathJS %><%= dist %>-<%= admin %>.js',
        }]
      }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // HANDLEBARS - PRECOMPILE TEMPLATES
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    handlebars: {
      options: {
        namespace: 'HBS',
        processName: function(filePath) {
          var arr = filePath.split('/');
            return arr[arr.length - 1].replace(/\.hbs$/, '');
          }
      },
      files: {
        expand: true,
        cwd: '<%= assetdir %>hbs/',
        src: ['**/*.hbs'],
        dest: buildPathHBS,
          rename: function(dest, src) {
            return buildPathHBS + src.replace(/hbs$/, 'js');
        }
      }
    },

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // SFTP-DEPLOY - UPLOAD TO SERVER
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    'sftp-deploy': {
      build: {
        auth: {
          host: 'coindevelopmentindex.tech',
          port: 22,
          authKey: 'coindevelopementindex.tech'
        },
        cache: 'sftpCache.json',
        src: buildPathHTML,
        dest: '/var/www/coindevelopmentindex.com/html/',
        exclusions: [buildPathHTML + '**/.DS_Store', 'sftp-config.json'],
        concurrency: 4,
        progress: true
      },
      api: {
        auth: {
          host: 'coindevelopmentindex.tech',
          port: 22,
          authKey: 'coindevelopementindex.tech'
        },
        cache: 'sftpCache.json',
        src: 'api/',
        dest: '/var/www/coindevelopmentindex.com/html/',
        exclusions: [buildPathHTML + '**/.DS_Store', 'sftp-config.json'],
        concurrency: 4,
        progress: true
      }
    }

  };

  // Project configuration.
  grunt.initConfig(initObj);

  // Load plugins
  grunt.loadNpmTasks('grunt-import');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-html-build');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-sftp-deploy');

  // Default task(s).
  grunt.registerTask('default', ['watch']);
  grunt.registerTask('css', ['sass', 'cssmin', 'concat']);
  grunt.registerTask('js', ['import:js', 'uglify:js']);
  grunt.registerTask('cleanup', ['clean:builddir']);
  grunt.registerTask('upload', ['sftp-deploy']);
  grunt.registerTask('build', ['cleanup', 'css', 'js', 'handlebars', 'htmlbuild', 'htmlmin', 'copy', 'clean:tmpdir', 'imagemin']);

};
