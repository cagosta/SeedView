module.exports = function( grunt ) {


    grunt.config.set( 'exec.bower_register', {
        command: 'bower register SeedView git://github.com/cagosta/SeedView'
    } )

    grunt.config.set( 'exec.npm_publish', {
        command: 'npm publish'
    } )

    grunt.registerTask( 'publish:bower', [ 'build', 'test', 'exec:bower_register' ] )

    grunt.registerTask( 'publish:npm', [ 'build', 'test', 'exec:npm_publish' ] )

    grunt.registerTask( 'publish', 'Publish on bower and bpm', [ 'build', 'test', 'exec:bower_register', 'exec:npm_publish' ] )

}