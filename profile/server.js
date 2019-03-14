//import the http module//
const http = require('http');
//set the port //
const port = process.env.PORT || 4800;

// import the middleware files//
const app = require('./app')

//create server//
const server = http.createServer(app);

server.listen(port);

console.log("server is lisenting the port no." +port);