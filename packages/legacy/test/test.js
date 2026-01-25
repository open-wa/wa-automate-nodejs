import test from 'ava';

 test.todo('Create a client with 0 params')
 test.todo('Create a client with 1 params [session id string]')
 test.todo('Create a client with 1 params [config only]')
 test.todo('Create a client with 2 params')

 /**
  * Logout states
  */
 test.todo('Restart existing session')
 test.todo('Logout and detect logout event')
 test.todo('Restart existing session, expect QR code')
 test.todo('create fresh session, expect QR code')
 test.todo('create fresh session, wait 60 seconds, expect QR code')


 test.todo('Check if can send message')
 test.todo('Check licensed features')
 test.todo('Create a client with license')

 
test.todo('Set up 2 accounts. Marco & Polo');

/**
 * Marco will test sending functions, Polo will test callbacks/events
 */

test.todo('Received Ack Event')
test.todo('Received State Event')
test.todo('Received AnyMessage Event')
test.todo('Received Battery Event')
test.todo('Received ChatState Event')
test.todo('Received ParticipantChanged Event')
test.todo('Received Message Event')
test.todo('Received Story Event')

test.todo('Send Text')
test.todo('Send Image')
test.todo('Send Video')
test.todo('Send Location')
test.todo('Send Sticker')
test.todo('Send Instagram link preview')
test.todo('etc..')