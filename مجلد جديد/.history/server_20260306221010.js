const http = require('http');

const fs = require('fs');

console.log(fs)

const server = http.createServer((req, res) => {


    res.setHeader('Content-Type', 'text/html');
    res.writeHead('<h1>Hello World</h1><p>12428987</p>');

    const path= req.url;

});

fs.readFile('js.HTML', 'utf8', (err, data) => {

    if (err) {
        console.error(err);
        return;
    }
    else {
        res.end(data);
    }

});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('Server running on port' + PORT);
});