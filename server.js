var express = require('express');
var stylus = require('stylus');
var numeric = require('numeric');

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

app.get('/matrix/:size', function(req, res) {
  var n = req.params.size;
  var gen = generateMatrix(n);
  var A = gen['A'];
  //var b = gen['b'];
  //res.json(A);
  res.write(JSON.stringify(A));
  res.write(JSON.stringify(numeric.eig(A).lambda));
  res.write(isPositiveDefinite(A, n) ? 'pos' : 'not pos');
  res.end();
});

app.get('/genA', function(req, res) {
  var n = req.query.n;
  res.json(generateMatrixA(n));
});

app.get('/genB', function(req, res) {
  var n = req.query.n;
  res.json(generateMatrixB(n));
});

app.get('/lab1', function(req, res) {
  res.render('lab1');
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



function isPositiveDefinite(A) {
  var eigenvalues = numeric.eig(A).lambda.x;
  var positive = 0;
  for(var i = 0; i < eigenvalues.length; i++) {
    if(eigenvalues[i] > 0) {
      positive = positive + 1;
    }
  }
  return (positive == eigenvalues.length);
}

function isPositiveDet(A, n) {
  var B = Array(n);
  for (var i = 0; i < n; i++) {
    B[i] = Array(n);
    for (var j = 0; j < n; j++) {
      B[i][j] = A[i][j];
    }
  }
  return (numeric.det(B) > 0);
}

function getRandInt() {
  var val = 0;
  var MIN = -100;
  var MAX = 100;
  while (val == 0) {
    val = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
  }
  return val;
}

function generateMatrixA(n) {
  // A - симметричная и положительно определенная матрица
  var A = new Array(n);
  for (var i = 0; i < n; i++) {
    A[i] = new Array(n);
  }

  for (var i = 0; i < n; i++) {
    do {
      for (var j = 0; j < i + 1; j++) {
        A[i][j] = A[j][i] = getRandInt();
      }
    } while (!isPositiveDet(A, i + 1));
  }
  return A;
}

function generateMatrixB(n) {
  var b = new Array(n);
  for (var i = 0; i < n; i++) {
    b[i] = getRandInt();
  }
  return b;
}
