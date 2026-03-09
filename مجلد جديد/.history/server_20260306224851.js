const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    const path = req.url;

    if (path === '/') {
        const info = fs.readFile('js.html', 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 Internal Server Error</h1>');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
            return data;
        });

    } else if (path === '/api') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info));

    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});