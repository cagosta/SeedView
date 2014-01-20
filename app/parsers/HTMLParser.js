define([
    '../Parser'
], function( Parser ){


    return Parser.extend({

        '+options': {
            name: 'html'
        },

        '+constructor': function( ){
            
        },

        parse: function( view ) { // dirty


            var fragment = document.createElement(),
                container = document.createElement( 'container' ),
                flaggedElements
                container.innerHTML = view.template
                fragment.appendChild( container.childNodes[ 0 ] )
                view._fragment = fragment
                view._elements = {
                    root: view._fragment
                }
            flaggedElements = view.getElementsByAttribute( 'flag' )
            for ( var i = 0; i < flaggedElements.length; i++ ) {
                view.addElement( flaggedElements[ i  ].getAttribute( 'flag' ), flaggedElements[ i ] )
            }
        }

    })


})