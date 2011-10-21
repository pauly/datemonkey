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
  io = io.listen(app);

io.sockets.on( 'connection', function ( socket ) {
  socket.on( 'answer', function ( data ) {
    console.log( 'got an answer: ' + JSON.stringify( data ));
  } );
} );

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure( 'production', function( ) {
  app.use( express.errorHandler( ));
});

var shuffle = function ( a ) {
  return a.sort( function () { return Math.random() > 0.5 } );
};

var multipleChoices = 3;

// Is answer b like answer a (but not equal to)? Is it within range c?
var like = function ( a, b, c ) {
  if ( a[0] != b[0] ) {
    if ( c ) {
      if (( typeof( a[1] ) == 'number' ) && ( typeof( b[1] ) == 'number' )) {
        // console.log( a[1] + ' - ' + b[1] + ' is ' + ( a[1] - b[1] ) + ' is that less than ' + c );
        return Math.abs( a[1] - b[1] ) <= c;
      }
      else {
        // console.log( a[0].substr(0,c) + ' == ' + b[0].substr(0,c) + '?' );
        return a[0].toLowerCase().substr(0,c) == b[0].toLowerCase().substr(0,c);
      }
    }
    return true;
  }
};

// Generate a multiple choice input for a question, in a category
var options = function ( c, q ) {
  var all = shuffle( data[c][1].slice( 0 ));
  var answers = [ data[c][1][q] ];
  for ( i in all ) { // try and get multiple choices within 3 years
    if ( like( all[i], data[c][1][q], 3 ) && ( answers.length < multipleChoices )) {
      answers.push( all[i] );
    }
  }
  if ( answers.length < multipleChoices ) { // let's have another go
    for ( i in all ) {
      if ( like( all[i], data[c][1][q] ) && ( answers.length < multipleChoices )) {
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
    tricksy: req.query.tricksy,
    hidden: {
      name: req.query.name || '',
      c: c,
      q: q,
      taken: req.query.taken ? parseInt( req.query.taken ) : 0
    },
    category: {
      title: data[c][0],
      explanation: data[c][2]
    }
  };
  var year = data[c][1][q][1];
  if ( req.query.tricksy && ( typeof( year ) == 'number' )) {
    var other_categories = [];
    var i;
    for ( i in data ) {
      // console.log( data[i][0] + ', typeof ' + data[i][1][0][1] + ' is ' + typeof( data[i][1][0][1] ));
      if (( i != c ) && data[i][1] && data[i][1][0][1] && ( typeof( data[i][1][0][1] ) === typeof( year ))) {
        other_categories.push( i );
      }
    }
    var other_category = data[ other_categories[ Math.floor( Math.random( ) * other_categories.length ) ]];
    if ( other_category[1] ) {
      var other_answers = shuffle( other_category[1].slice( 0 ));
      var some_answer;
      for ( i in other_answers ) {
        if ( other_answers[i][1] === year ) {
          some_answer = other_answers[i][0];
        }
      }
      if ( some_answer ) {
        r.question = {
          answer: data[c][1][q][0],
          question: 'in the year ' + some_answer + ' was ' + other_category[0],
          trivia: data[c][1][q][2],
          options: options( c, q )
        };
      }
    }
  }
  if ( ! r.question ) {
    r.question = {
      answer: data[c][1][q][0],
      question: year, // question here is a year
      trivia: data[c][1][q][2],
      options: options( c, q )
    };
  }
  if ( req.query && req.query.answer && data[req.query.c] && data[req.query.c][1][req.query.q] ) {
    r.hidden.correct = parseInt( req.query.correct || 0 );
    if ( data[req.query.c][1][req.query.q][0] === req.query.answer ) {
      r.result = 'Right!';
      if ( req.query.tricksy ) {
        r.result += ' (' + data[req.query.c][1][req.query.q][1] + ')';
      }
      ++ r.hidden.correct;
    }
    else {
      r.result = 'Wrong! ' + data[req.query.c][1][req.query.q][1] + ' was ' + data[req.query.c][1][req.query.q][0];
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
console.log( "Express server listening on port %d in %s mode", app.address().port, app.settings.env );

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
    ],
    'Only gone back to 1970 so far, Clare to add more here...'
  ],
  [
    'Best actor',
    [
      [ "Colin Firth", 2010, "King's Speech" ],
      [ "Jeff Bridges", 2009, "Crazy Heart" ],
      [ "Sean Penn", 2008, "Milk" ],
      [ 'Daniel Day-Lewis', 2007, '(There Will Be Blood)' ],
      [ 'Forrest Whitaker', 2006, '(Last King of Sctoland)' ],
      [ 'Phillip Seymour-Hoffman', 2005, '(Capote)' ],
      [ 'Jamie Foxx', 2004, '(Ray)' ],
      [ 'Sean Penn', 2003, '(Mystic River)' ],
      [ 'Adrian Brody', 2002, '(The Pianist)' ],
      [ 'Denzel Washington', 2001, '(Training Day)' ],
      [ 'Russell Crowe', 2000, '(Gladiator)' ],
      [ 'Kevin Spacey', 1999, '(American Beauty)' ],
      [ 'Roberto Benigni', 1998, '(Life is Beautiful)' ],
      [ 'Jack Nicholson', 1997, '(As Good as it Gets)' ],
      [ 'Geoffrey Rush', 1996, '(Shine)' ],
      [ 'Nicholas Cage', 1995, '(Leaving Las Vegas)' ],
      [ 'Tom Hanks', 1994, '(Forrest Gump)' ],
      [ 'Tom Hanks', 1993, '(Philadelphia)' ],
      [ 'Al Pacino', 1992, '(Scent of a Woman)' ],
      [ 'Anthony Hopkins', 1991, '(Silence of the Lambs)' ],
      [ 'Jeremy Irons', 1990, '(Reversal of Fortune)' ],
      [ 'Daniel Day Lewis', 1989, '(My Left Foot)' ],
      [ 'Dustin Hoffman', 1988, '(Rain Man)' ],
      [ 'Michael Douglas', 1987, '(Wall Street)' ],
      [ 'Paul Newman', 1986, '(The Colour of Money)' ],
      [ 'John Hurt', 1985, '(Kiss of the Spider Woman)' ],
      [ 'F. Murray Abraham', 1984, '(Amadeus)' ],
      [ 'Robert Duvall', 1983, '(Tender Mercies)' ],
      [ 'Ben Kingsley', 1982, '(Ghandi)' ],
      [ 'Henry Fonda', 1981, '(On Golden Pond)' ],
      [ 'Robert Di Nero', 1980, '(Raging Bull)' ],
      [ 'Dustin Hoffman', 1979, '(Kramer Vs Kramer)' ],
      [ 'Jon Voight', 1978, '(Coming Home)' ],
      [ 'Richard Dreyfuss', 1977, '(The Goodbye Girl)' ],
      [ 'Peter Finch', 1976, '(Network)' ],
      [ 'Jack Nicholson', 1975, "(One Flew Over the Cuckoo's Nest)" ],
      [ 'Art Cartney', 1974, '(Harry and Tonto)' ],
      [ 'Jack Lemmon', 1973, '(Save the Tiger)' ],
      [ 'Marlon Brando', 1972, '(The Godfather, declined)' ],
      [ 'Gene Hackman', 1971, '(The French Connection)' ],
      [ 'George C Scott', 1970, '(Patton, declined)' ]
    ],
    'Need to add more actors here I know, coming soon...'
  ],
  [
    'Best actress',
    [
      [ "Natalie Portman", 2010, "Black Swan" ],
      [ "Sandra Bullock", 2009, "The Blind Side" ],
      [ "Kate Winslet", 2008, "The Reader" ],
      [ "Marion Cotillard", 2007, "La Vie en Rose" ],
      [ "Helen Mirren", 2006, "The Queen" ],
      [ "Reese Witherspoon", 2005, "Walk the Line" ],
      [ "Hilary Swank", 2004, "Million Dollar Baby" ],
      [ "Charlize Theron", 2003, "Monster" ],
      [ "Nicole Kidman", 2002, "The Hours" ],
      [ "Halle Berry", 2001, "Monster's Ball" ],
      [ "Julia Roberts", 2000, "Erin Brockavitch" ],
      [ "Hilary Swank", 1999, "Boys Don't Cry" ],
      [ "Gwyneth Paltrow", 1998, "Shakespeare in Love" ],
      [ "Helen Hunt", 1997, "As Good as it Gets" ],
      [ "Frances McDormand", 1996, "Fargo" ],
      [ "Susan Sarandon", 1995, "Dead Man Walking" ],
      [ "Jessica Lange", 1994, "Blue Sky" ],
      [ "Holly Hunter", 1993, "The Piano" ],
      [ "Emma Thompson", 1992, "Howard's End" ],
      [ "Jodie Foster", 1991, "Silence of the Lambs" ],
      [ "Kathy Bates", 1990, "Misery" ],
      [ "Jessica Tandy", 1989, "Driving Miss Daisy" ],
      [ "Jodie Foster", 1988, "The Accused" ],
      [ "Cher", 1987, "Moonstruck" ],
      [ "Marlee Matlin", 1986, "Children of a Lesser God" ],
      [ "Geraldine Page", 1985, "Trip to Bountiful" ],
      [ "Sally Field", 1984, "Places in the Heart" ],
      [ "Shirley Maclaine", 1983, "Terms of Endearment" ],
      [ "Meryl Streep", 1982, "Sophie's Choice" ],
      [ "Katherine Hepburn", 1981, "On Golden Pond" ],
      [ "Cissy Spacek", 1980, "Coal Miner's Daughter" ],
      [ "Sally Field", 1979, "Norma Rae" ],
      [ "Jane Fonda", 1978, "Coming Home" ],
      [ "Diane Keaton", 1977, "Annie Hall" ],
      [ "Faye Dunaway", 1976, "Network" ],
      [ "Louise Fletcher", 1975, "One Flew Over the Cuckoo's Nest" ],
      [ "Ellen Burstyn", 1974, "Alice Doesn't Live Here Anymore" ],
      [ "Glenda Jackson", 1973, "A Touch of Class" ],
      [ "Liza Minelli", 1972, "Caberet" ],
      [ "Jane Fonda ", 1971, "Klute" ],
      [ "Glenda Jackson", 1970, "Women in Love" ]
    ],
    'Need to add more actresses here I know, coming soon...'
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
    ],
    'Think I have all of these in now'
  ],
  [
    "UK and Ireland IATA codes",
    [
      [ "RAF Abingdon", "ABB" ],
      [ "Aberdeen Dyce", "ABZ" ],
      [ "Andover Airfield", "ADV" ],
      [ "RAF Leuchars", "ADX" ],
      [ "Bembridge", "BBP" ],
      [ "Blackbushe", "BBS" ],
      [ "Benbecula", "BEB" ],
      [ "RAF Honington", "BEQ" ],
      [ "RAF Benson", "BEX" ],
      [ "Belfast International", "BFS" ],
      [ "George Best Belfast City", "BHD" ],
      [ "Birmingham", "BHX" ],
      [ "Birmingham International", "BHX" ],
      [ "Blackpool International", "BLK" ],
      [ "Belmullet Aerodrome", "BLY" ],
      [ "Bournemouth", "BOH" ],
      [ "Ballykelly", "BOL" ],
      [ "London Biggin Hill", "BQH" ],
      [ "Barra", "BRR" ],
      [ "Barra", "BRR", '(the famous tidal beach landing)' ],
      [ "Bristol International", "BRS" ],
      [ "Barrow Walney Island", "BWF" ],
      [ "Bantry Aerodrome", "BYT" ],
      [ "RAF Brize Norton", "BZZ" ],
      [ "Campbeltown", "CAL" ],
      [ "Carlisle", "CAX" ],
      [ "Cambrigde", "CBG" ],
      [ "Hawarden", "CEG" ],
      [ "Donegal", "CFN", "(Carrickfin)" ],
      [ "Reeroe", "CHE" ],
      [ "Castlebar", "CLB" ],
      [ "Coll", "COL" ],
      [ "Colonsay Airstrip", "CSA" ],
      [ "Coventry - Baginton", "CVT" ],
      [ "Cardiff International", "CWL" ],
      [ "Sheffield, Doncaster, Robin Hood International", "DCS" ],
      [ "MOD St. Athan", "DGX" ],
      [ "Dundee", "DND" ],
      [ "Dornoch", "DOC" ],
      [ "Robin Hood Doncaster Sheffield", "DSA" ],
      [ "Dublin", "DUB" ],
      [ "Edinburgh", "EDI" ],
      [ "Nottingham - East Midlands", "EMA" ],
      [ "St Angelo", "ENK" ],
      [ "Eday", "EOI" ],
      [ "Shoreham", "ESH" ],
      [ "Elstree Airfield", "ETR" ],
      [ "Exeter International", "EXT" ],
      [ "Farnborough", "FAB" ],
      [ "RAF Fairford", "FFD" ],
      [ "Fair Isle (Shetland)", "FIE" ],
      [ "Flotta Isle", "FLH" ],
      [ "Foula (Shetland)", "FOU" ],
      [ "Fairoaks", "FRK" ],
      [ "RAF Kinloss", "FSS" ],
      [ "Bristol Filton", "FZO" ],
      [ "Glasgow International", "GLA" ],
      [ "Gloucestershire", "GLO" ],
      [ "Binbrook Airfield", "GSY" ],
      [ "Galway", "GWY" ],
      [ "Haverfordwest", "HAW" ],
      [ "Anglesey", "HLY" ],
      [ "RAF Linton-On-Ouse", "HRT" ],
      [ "Humberside", "HUY" ],
      [ "Inishmaan Aerodrome", "IIA" ],
      [ "Islay", "ILY" ],
      [ "Inisheer Aerodrome", "INQ" ],
      [ "Inverness", "INV" ],
      [ "Kilronan", "IOR", "AKA Inishmore Aerodrome" ],
      [ "St. Mary's", "ISC" ],
      [ "Kerry County", "KIR" ],
      [ "Kilkenny", "KKY" ],
      [ "Orkney - Kirkwall", "KOI" ],
      [ "Redhill Aerodrome", "KRH" ],
      [ "Leeds Bradford", "LBA" ],
      [ "London - City", "LCY" ],
      [ "Derry (Londonderry)", "LDY" ],
      [ "Land's End", "LEQ" ],
      [ "London - Gatwick", "LGW" ],
      [ "London - Heathrow", "LHR" ],
      [ "RAF Lakenheath", "LKZ" ],
      [ "RAF Lossiemouth", "LMO" ],
      [ "Liverpool John Lennon", "LPL" ],
      [ "Land's End", "LQE" ],
      [ "Sumburgh (Shetland)", "LSI" ],
      [ "London - Luton", "LTN" ],
      [ "Letterkenny", "LTR" ],
      [ "Lerwick / Tingwall (Shetland Islands)", "LWK" ],
      [ "RAF Lyneham", "LYE" ],
      [ "Lydd International", "LYX" ],
      [ "Manchester", "MAN" ],
      [ "RAF Mildenhall", "MHZ" ],
      [ "Durham Tees Valley", "MME" ],
      [ "RAF Marham", "MRH" ],
      [ "Kent (Manston) Kent International", "MSE", "Manston" ],
      [ "Newcastle", "NCL" ],
      [ "Sanday", "NDY" ],
      [ "RAF Northolt", "NHT" ],
      [ "Connemara Regional", "NNR" ],
      [ "Knock", "NOC", "Ireland West Knock" ],
      [ "Nottingham", "NQT" ],
      [ "Newquay", "NQY" ],
      [ "North Ronaldsay", "NRL" ],
      [ "Norwich International", "NWI" ],
      [ "Oban", "OBN" ],
      [ "RAF Odiham", "ODH" ],
      [ "RAF Cottesmore", "OKH" ],
      [ "Cork", "ORK" ],
      [ "Sywell Aerodrome", "ORM" ],
      [ "Out Skerries (Shetland)", "OUK" ],
      [ "Oxford (Kidlington)", "OXF" ],
      [ "Glasgow Prestwick", "PIK" ],
      [ "Plymouth City", "PLH" ],
      [ "Papa Westray", "PPW" ],
      [ "Perth / Scone", "PSL" ],
      [ "Papa Stour", "PSV" ],
      [ "Penzance Heliport", "PZE" ],
      [ "RAF Coningsby", "QCY" ],
      [ "Duxford", "QFO" ],
      [ "Lasham", "QLA" ],
      [ "Chichester / Goodwood", "QUG" ],
      [ "RAF Wyton", "QUY" ],
      [ "Rochester", "RCS" ],
      [ "Scatsta", "SCS" ],
      [ "Southend", "SEN" ],
      [ "Skye Bridge Ashaig", "SKL" ],
      [ "Shannon (Limerick)", "SNN" ],
      [ "Southampton - Eastleigh", "SOU" ],
      [ "Stronsay", "SOY" ],
      [ "RAF Scampton", "SQZ" ],
      [ "London - Stansted", "STN" ],
      [ "Swansea", "SWS" ],
      [ "Sligo", "SXL" ],
      [ "Stornoway", "SYY" ],
      [ "Sheffield City", "SZD" ],
      [ "Sheffield City Heliport", "SZE" ],
      [ "Tiree", "TRE" ],
      [ "Glenforsa Airfield", "ULL" ],
      [ "Unst", "UNT" ],
      [ "Waterford", "WAT" ],
      [ "Castlebridge", "WEX" ],
      [ "Whalsay", "WHS" ],
      [ "Wick", "WIC" ],
      [ "Wick", "WIC" ],
      [ "Westray", "WRY" ],
      [ "RAF Waddington", "WTN" ],
      [ "Wethersfield", "WXF" ],
      [ "Manchester Woodford", "XXB" ],
      [ "RNAS Yeovilton", "YEO" ]
    ],
    "OK, not dates this one but something that does come up in the quiz that we do..."
  ]
];

