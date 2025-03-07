const http = require('node:http');

const options = {};

http.createServer(options, (req, res) => {
 res.writeHead(200, {});
 res.end(`Trust me, I'm a server! 🤖\n`);
}).listen(3000, () => {
 console.log('Server is running on port 3000');
});
