const http = require('http');

const fs = require('fs');

console.log(fs)

const server = http.createServer((req, res) => {



    fs.readFile('js.HTML', 'utf8', (err, data) => {

    if (err) {
        console.error(err);
        return;
    }
    else {
        json = JSON.parse(data);
        const path= req.url;
          
        res.writeHead(200, {'Content-Type': 'text/html'});
          

    if(path === '/') {
        
    } else if(path === '/api') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(json));
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('<h1>Page not found</h1>');

    }

});



});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('Server running on port' + PORT);
});