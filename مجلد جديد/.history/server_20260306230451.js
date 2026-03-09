const http = require('http');
const fs = require('fs');
const { dirname } = require('path');

const server = http.createServer((req, res) => {
    const path = req.url;

    if (path === '/') {
        fs.readFile('js.HTML', 'utf8', (err, data) => {
            if (err) {
                console.log("error");
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 Internal Server Error</h1>');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (path === '/api') {
        fs.readFile('js.HTML', 'utf8', (err, data) => {
            if (err) {
                console.log("error");
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'File not found' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({data }));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});