define( [
    './SeedView',
    // 'utils/dom/HTMLExpression', // todo
 ], function( View, HTMLExpression ) {


    return View.extend( {


        parseZen: function() {
            this.template = this.template.replace( /\/\*[^\/]*\*\//g, '' )
            this.template = this.template.replace( /\/\/.*\n/g, '' )
            this.template = this.template.replace( /\r+|\n+|\t+/g, '' )
            this._fragment = HTMLExpression.parse( this.template, this )
        }

    } )


} )