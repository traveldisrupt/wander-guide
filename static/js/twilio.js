// $(function () {
//   log('Requesting Capability Token!');
//   $.getJSON('http://api.wander.host/api/1/twilio/token/')
//     .done(function (data) {
//       // log('Got a token.');
//       console.log('Token: ' + data.token);

//       // Setup Twilio.Device
//       // Twilio.Device.setup(data.token);

//       // Twilio.Device.ready(function (device) {
//       //   log('Twilio.Device Ready!');
//       //   document.getElementById('call-controls').style.display = 'block';
//       // });

//       // Twilio.Device.error(function (error) {
//       //   log('Twilio.Device Error: ' + error.message);
//       // });

//       // Twilio.Device.connect(function (conn) {
//       //   log('Successfully established call!');
//       //   document.getElementById('button-call').style.display = 'none';
//       //   document.getElementById('button-hangup').style.display = 'inline';
//       // });

//       // Twilio.Device.disconnect(function (conn) {
//       //   log('Call ended.');
//       //   document.getElementById('button-call').style.display = 'inline';
//       //   document.getElementById('button-hangup').style.display = 'none';
//       // });
//     })
// });
