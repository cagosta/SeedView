define( [
    './SeedView'
 ], function( SeedView ) {


    return SeedView.extend( {

        parseDust: function() {
            if ( typeof this.template !== 'function' )
                throw new Error( 'Dust template is invalid', this )
            var template = this.template(),
                name = template.name,
                dust = template.dust,
                flags = this._dustFlags = [],
                subviews = [],
                rendered,
                dustBase = dust.makeBase( {
                    flag: function( chunk, context, bodies, params ) {
                        var id = params.id,
                            randomHTMLId = id + parseInt( Math.random() * 1000 )
                            flags.push( {
                                id: id,
                                HTMLId: randomHTMLId
                            } )
                            chunk.write( ' ' + randomHTMLId + ' ' )
                    },
                    subview: function( chunk, context, bodies, params ) {
                        var id = params.id,
                            randomHTMLId = id + parseInt( Math.random() * 1000 )
                            flags.push( {
                                id: id,
                                HTMLId: randomHTMLId,
                                isSubview: true
                            } )
                            chunk.write( ' ' + randomHTMLId + ' ' )
                            chunk.render( bodies.block )
                    }
                } ),
                context = dustBase.push( this.getRawData() ||  {} )
                dust.render( name, context, function( err, out ) {
                    if ( err )
                        throw err
                    rendered = out
                } )

                var fragment = document.createDocumentFragment(),
                container = document.createElement( 'div' )

                container.innerHTML = rendered
                this._fragment = fragment

            for ( var i = 0; i < container.childNodes.length; i++ ) {
                this._fragment.appendChild( container.childNodes[ i ] )
            }
            this._elements = {
                root: this._fragment.childNodes[ 0 ]
            }
            for ( var i = 0; i < flags.length; i++ ) {
                this._initializeDustFlag( flags[ i ] )
            }
            this._initializeDustSubviews()
        },

        _initializeDustFlag: function( flag ) {
            var el = this.element( 'root' ).getElementsByClassName( flag.HTMLId )[ 0 ] // dirty
            this.addElement( flag.id, el )
        },

        _initializeDustSubviews: function() {
            for ( var i = 0; i < this._dustFlags.length; i++ )
                if ( this._dustFlags[ i ].isSubview )
                    this._initializeDustSubview( this._dustFlags[ i ] )
        },

        _initializeDustSubview: function( flag ) {
            this._subviews[ flag.id ] = new View( {
                parser: 'dustSubview',
                _template: {
                    elements: this._elements,
                    node: this._elements[ flag.id ]
                }
            } )
        },

        parseDustSubview: function() {
            this._elements = this.template.elements
            this._fragment = this.template.node
        }


    } )



} )