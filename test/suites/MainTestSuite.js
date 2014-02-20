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

        describe( 'commons methods & test methods', function() {

            beforeEach( function() {

                this.view = new SeedView( {

                    parser: 'toDOM',
                    template: {
                        label: 'container',
                        children: [ {
                            label: 'alabel'
                        } ]
                    }

                } )

                this.anotherView = new SeedView( {

                    template: {
                        label: 'anotherLabel'
                    }

                } )

            } )

            describe( 'elements', function() {

                it( 'should have a root element', function() {

                    expect( this.view.hasElement( 'root' ) ).to.be.true

                } )


                describe( 'insert', function() {

                    describe( 'to container label', function() {


                        it( 'should be possible to insert a view to another view', function() {

                            this.view.insert( this.anotherView )
                            expect( this.view.contained.container ).to.exist

                        } )

                        describe( 'containA && contain', function() {

                            it( 'should respond true when containing & false when not containing', function() {

                                this.view.insert( this.anotherView )
                                expect( this.view.containA( 'container' ) ).to.be.true
                                expect( this.view.containA( 'bullshit' ) ).to.be.false

                            } )


                        } )

                        describe( 'contain', function() {

                            it( 'should respond true when containing & false when not containing', function() {

                                this.view.insert( this.anotherView )
                                expect( this.view.contain( this.anotherView ) ).to.be.true
                                expect( this.view.contain( 'bullshit' ) ).to.be.false

                            } )

                        } )

                    } )

                    it( 'should be possible to add a view to anotherView label', function() {

                        this.view.insert( 'alabel', this.anotherView )
                        expect( this.view.contained.container ).to.not.exist
                        expect( this.view.contained.alabel ).to.exist

                    } )

                } )

            } )

            describe( 'hasParentNode && getParentNode', function() {

                it( 'should be possible test if a view is appended to something', function() {

                    this.view.insert( this.anotherView )
                    expect( this.view.hasParentNode() ).to.be.false
                    expect( this.anotherView.hasParentNode() ).to.be.true

                } )

                it( 'should be possible to retrieve the parentnode', function() {

                    this.view.insert( this.anotherView )
                    expect( this.anotherView.getParentNode() ).to.equal( this.view.element( 'container' ) )

                } )

            } )

            describe( 'innerText', function() {

                describe( 'with root', function() {

                    it( 'should add text into div', function() {

                        this.view.innerText( 'yo' )
                        expect( this.view.hasText( 'yo' ) ).to.be.true


                    } )

                } )

                describe( 'with label', function() {

                    it( 'should add text to label', function() {

                        this.view.innerText( 'alabel', 'yo' )
                        expect( this.view.hasText( 'alabel', 'yo' ) ).to.be.true

                    } )

                } )

            } )

        } )



    } )



} )