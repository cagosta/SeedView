define( [
    'ifEngineIsBrowser!SeedView/SeedView',
    'engineDetector'
 ], function( SeedView, engineDetector ) {

    if ( ! SeedView ){
        describe('SeedView/SeedView', function( ){
            it('should NOT run tests on node.js', function(  ){
                expect( 0 ).to.equal( 0 )
            })
        })
        return 
    }

    describe( 'SeedView/SeedView', function() {

        it( 'should load without blowing', function() {

            expect( SeedView ).to.exist

        } )


    } )

    describe( 'SeedView/ZenView', function() {

        it( 'should load without blowing', function( done ) {

            require( [ 'SeedView/ZenView' ], function( ZenView ) {

                expect( ZenView ).to.exist
                done()

            } )

        } )

    } )



    describe( 'SeedView/ToDOMView', function() {

        it( 'should load without blowing', function( done ) {

            require( [ 'SeedView/ToDOMView' ], function( ZenView ) {

                expect( ZenView ).to.exist
                done()

            } )

        } )

    } )


} )