'use strict'

if ( typeof window === 'undefined' )
    global.requirejs = require( 'requirejs' )


requirejs.config( {
    baseUrl: function(){ return ( typeof define === 'undefined') ? __dirname + '/../app': '../app'}(),
    shim: {
        mocha: {
            exports: 'mocha'
        }
    },
    paths: {
        SeedView: '.',
        test: '../test',
        engineDetector: 'bower_components/engineDetector/app',
        utils: 'bower_components/mangrove-utils/app',
        'Array.nocomplex': 'bower_components/Array.nocomplex/app',
        SeedHq: 'bower_components/SeedHq/app',
        'String.nocomplex': 'bower_components/String.nocomplex/app',
        almond: 'bower_components/almond/almond',
        chai: 'bower_components/chai/chai',
        'chai-as-promised': 'bower_components/chai-as-promised/lib/chai-as-promised',
        'mangrove-utils': 'bower_components/mangrove-utils/app',
        mocha: 'bower_components/mocha/mocha',
        'normalize-css': 'bower_components/normalize-css/normalize.css',
        requirejs: 'bower_components/requirejs/require',
        async: 'bower_components/requirejs-plugins/src/async',
        depend: 'bower_components/requirejs-plugins/src/depend',
        font: 'bower_components/requirejs-plugins/src/font',
        goog: 'bower_components/requirejs-plugins/src/goog',
        image: 'bower_components/requirejs-plugins/src/image',
        json: 'bower_components/requirejs-plugins/src/json',
        mdown: 'bower_components/requirejs-plugins/src/mdown',
        noext: 'bower_components/requirejs-plugins/src/noext',
        propertyParser: 'bower_components/requirejs-plugins/src/propertyParser',
        'Markdown.Converter': 'bower_components/requirejs-plugins/lib/Markdown.Converter',
        text: 'bower_components/requirejs-plugins/lib/text',
        'sinon-chai': 'bower_components/sinon-chai/lib/sinon-chai',
        sinonjs: 'bower_components/sinonjs/sinon',
        'underscore.string': 'bower_components/underscore.string/lib/underscore.string',
        ifEngineIsNode: 'bower_components/engineDetector/app/ifEngineIsNode',
        ifEngineIsBrowser: 'bower_components/engineDetector/app/ifEngineIsBrowser',
        toDOM: 'bower_components/toDOM/app'
    }
} )

requirejs( [ 'test/TestRunner' ], function( TestRunner ) {

    new TestRunner()

} )