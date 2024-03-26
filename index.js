// importing express module that was installed previously.
const express = require('express');
// declaring an app using the express framework module.
const app = express();

app.use(express.static(__dirname + ''));
// importing body-parser to create bodyParser object
const bodyParser = require('body-parser');
// allows you to use req.body var when you use http post method.
app.use(bodyParser.urlencoded({ extended: true }));
// allows you to ejs view engine.
app.set('view engine', 'ejs');

// routers
const boardRouter = require('./routes/boardRouter');

// declaring port number. You can use this number whatever you want.
const port = 8080;

// this middleware allows to start server using port number 8080
const server = app.listen(port, function() {
    console.log('Listening on '+port);
});

app.use('/board', boardRouter);
app.get('/', (req, res) => {
    res.redirect('/board');
});