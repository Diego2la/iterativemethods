var app = angular.module('app', ['ngResource', 'ngRoute', 'angular-flot']);

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

    $scope.flotChartOptions = {
        series: {
            lines: { show: true },
            points: { show: true }
        }
    };

    function prepareFlotData() {
        var size = $scope.nMax - $scope.nMin + 1;
        var n, cheb, desc;
        var datCheb = new Array();
        var datDesc = new Array();
        for (var i = 0; i < size; i++) {
            n = $scope.matrix[i].n;
            cheb = $scope.matrix[i].chebyshev;
            desc = $scope.matrix[i].descent;
            if (cheb.error < 10000) {
                datCheb.push( [n, cheb.error] );
            }
            if (desc.error < 10000) {
                datDesc.push( [n, desc.error] );
            }
        }
        $scope.flotData = [
            { label: "Неявный метод Чебышева", data: datCheb },
            { label: "Неявный метод скорейшего спуска", data: datDesc }
        ];
        console.log('flotData = ' + JSON.stringify($scope.flotData));
    }

    $scope.solve = function() {
        if (isNaN($scope.nMin) || isNaN($scope.nMax) || $scope.nMin > $scope.nMax || $scope.nMin < 1) {
            alert('Wrong sizes');
            //console.log($scope.nMin + '   ' + $scope.nMax);
            return;
        }
        $scope.matrix = matrixSolver.solve($scope.nMin, $scope.nMax);
        prepareFlotData();
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

function extend(Child, Parent) {
    var F = function() { }
    F.prototype = Parent.prototype
    Child.prototype = new F()
    Child.prototype.constructor = Child
    Child.superclass = Parent.prototype
}

app.factory('matrixSolver', function($window) {
    var num = $window.numeric;
    var MIN = -100;
    var MAX = 100;
    var CALC_ERROR = 0.01; //мс
    var CALC_TIME = 3000;

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

    function scalar(a, b) {
        var n = a.length;
        var sum = 0;
        for (var i = 0; i < n; i++) {
            sum += a[i] * b[i];
        }
        return sum;
    }

    function Solver(m) {
        this.n = m.n;
        this.A = m.A;
        this.invM = m.invM;
        this.b = m.b;

        this.start;
        this.end;
        this.xPrev;
        this.xNext = this.b;
        this.k = 0;

        this.calc = function () {
            this.start = new Date().getTime();
            do {
                this.xPrev = this.xNext;
                this.do();
                this.k += 1;
                var normVal = norm(this.xPrev, this.xNext);
                this.end = new Date().getTime();
            } while (normVal > CALC_ERROR && (this.end - this.start) < CALC_TIME);
            return {
                res: this.xNext,
                k: this.k,
                time: (this.end - this.start)
            }
        }
        this.do = function () {}
    }

    // Неявный метод скорейшего спуска
    function Descent(m) {
        Descent.superclass.constructor.call(this, m);
        this.do = function () {
            var r = num.sub(num.dot(this.A, this.xPrev), this.b);
            var invBr = num.dot(this.invM, r);
            var T = scalar(r, invBr) / scalar(num.dot(this.A, invBr), invBr);
            this.xNext = num.neg(num.dot(r, T));
            this.xNext = num.dot(this.invM, this.xNext);
            this.xNext = num.add(this.xNext, this.xPrev);
        }
    }
    extend(Descent, Solver);


    // Неявный метод с Чебышевским набором параметров
    function Chebyshev(m) {
        Chebyshev.superclass.constructor.call(this, m);

        this.C = num.dot(this.invM, this.A);
        this.eigenvalues = num.eig(this.C).lambda.x;

        this.eigenMin = Math.min.apply(Math, this.eigenvalues);
        this.eigenMax = Math.max.apply(Math, this.eigenvalues);

        this.eps = this.eigenMin / this.eigenMax;
        this.ro0 = (1 - this.eps) / (1 + this.eps);

        this.t = function (k) {
            return Math.cos((2 * k - 1) * Math.PI / (2 * this.n));
        };

        this.T0 = 2 / (this.eigenMin + this.eigenMax);
        this.T = function (k) {
            return this.T0 / (1 + this.ro0 * this.t(k));
        };

        this.do = function () {
            this.xNext = num.sub(this.b, num.dot(this.A, this.xPrev));
            this.xNext = num.mul(this.xNext, this.T(this.k + 1));
            this.xNext = num.dot(this.invM, this.xNext);
            this.xNext = num.add(this.xNext, this.xPrev);
        }
    }
    extend(Chebyshev, Solver);

    return {
        solve: function(nMin, nMax) {
            var matrix = new Array();
            for (var i = nMin; i <= nMax; i++) {
                console.log('---> n = ' + i);
                var A = generateMatrixA(i);
                var b = generateMatrixB(i);
                var inv = num.transpose(A);
                matrix.push({
                    n: i,
                    A: num.dot(inv, A),
                    b: num.dot(inv, b),
                    invM: num.transpose(generateMatrixM(i))
                });
                var sel = matrix[i - nMin];
                sel.chebyshev = new Chebyshev(sel).calc();
                //console.log('sel.chebyshev = ' + JSON.stringify(sel.chebyshev));
                sel.descent = new Descent(sel).calc();
                sel.chebyshev.error = norm(num.dot(A, sel.chebyshev.res), b);
                sel.descent.error = norm(num.dot(A, sel.descent.res), b);
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