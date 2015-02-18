var hooks = require('hooks');
var _ = require('underscore');

module.exports = function quoteEmailPlugin(schema) {

  // Default to full-text search if no fields are provided
  var fields = ['$text.$search'];

  // Add hook methods: `hook`, `pre`, `post`
  for (var k in hooks) {
    schema.statics[k] = schema.statics[k] || hooks[k];
  }

  // Quote emails prior to running queries on `find`, `findOne`, `count`
  ['find', 'findOne', 'count'].forEach(function(method) {
    schema.statics.hook(method, schema.statics[method]);
    schema.statics.pre(method, quoteEmail(fields));
  });
}

// Quote each email in the query
var quoteEmail = module.exports.quoteEmail = function(fields) {
  return function(next, conditions) {
    if (conditions) {
      console.log("conditions:",conditions);
      _.each(fields, function(field) {
        if ('$text.$search' === field && conditions.$text && conditions.$text.$search) {
          // Text search is a string of words
          conditions.$text.$search = _.map(conditions.$text.$search.split(' '), function(word) {
            return quoteIfEmail(word).join(' ');
          }).join(' ');
        }
      });
    }
    return next();
  }

  // Quote if string is an email
  function quoteIfEmail(word) {
    if (/^.+@.+\..+$/.test(word)) {
      // replace the quotes and re-add them (in case it's already quoted)
      word = '"' + word.replace(/['"]+/g, '') + '"';
    } 
    return [word];
  }
}
