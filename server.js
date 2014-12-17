var express = require('express');
var stylus = require('stylus');

var app = express();

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .set('compress', true);
}
app.set('port', (process.env.PORT || 5000));
app.set('views', __dirname + '/server/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(stylus.middleware(
  { src: __dirname + '/public'
    , compile: compile
  }
));

app.get('/partials/:partialPath', function(req, res) {
  res.render('partials/' + req.params.partialPath);
});

app.get('/lab1', function(req, res) {
  res.render('lab1');
});

app.get('/lab2', function(req, res) {
  res.render('lab2');
});

app.get('/', function(req, res) {
  res.render('index');
});

app.get('*', function (req, res) {
  res.send('404');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
