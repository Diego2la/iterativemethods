var app = angular.module('app', ['ngResource', 'ngRoute']);

app.config(function($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
});

app.controller('Lab1Ctrl', function($scope, matrixStorage){
    $scope.nMin = 3;
    $scope.nMax = 7;
    $scope.matrixIsHidden = true;
    $scope.generate = function() {
        if (isNaN($scope.nMin) || isNaN($scope.nMax) || $scope.nMin > $scope.nMax || $scope.nMin < 1) {
            alert('Wrong sizes');
            return;
        }
        matrixStorage.generateMatrix($scope.nMin, $scope.nMax);
        $scope.matrix = matrixStorage.getMatrix();
        $scope.select($scope.matrix[0]);
        $scope.matrixIsHidden = false;
    }
    $scope.select = function(m) {
        $scope.selected = m;
        matrixStorage.setSelected(m.n);
    }
    $scope.getTabClass = function(n) {
        var res = 'list-group-item table-tab ';
        if ($scope.selected.n === n) {
            res += 'active';
        }
        return res;
    }
});

app.factory('matrixStorage', function($window) {
    var nMin, nMax, nSelect;
    var matrix = new Array();
    var num = $window.numeric;

    var MIN = -100;
    var MAX = 100;

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

    function generateMatrixM(n) {
        // Выбирая в качестве M какую-либо легко обратимую матрицу, получают общий неявный метод простой итерации.
        var M = new Array(n);
        for (var i = 0; i < n; i++) {
            M[i] = new Array(n);
            for (var j = 0; j < n; j++) {
                if (i != j) {
                    M[i][j] = 0;
                } else {
                    M[i][j] = getRandInt();
                }
            }
        }
        return M;
    }

    return {
        generateMatrix: function(nMin, nMax) {
            this.nMax = nMax;
            this.nMin = nMin;
            matrix = new Array();
            for (var i = nMin; i <= nMax; i++) {
                matrix.push({
                    n: i,
                    A: generateMatrixA(i),
                    b: generateMatrixB(i),
                    M: generateMatrixM(i)
                });
            }
        }, getMatrix: function() {
            return matrix;
        }, setSelected: function(n) {
            nSelect = n;
        }, getSelectedMatrix: function(type) {
            for (var i = 0; i < matrix.length; i++) {
                if (matrix[i].n === nSelect) {
                    if (type === 'A') {
                        return matrix[i].A;
                    }
                    if (type === 'b') {
                        return matrix[i].b;
                    }
                    return null;
                }
            }
            return null;
        }, resolveChebyshev: function(A, b, n) {
            //Делаем матриуц B : x = h + Bx
            var B = new Array(n);
            for (var i = 0; i < n; i++) {
                B[i] = new Array(n);
                for (var j = 0; j < n; j++) {
                    if (i != j) {
                        B[i][j] = - A[i][j] / A[i][i];
                    } else {
                        B[i][j] = 0;
                    }
                }
            }
            var C = numeric.dot(numeric.inv(B), A);
            var Ceigenvalues = numeric.eig(C).lambda.x;
            var eps = Ceigenvalues.min / Ceigenvalues.max;
            var ro0 = (1 - eps) / (1 + eps);

            var ro1 = (1 - math.sqrt(eps)) / (1 + math.sqrt(eps));
            var nIt = ln(2 / eps) / ln(1 / ro1);
            var t = function(k) {
                return math.cos((2*k - 1)*Math.PI/(2*n))
            };

            var Aeigenvalues = numeric.eig(A).lambda.x;
            var T0 = 2 / (Aeigenvalues.min + Aeigenvalues.max);
            var T = function(k) {
                return T0 / (1 + ro0 * t(k));
            };

            var xNext = b;
            var k = 0;
            while (k < nIt) {
                xPrev = xNext;
                xNext = numeric.inv(M);
                xNext = numeric.dot(xNext, numeric.sub(b, numeric.dot(A, xPrev)));
                xNext = numeric.dot(xNext, T(k+1));
                xNext = numeric.dot(xNext, xPrev);
                k = k + 1;
            }
            return {
                time: 100


            };
        }
    };
});

app.directive('matrixA', function() {
  return {
      restrict: 'E',
      scope: {},
      controller: function($scope, matrixStorage) {
          $scope.getData = function() {
              return matrixStorage.getSelectedMatrix('A');
          }
     },
      templateUrl: 'partials/matrixA'
  };
});

app.directive('matrixB', function() {
    return {
        restrict: 'E',
        scope: {},
        controller: function($scope, matrixStorage) {
            $scope.getData = function() {
                return matrixStorage.getSelectedMatrix('b');
            }
        },
        templateUrl: 'partials/matrixB'
    };
});


//function isPositiveDefinite(A) {
//    var eigenvalues = numeric.eig(A).lambda.x;
//    var positive = 0;
//    for(var i = 0; i < eigenvalues.length; i++) {
//        if(eigenvalues[i] > 0) {
//            positive = positive + 1;
//        }
//    }
//    return (positive == eigenvalues.length);
//}



//var n = req.params.size;
//var gen = generateMatrix(n);
//var A = gen['A'];
////var b = gen['b'];
////res.json(A);
//res.write(JSON.stringify(A));
//res.write(JSON.stringify(numeric.eig(A).lambda));
//res.write(isPositiveDefinite(A, n) ? 'pos' : 'not pos');
