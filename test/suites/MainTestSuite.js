define( [
    'SeedView/SeedView',
    'engineDetector/engineDetector'
], function( SeedView, engineDetector ) {


    if ( engineDetector.isNode ) {

        describe( 'SeedView/SeedView', function() {

            it( 'should NOT run tests on node.js', function() {
                expect( 0 ).to.equal( 0 )
            } )

        } )

        return
    }



    describe( 'SeedView/SeedView', function() {

        it( 'should load without blowing', function() {

            expect( SeedView ).to.exist

        } )

        it( 'should be instanciable with toDOM parser ', function() {


            new SeedView( {

                parser: 'toDOM',
                template: {}

            } )

        } )

        // it( 'should be instanciable with html parser', function() {

        //     expect( function() {
        //         var view = new SeedView( {
        //             parser: 'html',
        //             template: '<div></div>'
        //         } )
        //     } ).to.not.
        //     throw ( Error )

        // } )


    } )



} )