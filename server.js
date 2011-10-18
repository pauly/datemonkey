/**
 * Test yourself on dates, an experiment in nodejs
 * 
 * @author  PC <paul.clarke+paulclarke@holidayextras.com>
 * @date    Mon 17 Oct 2011 18:27:10 BST
 */

var title = 'Date monkey',
  express = require('express'),
  app = module.exports = express.createServer();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

var shuffle = function ( a ) {
  return a.sort( function () { return Math.random() > 0.5 } );
};

var multipleChoices = 3;

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
var multipleAnswersOneCategory = function ( c, q ) {
  var r = '';
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
  // console.log( answers );
  for ( i in shuffle( answers )) {
    r += '<button name="answer" type="submit" value="' + answers[i][0] + '"><span>' + answers[i][0] + '</span></button> ';
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
  r += '<form><input type="hidden" name="taken" value="' + ( req.query.taken ||  0 ) + '" /><input type="hidden" name="correct" value="' + ( req.query.correct ||  0 ) + '" /><input type="hidden" name="c" value="' + c + '" /><input type="hidden" name="q" value="' + q + '" />';
  r += data[c][0] + ' ' + data[c][1][q][1] + '? ' + input( c, q );
  r += '</form>';
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
    title: title + '- question',
    content: question( req, res )
  } );
} );

app.all( '/random', function( req, res ) {
  res.render( 'question.jade', {
    siteTitle: title,
    title: title + '- question',
    content: question( req, res )
  } );
} );

app.listen( 12248 );
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

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
  ],
  [
    "UK and Ireland IATA codes",
    [
[ "Cork", "ORK" ],                                                   
 [ "Donegal (Carrickfin)", "CFN" ],                                   
 [ "Dublin", "DUB" ],                                                 
 [ "Galway", "GWY" ],                                                 
 [ "Kerry County", "KIR" ],                                           
 [ "Knock", "NOC" ],                                                  
 [ "Shannon (Limerick)", "SNN" ],                                     
 [ "Sligo", "SXL" ],                                                  
 [ "Bantry Aerodrome", "BYT" ],                                       
 [ "Belmullet Aerodrome", "BLY" ],                                    
 [ "Connemara Regional Airport", "NNR" ],                             
 [ "Castlebar Airport", "CLB" ],                                      
 [ "Castlebridge Airport", "WEX" ],                                   
 [ "Cork Airport", "ORK" ],                                           
 [ "Galway Airport", "GWY" ],                                         
 [ "Donegal Airport", "CFN" ],                                        
 [ "Dublin Airport", "DUB" ],                                         
 [ "Inishmore Aerodrome", "IOR" ],                                    
 [ "Inisheer Aerodrome", "INQ" ],                                     
 [ "Kilkenny Airport", "KKY" ],                                       
 [ "Ireland West Knock Airport", "NOC" ],                             
 [ "Kerry Airport", "KIR" ],                                          
 [ "Letterkenny Airport", "LTR" ],                                    
 [ "Inishmaan Aerodrome", "IIA" ],                                    
 [ "Shannon Airport", "SNN" ],                                        
 [ "Sligo Airport", "SXL" ],                                          
 [ "Waterford Airport", "WAT" ],                                      
 [ "Kilronan Airport", "IOR" ],                                       
 [ "Reeroe Airport", "CHE" ],                                         
 [ "Aberdeen", "ABZ" ],                                               
 [ "Barra (the famous tidal beach landing)", "BRR" ],                 
 [ "Belfast - Harbour", "BHD" ],                                      
 [ "Belfast International", "BFS" ],                                  
 [ "Benbecula", "BEB" ],                                              
 [ "Birmingham", "BHX" ],                                             
 [ "Blackpool", "BLK" ],                                              
 [ "Bournemouth", "BOH" ],                                            
 [ "Bristol", "BRS" ],                                                
 [ "Cambrigde", "CBG" ],                                              
 [ "Campbeltown", "CAL" ],                                            
 [ "Cardiff International Airport", "CWL" ],                          
 [ "Coventry - Baginton", "CVT" ],                                    
 [ "Derry (Londonderry)", "LDY" ],                                    
 [ "Doncaster, Robin Hood International Airport", "DCS" ],            
 [ "Dundee", "DND" ],                                                 
 [ "Exeter", "EXT" ],                                                 
 [ "Fair Isle (Shetland)", "FIE" ],                                   
 [ "Foula (Shetland)", "FOU" ],                                       
 [ "Glasgow", "GLA" ],                                                
 [ "Glasgow, Prestwick", "PIK" ],                                     
 [ "Humberside", "HUY" ],                                             
 [ "Inverness", "INV" ],                                              
 [ "Islay", "ILY" ],                                                  
 [ "Kent (Manston) Kent International", "MSE" ],                      
 [ "Kirkwall (Orkney)", "KOI" ],                                      
 [ "Land's End", "LQE" ],                                             
 [ "Leeds/Bradford", "LBA" ],                                         
 [ "Lerwick/Tingwall (Shetland Islands)", "LWK" ],                    
 [ "Liverpool", "LPL" ],                                              
 [ "London - City Airport", "LCY" ],                                  
 [ "London - Gatwick", "LGW" ],                                       
 [ "London - Heathrow", "LHR" ],                                      
 [ "London - Luton", "LTN" ],                                         
 [ "London - Stansted", "STN" ],                                      
 [ "London Metropolitan Area", "LON" ],                               
 [ "Londonderry - Eglinton", "LDY" ],                                 
 [ "Manchester", "MAN" ],                                             
 [ "Newcastle", "NCL" ],                                              
 [ "Newquay", "NQY" ],                                                
 [ "Norwich", "NWI" ],                                                
 [ "Nottingham - East Midlands", "EMA" ],                             
 [ "Orkney - Kirkwall", "KOI" ],                                      
 [ "Out Skerries (Shetland)", "OUK" ],                                
 [ "Sheffield, City Airport", "SZD" ],                                
 [ "Sheffield, Doncaster, Robin Hood International Airport", "DCS" ], 
 [ "Southampton - Eastleigh", "SOU" ],                                
 [ "Southend", "SEN" ],                                               
 [ "Stansted (London)", "STN" ],                                      
 [ "Stornway", "SYY" ],                                               
 [ "Sumburgh (Shetland)", "LSI" ],                                    
 [ "Teesside, Durham Tees Valley", "MME" ],                           
 [ "Unst (Shetland Island) - Baltasound Airport", "UNT" ],            
 [ "Wick", "WIC" ],                                                   
 [ "Belfast International Airport", "BFS" ],                          
 [ "St Angelo Airport", "ENK" ],                                      
 [ "George Best Belfast City Airport", "BHD" ],                       
 [ "City of Derry Airport", "LDY" ],                                  
 [ "Birmingham International Airport", "BHX" ],                       
 [ "Coventry Airport", "CVT" ],                                       
 [ "Gloucestershire Airport", "GLO" ],                                
 [ "Sywell Aerodrome", "ORM" ],                                       
 [ "Nottingham Airport", "NQT" ],                                     
 [ "Manchester Airport", "MAN" ],                                     
 [ "Manchester Woodford Airport", "XXB" ],                            
 [ "Robin Hood Doncaster Sheffield Airport", "DSA" ],                 
 [ "RAF Lyneham", "LYE" ],                                            
 [ "MOD St. Athan", "DGX" ],                                          
 [ "RNAS Yeovilton", "YEO" ],                                         
 [ "Campbeltown Airport", "CAL" ],                                    
 [ "Eday Airport", "EOI" ],                                           
 [ "Fair Isle Airport", "FIE" ],                                      
 [ "Whalsay Airport", "WHS" ],                                        
 [ "Coll Airport", "COL" ],                                           
 [ "North Ronaldsay Airport", "NRL" ],                                
 [ "Oban Airport", "OBN" ],                                           
 [ "Papa Westray Airport", "PPW" ],                                   
 [ "Stronsay Airport", "SOY" ],                                       
 [ "Sanday Airport", "NDY" ],                                         
 [ "Lerwick / Tingwall Airport", "LWK" ],                             
 [ "Westray Airport", "WRY" ],                                        
 [ "Colonsay Airstrip", "CSA" ],                                      
 [ "Haverfordwest Airport", "HAW" ],                                  
 [ "Cardiff International Airport", "CWL" ],                          
 [ "Swansea Airport", "SWS" ],                                        
 [ "Bristol International Airport", "BRS" ],                          
 [ "Liverpool John Lennon Airport", "LPL" ],                          
 [ "London Luton Airport", "LTN" ],                                   
 [ "Land's End Airport", "LEQ" ],                                     
 [ "Plymouth City Airport", "PLH" ],                                  
 [ "St. Mary's Airport", "ISC" ],                                     
 [ "Bournemouth Airport", "BOH" ],                                    
 [ "Southampton Airport", "SOU" ],                                    
 [ "Bembridge Airport", "BBP" ],                                      
 [ "Penzance Heliport", "PZE" ],                                      
 [ "Lasham Airport", "QLA" ],                                         
 [ "Newquay Cornwall Airport", "NQY" ],                               
 [ "Chichester/Goodwood Airport", "QUG" ],                            
 [ "Shoreham Airport", "ESH" ],                                       
 [ "London Biggin Hill Airport", "BQH" ],                             
 [ "London Gatwick Airport", "LGW" ],                                 
 [ "Redhill Aerodrome", "KRH" ],                                      
 [ "London City Airport", "LCY" ],                                    
 [ "Farnborough Airport", "FAB" ],                                    
 [ "Blackbushe Airport", "BBS" ],                                     
 [ "London Heathrow Airport", "LHR" ],                                
 [ "Southend Airport", "SEN" ],                                       
 [ "Lydd Airport", "LYX" ],                                           
 [ "Kent International Airport", "MSE" ],                             
 [ "Carlisle Airport", "CAX" ],                                       
 [ "Blackpool International Airport", "BLK" ],                        
 [ "Humberside Airport", "HUY" ],                                     
 [ "Barrow Walney Island Airport", "BWF" ],                           
 [ "Leeds Bradford Airport", "LBA" ],                                 
 [ "Hawarden Airport", "CEG" ],                                       
 [ "Newcastle Airport", "NCL" ],                                      
 [ "Durham Tees Valley Airport", "MME" ],                             
 [ "East Midlands Airport", "EMA" ],                                  
 [ "Anglesey Airport", "HLY" ],                                       
 [ "Kirkwall Airport", "KOI" ],                                       
 [ "Sumburgh Airport", "LSI" ],                                       
 [ "Wick Airport", "WIC" ],                                           
 [ "Inverness Airport", "INV" ],                                      
 [ "Glasgow International Airport", "GLA" ],                          
 [ "Edinburgh Airport", "EDI" ],                                      
 [ "Islay Airport", "ILY" ],                                          
 [ "Glasgow Prestwick Airport", "PIK" ],                              
 [ "Benbecula Airport", "BEB" ],                                      
 [ "Scatsta Airport", "SCS" ],                                        
 [ "Dundee Airport", "DND" ],                                         
 [ "Stornoway Airport", "SYY" ],                                      
 [ "Barra Airport", "BRR" ],                                          
 [ "Perth/Scone Airport", "PSL" ],                                    
 [ "Tiree Airport", "TRE" ],                                          
 [ "Unst Airport", "UNT" ],                                           
 [ "Ballykelly Airport", "BOL" ],                                     
 [ "RAF Kinloss", "FSS" ],                                            
 [ "RAF Leuchars", "ADX" ],                                           
 [ "RAF Lossiemouth", "LMO" ],                                        
 [ "Cambridge Airport", "CBG" ],                                      
 [ "Norwich International Airport", "NWI" ],                          
 [ "London Stansted Airport", "STN" ],                                
 [ "Duxford Airport", "QFO" ],                                        
 [ "Sheffield City Heliport", "SZE" ],                                
 [ "Exeter International Airport", "EXT" ],                           
 [ "Fairoaks Airport", "FRK" ],                                       
 [ "Bristol Filton Airport", "FZO" ],                                 
 [ "Oxford (Kidlington) Airport", "OXF" ],                            
 [ "Rochester Airport", "RCS" ],                                      
 [ "Elstree Airfield", "ETR" ],                                       
 [ "RAF Benson", "BEX" ],                                             
 [ "RAF Abingdon", "ABB" ],                                           
 [ "RAF Lakenheath", "LKZ" ],                                         
 [ "RAF Mildenhall", "MHZ" ],                                         
 [ "RAF Wyton", "QUY" ],                                              
 [ "RAF Fairford", "FFD" ],                                           
 [ "RAF Brize Norton", "BZZ" ],                                       
 [ "RAF Odiham", "ODH" ],                                             
 [ "Wethersfield Airport", "WXF" ],                                   
 [ "Andover Airfield", "ADV" ],                                       
 [ "RAF Northolt", "NHT" ],                                           
 [ "Binbrook Airfield", "GSY" ],                                      
 [ "RAF Coningsby", "QCY" ],                                          
 [ "RAF Honington", "BEQ" ],                                          
 [ "RAF Cottesmore", "OKH" ],                                         
 [ "RAF Scampton", "SQZ" ],                                           
 [ "RAF Linton-On-Ouse", "HRT" ],                                     
 [ "RAF Waddington", "WTN" ],                                         
 [ "RAF Marham", "MRH" ],                                             
 [ "Dornoch Airport", "DOC" ],                                        
 [ "Flotta Isle Airport", "FLH" ],                                    
 [ "Foula Airport", "FOA" ],                                          
 [ "Outer Skerries Airport", "OUK" ],                                 
 [ "Papa Stour Airport", "PSV" ],                                     
 [ "Glenforsa Airfield", "ULL" ],                                     
      [ "Skye Bridge Ashaig Airport", "SKL" ]
    ]
  ]
];

