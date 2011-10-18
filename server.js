/**
 * Test yourself on dates, an experiment in nodejs
 * 
 * @author  PC <paul.clarke+paulclarke@holidayextras.com>
 * @date    Mon 17 Oct 2011 18:27:10 BST
 */

var express = require('express'),
  app = express.createServer();

var shuffle = function ( a ) {
  return a.sort( function () { return Math.random() > 0.5 } );
};

var multipleChoices = 3;

// Quick middleware example, better to use templating though probably
var htmlWrapper = function ( req, res, next ) {
  if ( req.url.indexOf('.css') === -1 ) {
    var send = res.send;
    res.send = function ( foo ) {
      res.send = send;
      res.send( '<html><head><title>Date monkey quiz tester in nodejs</title><link rel="stylesheet" type="text/css" media="screen and (max-device-width: 480px)" href="/mobile.css" /></head><body>' + foo + '<footer><a href="/">Date monkey quiz tester</a> in nodejs <p>&copy; <a href="http://www.clarkeology.com">Paul Clarke</a>. Hosted by <a href="http://nodester.com">nodester.com</a>.</p></footer></body></html>' );
    }
  }
  next();
};
app.use( htmlWrapper );

// Just a helper method, does not save much
var p = function ( ) {
  var i, r = '';
  for ( i in arguments ) {
    r += '<p>' + arguments[i] + '</p>';
  }
  return r;
};

// Generate a multiple choice input for a question, in a category
var input = function ( c, q ) {
  return multipleAnswersOneCategory( c, q );
};

// Generate a multiple choice input for a question, in a category
var multipleAnswersOneCategory = function ( c, q ) {
  var r = '';
  var all = shuffle( data[c][1].slice( 0 ));
  var answers = [ data[c][1][q] ];
  for ( i in all ) {
    if (( all[i][0] != data[c][1][q][0] ) && ( answers.length < multipleChoices )) {
      answers.push( all[i] );
    }
  }
  for ( i in shuffle( answers )) {
    r += '<button name="answer" type="submit" value="' + answers[i][0] + '"><span>' + answers[i][0] + '</span></button>';
  }
  return r;
};

// Show a new question, and the answer to the last question
var question = function ( req, res ) {
  var r = '';
  if ( req.query && req.query.answer && data[req.query.c] && data[req.query.c][1][req.query.q] ) {
    if ( data[req.query.c][1][req.query.q][0] === req.query.answer ) {
      req.query.correct = 1 + parseInt( req.query.correct );
      r += p( "Right!" );
    }
    else {
      r += p( "Wrong!", "It was " + data[req.query.c][1][req.query.q][0] );
    }
    req.query.taken = 1 + parseInt( req.query.taken );
    r += p( req.query.correct + ' / ' + req.query.taken );
  }
  var c = req.params.category - 1;
  var q = req.params.question - 1;
  if ( ! data[c] ) {
    c = Math.floor( Math.random( ) * data.length );
  }
  if ( ! data[c][1][q] ) {
    q = Math.floor( Math.random( ) * data[c][1].length );
  }
  r += '<form><input type="hidden" name="taken" value="' + ( req.query.taken || 0 ) + '" /><input type="hidden" name="correct" value="' + ( req.query.correct || 0 ) + '" /><input type="hidden" name="c" value="' + c + '" /><input type="hidden" name="q" value="' + q + '" />';
  r += data[c][0] + ' ' + data[c][1][q][1] + '? ' + input( c, q );
  r += '</form>';
  return r;
};

var index = function ( ) {
  var r = '', i;
  r += p( 'Choose a category:' );
  for ( i in data ) {
    r += p( '<a href="/category/' + ( 1 + parseInt( i )) + '">' + data[i][0] + '</a>' );
  }
  r += p( '<a href="/random">Or just go for a lucky dip</a>...' );
  r += p( 'Only "What was X in year Y" right now but more on the way... <a href="pauly+datemonkey@clarkeology.com?Subject=Some+data+in+value,year+columns">Got some data for me</a>?' );
  return r;
}

app.get( '/', function( req, res, next ) {
  res.send( index( ));
} );

app.all( '/mobile.css', function( req, res ) {
  res.send( 'body { font-size: 2em; }' );
} );

app.all( '/category/:category', function( req, res ) {
  res.send( question( req, res ));
} );

app.all( '/random', function( req, res ) {
  res.send( question( req, res ));
} );

app.listen( 12248 );

// All the data in a big array, individual answers should be [ "Answer", year, "optional trivia (unused so far)" ]
var data = [
  [
    'Best picture',
    [
      [ "King's Speech", 2010 ],
      [ "Hurt Locker", 2009 ],
      [ "Slumdog Millionaire", 2008 ],
      [ "No Country For Old Men", 2007 ],
      [ "The Departed", 2006 ],
      [ "Crash", 2005 ],
      [ "Million Dollar Baby", 2004 ],
      [ "Lord of the Rings: ROTK", 2003 ],
      [ "Chicago", 2002 ],
      [ "A Beautiful Mind", 2001 ],
      [ "Gladiator", 2000 ],
      [ "American Beauty", 1999 ],
      [ "Shakespeare in Love", 1998 ],
      [ "Titanic", 1997 ],
      [ "English Patient", 1996 ],
      [ "Braveheart", 1995 ],
      [ "Forrest Gump", 1994 ],
      [ "Schindler's List", 1993 ],
      [ "Unforgiven", 1992 ],
      [ "Silence of the Lambs", 1991 ],
      [ "Dances with Wolves", 1990 ],
      [ "Driving Miss Daisy", 1989 ],
      [ "Rain Man", 1988 ],
      [ "The Last Emperor", 1987 ],
      [ "Platoon", 1986 ],
      [ "Out of Africa", 1985 ],
      [ "Amadeus", 1984 ],
      [ "Terms of Endearment", 1983 ],
      [ "Ghandi", 1982 ],
      [ "Chariots of Fire", 1981 ],
      [ "Ordinary People", 1980 ],
      [ "Kramer Vs Kramer", 1979 ],
      [ "The Deer Hunter", 1978 ],
      [ "Annie Hall", 1977 ],
      [ "Rocky", 1976 ],
      [ "One Flew Over the Cuckoo's Nest", 1975 ],
      [ "The Godfather Part II", 1974 ],
      [ "The Sting", 1973 ],
      [ "The Godfather", 1972 ],
      [ "The French Connection", 1971 ],
      [ "Patton", 1970 ]
    ]
  ],
  [
    'Best actor',
    [
      [ "Colin Firth", 2010 ],
      [  "Jeff Bridges", 2009 ],
      [  "Sean Penn", 2008 ]
    ]
  ],
  [
    'Best actress',
    [
      [ "Natalie Portman", 2010 ],
      [ "Sandra Bullock", 2009 ],
      [ "Kate Winslet", 2008 ]
    ]
  ],
  [
    'BBC sports personality of the year',
    [
      [ "Ryan Giggs", 2009, "football" ],
      [ "Chris Hoy", 2008, "cycling" ],
      [ "Joe Calzaghe", 2007, "boxing" ],
      [ "Zara Phillips", 2006, "equestrian" ],
      [ "Andrew Flintoff", 2005, "cricket" ],
      [ "Kelly Holmes", 2004, "athletics" ],
      [ "Jonny Wilkinson", 2003, "rugby" ],
      [ "Paula Radcliffe", 2002, "athletics" ],
      [ "David Beckham", 2001, "football" ],
      [ "Steve Redgrave", 2000, "rowing" ],
      [ "Lennox Lewis", 1999, "boxing" ],
      [ "Michael Owen", 1998, "football" ],
      [ "Greg Rusedski", 1997, "tennis" ],
      [ "Damon Hill", 1996, "motor racing" ],
      [ "Jonathan Edwards", 1995, "athletics" ],
      [ "Damon Hill", 1994, "motor sport" ],
      [ "Linford Christie", 1993, "athletics" ],
      [ "Nigel Mansell", 1992, "motor racing" ],
      [ "Liz McColgan", 1991, "athletics" ],
      [ "Paul Gascoigne", 1990, "football" ],
      [ "Nick Faldo", 1989, "golf" ],
      [ "Steve Davis", 1988, "snooker" ],
      [ "Fatima Whitbread", 1987, "athletics" ],
      [ "Nigel Mansell", 1986, "motor racing" ],
      [ "Barry McGuigan", 1985, "boxing" ],
      [ "Jayne Torvill and Christopher Dean", 1984, "ice skating" ],
      [ "Steve Cram", 1983, "athletics" ],
      [ "Daley Thompson", 1982, "athletics" ],
      [ "Ian Botham", 1981, "cricket" ],
      [ "Robin Cousins", 1980, "ice skating" ],
      [ "Sebastian Coe", 1979, "athletics" ],
      [ "Steve Ovett", 1978, "athletics" ],
      [ "Virginia Wade", 1977, "tennis" ],
      [ "John Curry", 1976, "ice skating" ],
      [ "David Steele", 1975, "cricket" ],
      [ "Brendan Foster", 1974, "athletics" ],
      [ "Jackie Stewart", 1973, "motor racing" ],
      [ "Mary Peters", 1972, "athletics" ],
      [ "Princess Anne", 1971, "equestrian" ],
      [ "Henry Cooper", 1970, "boxing" ],
      [ "Ann Jones", 1969, "tennis" ],
      [ "David Hemery", 1968, "athletics" ],
      [ "Henry Cooper", 1967, "boxing" ],
      [ "Bobby Moore", 1966, "football" ],
      [ "Tommy Simpson", 1965, "cycling" ],
      [ "Mary Rand", 1964, "athletics" ],
      [ "Dorothy Hyman", 1963, "athletics" ],
      [ "Anita Lonsbrough", 1962, "swimming" ],
      [ "Stirling Moss", 1961, "motor racing" ],
      [ "David Broome", 1960, "showjumping" ],
      [ "John Surtees", 1959, "motor cycling" ],
      [ "Ian Black", 1958, "swimming" ],
      [ "Dai Rees", 1957, "golf" ],
      [ "Jim Laker", 1956, "cricket" ],
      [ "Gordon Pirie", 1955, "athletics" ],
      [ "Chris Chataway", 1954, "athletics" ]
    ]
  ]
];

