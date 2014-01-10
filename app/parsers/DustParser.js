define([
    '../Parser'
], function( Parser ){


    return Parser.extend({

        '+options': {
            name: 'html'
        },

        '+constructor': function( ){
            
        },

        parse: function( view ) {
            if ( typeof view.template !== 'function' )
                throw new Error( 'Dust template is invalid', view )
            var template = view.template(),
                name = template.name,
                dust = template.dust,
                flags = view._dustFlags = [],
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
                context = dustBase.push( view.getRawData() ||  {} )
                dust.render( name, context, function( err, out ) {
                    if ( err )
                        throw err
                    rendered = out
                } )

                var fragment = document.createDocumentFragment(),
                container = document.createElement( 'div' )

                container.innerHTML = rendered
                view._fragment = fragment

            for ( var i = 0; i < container.childNodes.length; i++ ) {
                view._fragment.appendChild( container.childNodes[ i ] )
            }
            view._elements = {
                root: view._fragment.childNodes[ 0 ]
            }
            for ( var i = 0; i < flags.length; i++ ) {
                view._initializeDustFlag( flags[ i ] )
            }
            this._initializeDustSubviews()
        },

        _initializeDustFlag: function( flag ) {
            var el = view.element( 'root' ).getElementsByClassName( flag.HTMLId )[ 0 ] // dirty
            view.addElement( flag.id, el )
        },

        _initializeDustSubviews: function() {
            for ( var i = 0; i < view._dustFlags.length; i++ )
                if ( view._dustFlags[ i ].isSubview )
                    this._initializeDustSubview( view._dustFlags[ i ] )
        },

        _initializeDustSubview: function( flag ) {
            view._subviews[ flag.id ] = new View( {
                parser: 'dustSubview',
                _template: {
                    elements: view._elements,
                    node: view._elements[ flag.id ]
                }
            } )
        },

        parseDustSubview: function() {
            view._elements = view.template.elements
            view._fragment = view.template.node
        }

    })


})