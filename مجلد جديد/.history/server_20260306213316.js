const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Hello World</h1>');

    
    const path= req.url;

    if(path === '/'){
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Yousef ahmed baniFadel</h1>');
    }
    



});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
