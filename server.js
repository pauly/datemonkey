var express = require('express'),
  app = express.createServer();

var randomise = function ( a ) {
  for ( var i = 0, l = a.length; i < l; i ++ ) {
    a[i]._key = i;
  }
  return a.sort( function () { return Math.random() > 0.5 } );
};

var multipleChoices = 3;

var htmlWrapper = function ( req, res, next ) {
  var send = res.send;
  res.send = function ( foo ) {
    res.send = send;
    res.send( '<html><head><title>Date monkey nodejs tests</title></head><body>' + foo + '<footer><p>&copy; <a href="http://www.clarkeology.com">Paul Clarke</a></p></footer></body></html>' );
  }
  next();
};
app.use( htmlWrapper );

var answer = function ( req, res, next ) {
  var send = res.send;
  res.send = function ( foo ) {
    res.send = send;
    var html = '';
    if ( validate( req.query )) {
      html += "Right!";
      
    }
    else {
      html += "Wrong!";
    }
    html += foo;
    res.send( html );
  }
  next();
};
app.use( answer );

var p = function ( ) {
  var i, r = '';
  for ( i in arguments ) {
    r += '<p>' + arguments[i] + '</p>';
  }
  return r;
};

var input = function ( c, q ) {
  var r = '';
  var all = randomise( data[c][1] );
  var answers = [ data[c][1][q] ];
  for ( i in all ) {
    if (( all[i]._key != q ) && ( answers.length < multipleChoices )) {
      answers.push( all[i] );
    }
  }
  answers = randomise( answers );
  for ( i in answers ) {
    r += '<button name="answer" type="submit" value="' + answers[i][0] + '"><span>' + answers[i][0] + '</span></button>';
  }
  return r;
};

var validate = function ( params ) {
  if ( ! data[params.c] ) {
    return false;
  }
  if ( ! data[params.c][1][params.q] ) {
    return false;
  }
  return data[params.c][1][params.q][0] === params.answer;
};

var question = function ( params ) {
  var c = params.category - 1;
  var q = params.question - 1;
  if ( ! data[c] ) {
    c = Math.floor( Math.random( ) * data.length );
  }
  if ( ! data[c][1][q] ) {
    q = Math.floor( Math.random( ) * data[c][1].length );
  }
  return '<form><input type="hidden" name="c" value="' + c + '" /><input type="hidden" name="q" value="' + q + '" />' + data[c][0] + ' ' +  data[c][1][q][1] + '? ' + input( c, q ) + '</form>';
};

var categories = function ( ) {
  var r = '', i;
  for ( i in data ) {
    r += p( '<a href="">' + data[i][0] + '</a>' );
  }
  return r;
}

app.get( '/', function( req, res, next ) {
  res.send( categories( ));
} );

app.get( '/random', function( req, res, next ) {
  res.send(( req.params.answer ? answer( req.params ) : '' ) + question( req.params ));
} );

app.get( '/category/:category/random', function( req, res, next ) {
  res.send( question( req.params ));
} );

app.get( '/category/:category/question/:question', function( req, res, next ) {
  res.send( question( req.params ));
} );

app.all( /(.*)/, function( req, res ) {
  res.send( p( 'Sorry, did not find ' + req.params[0] ));
} );

app.listen( 12248 );

var data = [
  [
    'Best picture',
    [
      [ "King's Speech", 2010 ],
      [ "Hurt Locker", 2009 ],
      [ "Slumdog Millionaire", 2008 ],
      [ "No Country For Old Men", 2007 ],
      [ "The Departed", 2006 ],
      [ "Crash", 2005 ]


      /* [ "Million Dollar Baby", 2004 ],
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
      [ "Patton", 1970 ] */
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
  ]
];

