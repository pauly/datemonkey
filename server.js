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
  }
  this.year = function () {
    var d = this._question[1];
    if ( new String( d ).match( /\d{3,4}/ )){
      return d;
    }
    d = new Date( d );
    return d.getFullYear ? d.getFullYear() : false;
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
  return a.sort( function () { return Math.random() > 0.5 } );
};

var multipleChoices = 3;

// Generate a multiple choice input for a question, in a category
var options = function ( c, q ) {
  var question = data[c][1][q];
  var all = shuffle( data[c][1].slice( 0 ));
  var answers = [ question ];
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
      taken: req.query.taken ? parseInt( req.query.taken ) : 0
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
  }
  if ( req.query && req.query.answer && data[req.query.c] && data[req.query.c][1][req.query.q] ) {
    r.hidden.correct = parseInt( req.query.correct || 0 );
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
  ],
  [
    "Periodic table",
    [
      [ "Hydrogen", "H", "Atomic number 1"],
      [ "Helium", "He", "Atomic number 2"],
      [ "Lithium", "Li", "Atomic number 3"],
      [ "Beryllium", "Be", "Atomic number 4"],
      [ "Boron", "B", "Atomic number 5"],
      [ "Carbon", "C", "Atomic number 6"],
      [ "Nitrogen", "N", "Atomic number 7"],
      [ "Oxygen", "O", "Atomic number 8"],
      [ "Fluorine", "F", "Atomic number 9"],
      [ "Neon", "Ne", "Atomic number 10"],
      [ "Sodium", "Na", "Atomic number 11"],
      [ "Magnesium", "Mg", "Atomic number 12"],
      [ "Aluminium", "Al", "Atomic number 13"],
      [ "Silicon", "Si", "Atomic number 14"],
      [ "Phosphorus", "P", "Atomic number 15"],
      [ "Sulfur", "S", "Atomic number 16"],
      [ "Chlorine", "Cl", "Atomic number 17"],
      [ "Argon", "Ar", "Atomic number 18"],
      [ "Potassium", "K", "Atomic number 19"],
      [ "Calcium", "Ca", "Atomic number 20"],
      [ "Scandium", "Sc", "Atomic number 21"],
      [ "Titanium", "Ti", "Atomic number 22"],
      [ "Vanadium", "V", "Atomic number 23"],
      [ "Chromium", "Cr", "Atomic number 24"],
      [ "Manganese", "Mn", "Atomic number 25"],
      [ "Iron", "Fe", "Atomic number 26"],
      [ "Cobalt", "Co", "Atomic number 27"],
      [ "Nickel", "Ni", "Atomic number 28"],
      [ "Copper", "Cu", "Atomic number 29"],
      [ "Zinc", "Zn", "Atomic number 30"],
      [ "Gallium", "Ga", "Atomic number 31"],
      [ "Germanium", "Ge", "Atomic number 32"],
      [ "Arsenic", "As", "Atomic number 33"],
      [ "Selenium", "Se", "Atomic number 34"],
      [ "Bromine", "Br", "Atomic number 35"],
      [ "Krypton", "Kr", "Atomic number 36"],
      [ "Rubidium", "Rb", "Atomic number 37"],
      [ "Strontium", "Sr", "Atomic number 38"],
      [ "Yttrium", "Y", "Atomic number 39"],
      [ "Zirconium", "Zr", "Atomic number 40"],
      [ "Niobium", "Nb", "Atomic number 41"],
      [ "Molybdenum", "Mo", "Atomic number 42"],
      [ "Technetium", "Tc", "Atomic number 43"],
      [ "Ruthenium", "Ru", "Atomic number 44"],
      [ "Rhodium", "Rh", "Atomic number 45"],
      [ "Palladium", "Pd", "Atomic number 46"],
      [ "Silver", "Ag", "Atomic number 47"],
      [ "Cadmium", "Cd", "Atomic number 48"],
      [ "Indium", "In", "Atomic number 49"],
      [ "Tin", "Sn", "Atomic number 50"],
      [ "Antimony", "Sb", "Atomic number 51"],
      [ "Tellurium", "Te", "Atomic number 52"],
      [ "Iodine", "I", "Atomic number 53"],
      [ "Xenon", "Xe", "Atomic number 54"],
      [ "Caesium", "Cs", "Atomic number 55"],
      [ "Barium", "Ba", "Atomic number 56"],
      [ "Lanthanum", "La", "Atomic number 57"],
      [ "Cerium", "Ce", "Atomic number 58"],
      [ "Praseodymium", "Pr", "Atomic number 59"],
      [ "Neodymium", "Nd", "Atomic number 60"],
      [ "Promethium", "Pm", "Atomic number 61"],
      [ "Samarium", "Sm", "Atomic number 62"],
      [ "Europium", "Eu", "Atomic number 63"],
      [ "Gadolinium", "Gd", "Atomic number 64"],
      [ "Terbium", "Tb", "Atomic number 65"],
      [ "Dysprosium", "Dy", "Atomic number 66"],
      [ "Holmium", "Ho", "Atomic number 67"],
      [ "Erbium", "Er", "Atomic number 68"],
      [ "Thulium", "Tm", "Atomic number 69"],
      [ "Ytterbium", "Yb", "Atomic number 70"],
      [ "Lutetium", "Lu", "Atomic number 71"],
      [ "Hafnium", "Hf", "Atomic number 72"],
      [ "Tantalum", "Ta", "Atomic number 73"],
      [ "Tungsten", "W", "Atomic number 74"],
      [ "Rhenium", "Re", "Atomic number 75"],
      [ "Osmium", "Os", "Atomic number 76"],
      [ "Iridium", "Ir", "Atomic number 77"],
      [ "Platinum", "Pt", "Atomic number 78"],
      [ "Gold", "Au", "Atomic number 79"],
      [ "Mercury", "Hg", "Atomic number 80"],
      [ "Thallium", "Tl", "Atomic number 81"],
      [ "Lead", "Pb", "Atomic number 82"],
      [ "Bismuth", "Bi", "Atomic number 83"],
      [ "Polonium", "Po", "Atomic number 84"],
      [ "Astatine", "At", "Atomic number 85"],
      [ "Radon", "Rn", "Atomic number 86"],
      [ "Francium", "Fr", "Atomic number 87"],
      [ "Radium", "Ra", "Atomic number 88"],
      [ "Actinium", "Ac", "Atomic number 89"],
      [ "Thorium", "Th", "Atomic number 90"],
      [ "Protactinium", "Pa", "Atomic number 91"],
      [ "Uranium", "U", "Atomic number 92"],
      [ "Neptunium", "Np", "Atomic number 93"],
      [ "Plutonium", "Pu", "Atomic number 94"],
      [ "Americium", "Am", "Atomic number 95"],
      [ "Curium", "Cm", "Atomic number 96"],
      [ "Berkelium", "Bk", "Atomic number 97"],
      [ "Californium", "Cf", "Atomic number 98"],
      [ "Einsteinium", "Es", "Atomic number 99"],
      [ "Fermium", "Fm", "Atomic number 100"],
      [ "Mendelevium", "Md", "Atomic number 101"],
      [ "Nobelium", "No", "Atomic number 102"],
      [ "Lawrencium", "Lr", "Atomic number 103"],
      [ "Rutherfordium", "Rf", "Atomic number 104"],
      [ "Dubnium", "Db", "Atomic number 105"],
      [ "Seaborgium", "Sg", "Atomic number 106"],
      [ "Bohrium", "Bh", "Atomic number 107"],
      [ "Hassium", "Hs", "Atomic number 108"],
      [ "Meitnerium", "Mt", "Atomic number 109"],
      [ "Darmstadtium", "Ds", "Atomic number 110"],
      [ "Roentgenium", "Rg", "Atomic number 111"],
      [ "Copernicium", "Cn", "Atomic number 112"],
      [ "Ununtrium", "Uut", "Atomic number 113"],
      [ "Ununquadium", "Uuq", "Atomic number 114"],
      [ "Ununpentium", "Uup", "Atomic number 115"],
      [ "Ununhexium", "Uuh", "Atomic number 116"],
      [ "Ununseptium", "Uus", "Atomic number 117"],
      [ "Ununoctium", "Uuo", "Atomic number 118"],
    ],
    "Again not dates, maybe I should change the name of this quiz..?"
  ],
  [
    "English monarchs",
    [
      [ "Offa", 774, 796 ],
      [ "Egbert", 802, 839 ],
      [ "Aethelwulf", 839, 856 ],
      [ "Aethelbald", 856, 860 ],
      [ "Aethelberht", 860, 865 ],
      [ "Aethelred", 865, 871 ],
      [ "Alfred the Great", 871, 899 ],
      [ "Edward the Elder", 899, 924 ],
      [ "Aethelstan the Glorious", 924, 939 ],
      [ "Edmund the Magnificent", 939, 946 ],
      [ "Eadred", 946, 955 ],
      [ "Eadwig", 955, 959 ],
      [ "Edgar the Peaceful", 959, 975 ],
      [ "Saint Edward the Martyr", 975, 978 ],
      [ "Aethelred the Unready", 978, 1013 ],
      [ "Sweyn Forkbeard", 1013, 1014 ],
      [ "Aethelred the Ill-Advised", 1014, 1016, "Aethelred the Unready's second reign" ],
      [ "Edmund Ironside", 1016, 1016 ],
      [ "Cnut", 1016, 1035 ],
      [ "Harold Harefoot", 1035, 1040 ],
      [ "Harthacnut", 1040, 1042 ],
      [ "Saint Edward the Confesssor", "1042-06-09", "1066-01-05" ],
      [ "Harold Godwinson", "1066-01-06", "1066-10-14" ],
      // [ "Edgar the Aetheling", "1066-10-15", "1066-12-17", "Proclaimed but never crowned" ],
      [ "William I", "1066-12-25", "1087-09-25" ],
      [ "William II", "1087-09-26", "1100-08-04" ],
      [ "Henry I", "1100-08-05", "1135-12-21" ],
      [ "Stephen", "1135-12-22", "1154-12-18" ],
      [ "Henry II", "1154-12-19", "1170-06-13" ],
      // [ "Henry the Young King", "1170", "1183" ],
      [ "Richard I", "1189-09-03", "1199-05-26", "Richard the Lion Heart" ],
      [ "John", "1199-05-27", "1216-10-27" ],
      [ "Henry III", "1216-10-28", "1272-11-19" ],
      [ "Edward I", "1272-11-20", "1307-07-06", "Longshanks" ],
      [ "Edward II", "1307-07-07", "1327-01-24" ],
      [ "Edward III", "1327-01-25", "1377-06-20" ],
      [ "Richard II", "1377-06-21", "1399-09-29" ],
      [ "Henry IV", "1399-09-30", "1413-03-19" ],
      [ "Henry V", "1413-03-20", "1422-08-30" ],
      [ "Henry VI", "1422-08-31", "1461-03-04" ],
    ],
    "From http://en.wikipedia.org/wiki/List_of_English_monarchs"
  ]
];
// initialise
for ( c in data ) {
  for ( q in data[c][1] ) {
    data[c][1][q] = new Question( data[c][1][q] );
  }
}
