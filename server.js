/**
 * Test yourself on dates, an experiment in nodejs
 *
 * @author  PC <paul.clarke+paulclarke@holidayextras.com>
 * @date    Mon 17 Oct 2011 18:27:10 BST
 */

var title = 'Date monkey',
  express = require('express'),
  app = module.exports = express.createServer(),
  io = require('socket.io'),
  data = require('./data'),
  io = io.listen(app);

io.sockets.on( 'connection', function ( socket ) {
  socket.on( 'answer', function ( data ) {
    console.log( 'got an answer: ' + JSON.stringify( data ));
  } );
} );

/* app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
}); */

app.configure( 'production', function( ) {
  app.use( express.errorHandler( ));
});

var Question = function ( question ) {
  if ( question._question )
    return question; // already been done
  this._question = question;
  this._clues = null;
  this.clues = function ( ) {
    if ( this._clues !== null )
      return this._clues;
    this._clues = [];
    var i, j, oq;
    for ( i in data ) {
      for ( j in data[i][1] ) {
        if ( data[i][1][j].year( ) == this.year( )) {
          this._clues.push( data[i][1][j] );
        }
      }
    }
  };
  this.year = function ( ) {
    var d = this._question[1];
    console.log( 'in year( ), d is', d );
    if (( '' + d ).match( /^[A-Za-z]/ )) return d; // not a date at all!
    if (( '' + d ).match( /^\d{3,4}$/ )) return d; // already a year
    d = new Date( d );
    return d.getFullYear ? d.getFullYear( ) : false;
  };
  this.answer = function () {
    return this._question[0];
  };
  this.trivia = function () {
    return this._question[3] || this._question[2];
  };
  // Is answer b like answer a (but not equal to)? Is it within range c?
  this.like = function ( b, c ) {
    if ( this.answer() != b.answer( )) {
      if ( c ) {
        // console.log( 'comparing ' + this.year() + ' with ' + b.year( ));
        if ( this.year() && b.year( )) {
          // console.log( this.year( ) + ' - ' + b.year( ) + ' is ' + ( this.year( ) - b.year( )) + ' is that less than ' + c );
          return Math.abs( this.year( ) - b.year( )) <= c;
        }
        else {
          // console.log( this.answer().substr(0,c) + ' == ' + b.answer().substr(0,c) + '?' );
          return this.answer().toLowerCase().substr(0,c) == b.answer().toLowerCase().substr(0,c);
        }
      }
      return true;
    }
  };
};

var shuffle = function ( a ) {
  return a.sort( function ( ) { return Math.random() > 0.5; } );
};

var multipleChoices = 3;

// Generate a multiple choice input for a question, in a category
var options = function ( c, q ) {
  var question = data[c][1][q];
  var all = shuffle( data[c][1].slice( 0 ));
  var answers = [ question ];
  var i;
  for ( i in all ) { // try and get multiple choices within 3 years
    if ( question.like( all[i], 3 ) && ( answers.length < multipleChoices )) {
      answers.push( all[i] );
    }
  }
  if ( answers.length < multipleChoices ) { // let's have another go
    for ( i in all ) {
      if ( question.like( all[i], 1 ) && ( answers.length < multipleChoices )) {
        answers.push( all[i] );
      }
    }
  }
  if ( answers.length < multipleChoices ) { // let's have another go
    for ( i in all ) {
      if ( question.like( all[i] ) && ( answers.length < multipleChoices )) {
        answers.push( all[i] );
      }
    }
  }
  return shuffle( answers );
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
    difficulty: req.query.difficulty,
    hidden: {
      name: req.query.name || '',
      c: c,
      q: q,
      taken: req.query.taken ? parseInt( req.query.taken, 10 ) : 0
    },
    category: {
      title: data[c][0],
      explanation: data[c][2]
    },
    clues: data[c][1][q].clues()
  };
  var year = data[c][1][q].year();
  console.log( req.query.difficulty + ' > 0 ) && ' + data[c][1][q].year( ) + '?' );
  if (( req.query.difficulty > 0 ) && data[c][1][q].year( )) {
    var other_categories = [];
    var i, oq;
    for ( i in data ) {
      if (( i != c ) && data[i][1] && data[i][1][0].year( )) {
        other_categories.push( i );
      }
    }
    console.log( other_categories );
    var other_category = data[ other_categories[ Math.floor( Math.random( ) * other_categories.length ) ]];
    if ( other_category[1] ) {
      var other_answers = shuffle( other_category[1].slice( 0 ));
      var some_answer;
      for ( i in other_answers ) {
        if ( other_answers[i].year( ) === year ) {
          some_answer = other_answers[i].answer( );
        }
      }
      if ( some_answer ) {
        r.question = {
          answer: data[c][1][q].year( ),
          question: 'in the year ' + some_answer + ' was ' + other_category[0],
          trivia: data[c][1][q].trivia( ),
          options: options( c, q )
        };
      }
    }
  }
  if ( ! r.question ) {
    r.question = {
      answer: data[c][1][q].year( ),
      question: year, // question here is a year
      trivia: data[c][1][q].trivia( ),
      options: options( c, q )
    };
    console.log( 'r.question.question is', r.question.question );
  }
  if ( req.query && req.query.answer && data[req.query.c] && data[req.query.c][1][req.query.q] ) {
    r.hidden.correct = parseInt( req.query.correct || 0, 10 );
    console.log( 'is ' + data[req.query.c][1][req.query.q].answer( ) + ' === ' + req.query.answer );
    console.log( data[req.query.c][1][req.query.q] );
    if ( data[req.query.c][1][req.query.q].answer( ) === req.query.answer ) {
      r.result = 'Right!';
      if ( req.query.difficulty ) {
        r.result += ' (' + data[req.query.c][1][req.query.q].year( ) + ')';
      }
      ++ r.hidden.correct;
    }
    else {
      r.result = 'Wrong! ' + data[req.query.c][1][req.query.q].year( ) + ' was ' + data[req.query.c][1][req.query.q].answer( );
    }
    ++ r.hidden.taken;
    r.score = r.hidden.correct + ' / ' + r.hidden.taken;
    io.sockets.emit( 'answer', { message: r.hidden.name + ' now has ' + r.score } );
  }
  return r;
};

app.get( '/', function( req, res, next ) {
  res.render( 'index.jade', {
    siteTitle: title,
    title: title + ' - experiments in nodejs',
    data: data
  } );
} );

app.all( '/category/:category', function( req, res ) {
  res.render( 'question.jade', {
    siteTitle: title,
    title: title + ' - ' + data[ req.params.category - 1 ][0] + ' question',
    content: question( req, res )
  } );
} );

app.all( '/random', function( req, res ) {
  res.render( 'question.jade', {
    siteTitle: title,
    title: title + ' - random question',
    content: question( req, res )
  } );
} );

app.listen( 12248 );
console.log( 'Express server listening on port %d in %s mode', app.address().port, app.settings.env );

// initialise
for ( var c in data ) {
  for ( var q in data[c][1] ) {
    data[c][1][q] = new Question( data[c][1][q] );
  }
}

