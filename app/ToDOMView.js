define( [
    './SeedView',
    'toDOM/toDOM'
 ], function( View, toDOM ) {

    return View.extend( {

        '+options': {
            parser: 'toDOM'
        },

        parseToDOM: function() {
            var template = this.template
            this._fragment = toDOM( template, this._elements )
            this._elements.root = this._fragment
        }

    } )


} )