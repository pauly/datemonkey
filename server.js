/**
 * Test yourself on dates, an experiment in nodejs
 *
 * @author  PC <paul.clarke+paulclarke@holidayextras.com>
 * @date    Mon 17 Oct 2011 18:27:10 BST
 */

var title = 'Date monkey';
var password = process.env.PASSWORD || 'lkjsd';
var crypto = require( 'crypto' );
var express = require( 'express' );
var app = module.exports = express.createServer( );
var io = require( 'socket.io' ).listen( app );
var data = require( './data' );
var Question = require( './lib/Question' );

/* io.sockets.on( 'connection', function ( socket ) {
  socket.on( 'answer', function ( data ) {
    console.log( 'got an answer: ' + JSON.stringify( data ));
  } );
} ); */

app.configure( function ( ) {
  app.set( 'views', __dirname + '/views' );
  app.set( 'view engine', 'hbs' );
  app.use( require( 'stylus' ).middleware( { src: __dirname + '/public' } ));
  app.use( app.router );
  app.use( express.static( __dirname + '/public' ));
} );

app.configure( 'production', function ( ) {
  app.use( express.errorHandler( ));
} );

var shuffle = function ( a ) {
  return a.sort( function ( ) { return Math.random( ) > 0.5; } );
};

var multipleChoices = 3;

// Generate a multiple choice input for a question, in a category
var options = function ( c, q ) {
  var question = data[c][1][q];
  var all = shuffle( data[c][1].slice( 0 ));
  var answers = [ question ];
  var i;
  for ( var diff in [ 3, 1, 100, 200, 1000 ] ) {
    if ( answers.length < multipleChoices ) { // let's have another go
      for ( i in all ) { // try and get multiple choices within 3 years
        if ( question.like( all[i], diff ) && ( answers.length < multipleChoices )) {
          answers.push( all[i] );
        }
      }
    }
  }
  return shuffle( answers );
};

var _hash = function ( data, source ) {
  var subset = {
    correct: data.correct / 1,
    taken: data.taken / 1 
  };
  var hash = crypto.createHmac( 'md5', password ).update( JSON.stringify( subset )).digest( 'hex' );
  return hash;
};

// Show a new question, and the answer to the last question
var question = function ( req, res ) {
  var c = req.params.category - 1;
  var q = req.params.question - 1;
  if ( ! data[c] ) {
    c = Math.floor( Math.random( ) * data.length );
  }
  if ( ! data[c][1][q] ) {
    q = Math.floor( Math.random( ) * data[c][1].length );
  }
  var r = {
    warning: '',
    difficulty: req.query.difficulty || 0,
    difficulties: [
      // { value: -1, label: 'easy', checked: req.query.difficulty == -1 ? 'checked="checked"' : null },
      { value: 0, label: 'normal', checked: req.query.difficulty == 0 ? 'checked="checked"' : null  },
      { value: 1, label: 'tricksy', checked: req.query.difficulty == 1 ? 'checked="checked"' : null }
    ],
    hidden: {
      name: req.query.name || '',
      c: c,
      q: q,
      taken: req.query.taken / 1 || 0,
      correct: req.query.correct / 1 || 0
    },
    category: {
      title: data[c][0],
      explanation: data[c][2]
    },
    clues: data[c][1][q].clues( )
  };
  if ( req.query.taken ) {
    if ( req.query.hash !== _hash( req.query, 'query' )) {
      r.warning = 'Hmm... '; // you're only cheating yourself...
    }
  }

  var question = data[c][1][q].year( ) || data[c][1][q].question( );
  if (( req.query.difficulty > 0 ) && data[c][1][q].year( )) {
    var otherCategories = [];
    var i, oq;
    for ( i in data ) {
      if (( i != c ) && data[i][1] && data[i][1][0].year( )) {
        otherCategories.push( i );
      }
    }
    var otherCategory = data[ otherCategories[ Math.floor( Math.random( ) * otherCategories.length ) ]];
    if ( otherCategory[1] ) {
      var otherAnswers = shuffle( otherCategory[1].slice( 0 ));
      var someAnswer;
      for ( i in otherAnswers ) {
        if ( otherAnswers[i].year( ) === question ) {
          someAnswer = otherAnswers[i].answer( );
        }
      }
      if ( someAnswer ) {
        r.question = {
          answer: data[c][1][q].year( ),
          question: 'in the year ' + someAnswer + ' was ' + otherCategory[0],
          trivia: data[c][1][q].trivia( ),
          options: options( c, q )
        };
      }
    }
  }
  if ( ! r.question ) {
    r.question = {
      answer: data[c][1][q].answer( ),
      question: question, // question here is a year
      trivia: data[c][1][q].trivia( ),
      options: options( c, q )
    };
  }
  if ( req.query && req.query.answer && data[req.query.c] && data[req.query.c][1][req.query.q] ) {
    var message = data[req.query.c][0] + ' ' + data[req.query.c][1][req.query.q].question( ) + ' ';
    if ( data[req.query.c][1][req.query.q].answer( ) === req.query.answer ) {
      r.result = 'Right!';
      message += 'correct';
      if ( req.query.difficulty > 0 ) {
        r.result += ' (' + data[req.query.c][1][req.query.q].answer( ) + ')';
      }
      ++ r.hidden.correct;
    }
    else {
      r.result = 'Wrong! ' + data[req.query.c][1][req.query.q].question( ) + ' was ' + data[req.query.c][1][req.query.q].answer( );
      message += 'incorrect';
    }
    r.result += ' ' + r.warning;
    ++ r.hidden.taken;
    r.score = r.hidden.correct + ' / ' + r.hidden.taken;
    r.hidden.hash = _hash( r.hidden, 'hidden' ); // make the new hash
    io.sockets.emit( 'answer', { message: r.warning + ( r.hidden.name || 'Anon' ) + ' now has ' + r.score + '; ' + message } );
  }
  return r;
};

app.get( '/', function ( req, res, next ) {
  res.render( 'index.hbs', {
    siteTitle: title,
    title: title + ' - experiments in nodejs',
    data: data
  } );
} );

app.all( '/category/:category', function ( req, res ) {
  res.render( 'question.hbs', {
    siteTitle: title,
    title: title + ' - ' + data[ req.params.category - 1 ][0] + ' question',
    content: question( req, res )
  } );
} );

app.all( '/random', function ( req, res ) {
  res.render( 'question.hbs', {
    siteTitle: title,
    title: title + ' - random question',
    content: question( req, res )
  } );
} );

app.listen( process.env.PORT || 12248 );

data.forEach( function ( item, id ) {
  item._id = id + 1;
  item._title = item[0];
  for ( var q in item[1] ) {
    item[1][q] = new Question( item[1][q], data );
  }
} );
