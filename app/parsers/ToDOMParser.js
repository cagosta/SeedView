define([
    '../Parser',
    'toDOM/toDOM'
], function( Parser, toDOM ){
    
    return Parser.extend({

        '+options': {
            name: 'toDOM'
        },

        '+constructor': function( ){

        },

        parse: function( view ){ // dirty
            var elements = { },
                template = view.getTemplate(),
                node = toDOM( template, elements )

            return {
                node: node,
                elements: elements
            }
        }

    })

})