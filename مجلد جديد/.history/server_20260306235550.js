const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {

    const path = req.url;

    fs.readFile('js.html', 'utf8', (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Internal Server Error</h1>');
        }
        else{
            if (path === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                console.log(data);
                res.end(data);
            } else if (path === '/api'){
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>');
            }
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});