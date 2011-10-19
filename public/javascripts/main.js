$( function () {
  console.log( location );
  var socket = io.connect( 'http://' + location.host, { rememberTransport: false } );
  socket.on( 'answer', function ( data ) {
    console.log( 'Got an answer: ' + JSON.stringify( data ));
    $('.messages').append( '<p>' + JSON.stringify( data ) + '</p>' );
  } );
} );

