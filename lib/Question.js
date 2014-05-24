var Question = module.exports = function ( question, data ) {
  if ( question && question._question ) return question; // already been done
  this._question = question;
  this.wrongAnswers = question[3] || null;
  this._clues = null;
  this.clues = function ( ) {
    if ( this._clues !== null ) return this._clues;
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
  this.question = function ( ) {
    return this._question[1];
  };
  this.year = function ( ) {
    var d = this.question( );
    if (( '' + d ).match( /^[A-Za-z]/ )) return null; // not a date at all!
    if (( '' + d ).match( /^\d{3,4}$/ )) return d / 1; // looks like a year
    d = new Date( d );
    return d.getFullYear ? d.getFullYear( ) : null;
  };
  this.answer = function ( ) {
    return this._question[0];
  };
  this.firstChars = function ( c ) {
    return this.answer( ).toLowerCase( ).substr( 0, c );
  };
  this.trivia = function ( ) {
    return this._question[2];
  };
  // Is answer b like answer a (but not equal to)? Is it within range c?
  this.like = function ( b, c ) {
    if ( this.answer( ) == b.answer( )) return false;
    if ( ! c ) return true;
    if ( this.year( ) && b.year( )) {
      if ( this.year( ) == b.year( )) {
        console.log( this.year( ), '==', b.year( ), 'too confusing' );
        return false;
      }
      return Math.abs( this.year( ) - b.year( )) <= c;
    }
    return this.firstChars( c ) == b.firstChars( c );
  };
  this.randomWrongAnswer = function ( ) {
    if ( ! this.wrongAnswers ) return null;
    console.log( 'random wrong answer from', this.wrongAnswers );
    var randomIndex = Math.floor( Math.random( ) * this.wrongAnswers.length );
    return new Question( [ this.wrongAnswers[ randomIndex ]] );
  }
};

