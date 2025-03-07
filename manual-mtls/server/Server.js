const https = require('node:https');
const fs = require('fs');

const options = {
 key: fs.readFileSync('./server.key'), // encrypt the server's communication 
 cert: fs.readFileSync('./server.crt'), // verify the server’s identity
 ca: [ // this is the cert the server can trust 
   fs.readFileSync('./client.crt'),
 ],
 requestCert: true, // the client must present cert before communication can happen (enables mTLS)
 passphrase: 'hello' // passphrase I used to generate the keys 
};

// now listening on https (not http)
https.createServer(options, (req, res) => {
 res.writeHead(200, {});
 res.end('Trust me, I\'m a server! 🤖\n');
}).listen(3000, () => {
 console.log('Server is running on port 3000');
});
