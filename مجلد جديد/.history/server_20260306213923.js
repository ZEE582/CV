const http = require('http');

const server = http.createServer((req, res) => {

    res.setHeader('Content-Type', 'text/html');
    res.writeHead('<h1>Hello World</h1><p>12428987</p>');

    const path= req.url;

});


const PORT = 3000;
server.listen(PORT, () => {
    console.log('Server running on port' + PORT);
});
