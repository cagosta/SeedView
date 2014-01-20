define( [
    '../Parser'
 ], function( Parser ) {

    return Parser.extend( {

        '+options': {
            name: 'dom'
        },

        '+constructor': function() {

        },

        parse: function( view ) { // todo add label?
            return {
                node: view.getTemplate()
            }
        }

    } )

} )