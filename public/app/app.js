var app = angular.module('app', ['ngResource', 'ngRoute']);

app.config(function($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
});

app.controller('Lab1Ctrl', function($scope, matrixSolver){
    $scope.nMin = 3;
    $scope.nMax = 7;
    $scope.matrixIsHidden = true;

    $scope.solve = function() {
        if (isNaN($scope.nMin) || isNaN($scope.nMax) || $scope.nMin > $scope.nMax || $scope.nMin < 1) {
            alert('Wrong sizes');
            return;
        }
        $scope.matrix = matrixSolver.solve($scope.nMin, $scope.nMax);
        $scope.select($scope.nMin);
        $scope.matrixIsHidden = false;
    }

    $scope.select = function(n) {
        for (var i = 0; i < $scope.matrix.length; i++) {
            if ($scope.matrix[i].n === n) {
                $scope.sel = $scope.matrix[i];
            }
        }
    }

    $scope.getTabClass = function(n) {
        var res = 'list-group-item table-tab ';
        if ($scope.sel.n === n) {
            res += 'active';
        }
        return res;
    }
});

app.factory('matrixSolver', function($window) {
    var num = $window.numeric;
    var MIN = -100;
    var MAX = 100;

    function getRandInt() {
        var val = 0;
        while (val == 0) {
            val = (Math.floor(Math.random() * (MAX - MIN + 1)) + MIN) / 10;
        }
        return val;
    }

    function norm(xNext, xPrev) {
        var sum = 0;
        for (var i = 0; i < xNext.length; i++) {
            sum = sum + (xNext[i] - xPrev[i]) * (xNext[i] - xPrev[i]);
        }
        return Math.sqrt(sum);
    }

    function generateMatrixA(n) {
        var A = new Array(n);
        for (var i = 0; i < n; i++) {
            A[i] = new Array(n);
            for (var j = 0; j < n; j++) {
                A[i][j] = getRandInt();
            }
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
                    M[i][j] = M[i][j] * M[i][j];
                }
            }
        }
        return M;
    }

    // Неявный метод скорейшего спуска
    function resolveDescent(m) {}

    // Неявный метод с Чебышевским набором параметров
    function resolveChebyshev(m) {
        var n = m.n;
        var A = m.A;
        var invM = m.invM;
        var b = m.b;
        console.log('n = ' + JSON.stringify(n));
        console.log('A = ' + JSON.stringify(A));
        console.log('invM = ' + JSON.stringify(invM));
        console.log('b = ' + JSON.stringify(b));

        var C = num.dot(invM, A);
        var eigenvalues = num.eig(C).lambda.x;
        var eigenMin = Math.min.apply(Math, eigenvalues);
        var eigenMax = Math.max.apply(Math, eigenvalues);
        console.log('C = ' + JSON.stringify(C));
        console.log('eigenvalues = ' + JSON.stringify(eigenvalues));

        var eps = eigenMin / eigenMax;
        console.log('eps = ' + eps);
        var ro0 = (1 - eps) / (1 + eps);
        console.log('ro0 = ' + ro0);

        var t = function (k) {
            return Math.cos((2 * k - 1) * Math.PI / (2 * n));
        };

        var T0 = 2 / (eigenMin + eigenMax);
        var T = function (k) {
            return T0 / (1 + ro0 * t(k));
        };

        var start = new Date().getTime();
        var xPrev, xNext = b;
        var k = 0;
        var normVal = 0;
        do{
            xPrev = xNext;
            xNext = num.sub(b, num.dot(A, xPrev));
            xNext = num.mul(xNext, T(k + 1));
            xNext = num.dot(invM, xNext);
            xNext = num.add(xNext, xPrev);
            k = k + 1;
            normVal = norm(xPrev, xNext);
            console.log('norm = ' + JSON.stringify(normVal));
        } while(normVal > 0.01);
        var end = new Date().getTime();
        return {
            res: xNext,
            k: k,
            time: end - start,
            error: normVal
        }
    }

    return {
        solve: function(nMin, nMax) {
            var matrix = new Array();
            for (var i = nMin; i <= nMax; i++) {
                var A = generateMatrixA(i);
                var b = generateMatrixB(i);
                var inv = num.transpose(A);
                matrix.push({
                    n: i,
                    A: num.dot(inv, A),
                    b: num.dot(inv, b),
                    invM: num.transpose(generateMatrixM(i))
                });
                var sel = i - nMin;
                matrix[sel].chebyshev = resolveChebyshev(matrix[sel]);
                console.log('!!!!!!!!!!!!!!!' + JSON.stringify(matrix[sel].chebyshev));
                matrix[sel].descent = resolveDescent(matrix[sel]);
            }
            return matrix;
        }
    };
});

app.directive('matrixTable', function() {
    return {
        restrict: 'E',
        scope: {
            data: "="
        },
        templateUrl: 'partials/matrixTable',
        link: function(scope, elem, attrs) {
            console.log(scope.data);
        }
    };
});


app.directive('matrixRow', function() {
    return {
        restrict: 'E',
        scope: {
            data: "="
        },
        templateUrl: 'partials/matrixRow',
        link: function(scope, elem, attrs) {
            console.log(scope.data);
        }
    };
});