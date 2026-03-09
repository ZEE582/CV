const http = require('http');
const fs = require('fs');
const { dirname } = require('path');

const server = http.createServer((req, res) => {
    const path = req.url;

     let info = fs.readFile('js.html', 'utf8', (err, data) => {
     if (err) {
        console.log("eror");
        return;
     }else{
        if (path === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        } else if (path === '/api'){
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } else {
            stsatusCode = 404;
         res.writeHead(404, { 'Content-Type': 'text/html' });
         res.end('<h1>404 Not Found</h1>');
         }
     }
    });


const PORT = 3000;
server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});