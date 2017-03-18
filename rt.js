/**
 * Created by Dexter on 3/17/2017.
 */
// for debugging
var rt;
function start(canvas) {
    rt = new RayTracer(canvas);
}
// Wall info, using enum makes the definitions painfully long even using vim
var E = 0;
var R = 1;
var G = 2;
var B = 3;
// this is intentionally not complete, just needed a more simple way to stuff
// x/y vector info for direction vector and plane direction
var Vector = (function () {
    function Vector(x, y) {
        var _this = this;
        this.x = x;
        this.y = y;
        this.toString = function () {
            return "Vector(" + _this.x + ":" + _this.y + ")";
        };
    }
    return Vector;
}());
var RayTracer = (function () {
    function RayTracer(_canvas) {
        var _this = this;
        this._canvas = _canvas;
        this._dir = new Vector(-1, 0);
        this._loc = new Vector(8, 8);
        this._plane = new Vector(0, 0.66);
        // simple 16x16 world: todo move to json or something
        this._world = [
            [R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R],
            [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, G, G, G, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, G, E, G, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, G, G, G, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
            [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
            [R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R],
        ];
        this.fps = function (ts) {
            _this._prevFrameTime = _this._frameTime;
            _this._frameTime = ts;
            var frameTime = (_this._frameTime - _this._prevFrameTime) / 1000.0;
            var fps = 1.0 / frameTime;
            return Math.round(fps);
        };
        this.input = function () {
        };
        this.wallColor = function (w, isSide) {
            var r, g, b = 0;
            switch (w) {
                case R:
                    r = 255;
                    g = 0;
                    b = 0;
                    break;
                case G:
                    r = 0;
                    g = 255;
                    b = 0;
                    break;
                case B:
                    r = 0;
                    g = 0;
                    b = 255;
                    break;
                default:
                    break;
            }
            if (isSide) {
                r /= 2;
                g /= 2;
                b /= 2;
            }
            return "rgb(" + r + "," + g + "," + b + ")";
        };
        this.redraw = function (ts) {
            var w = _this._canvas.width;
            var h = _this._canvas.height;
            _this._ctx.clearRect(0, 0, w, h);
            _this._ctx.font = "14px Arial";
            _this._ctx.fillText("FPS: " + _this.fps(ts), 2, 16);
            for (var x = 0; x < w; x++) {
                var camX = 2 * x / w - 1;
                var rayLoc = new Vector(_this._loc.x, _this._loc.y);
                var rayDir = new Vector(_this._dir.x + _this._plane.x * camX, _this._dir.y + _this._plane.y * camX);
                var mapVec = new Vector(Math.floor(rayLoc.x), Math.floor(rayLoc.y));
                var distX = Math.sqrt(1 + Math.pow(rayDir.y, 2) / Math.pow(rayDir.x, 2));
                var distY = Math.sqrt(1 + Math.pow(rayDir.x, 2) / Math.pow(rayDir.y, 2));
                //console.log(`mapVec=${mapVec} distX=${distX} distY=${distY}`);
                var stepVec = new Vector(0, 0);
                var hit = false;
                var sideDistanceVec = new Vector(0, 0);
                if (rayDir.x < 0) {
                    stepVec.x = -1;
                    sideDistanceVec.x = (rayLoc.x - mapVec.x) * distX;
                }
                else {
                    stepVec.x = 1;
                    sideDistanceVec.x = (mapVec.x + 1 - rayLoc.x) * distX;
                }
                if (rayDir.y < 0) {
                    stepVec.y = -1;
                    sideDistanceVec.y = (rayLoc.y - mapVec.y) * distY;
                }
                else {
                    stepVec.y = 1;
                    sideDistanceVec.y = (mapVec.y + 1 - rayLoc.y) * distY;
                }
                // DDA
                var side = 0;
                while (true) {
                    if (sideDistanceVec.x < sideDistanceVec.y) {
                        sideDistanceVec.x += distX;
                        mapVec.x += stepVec.x;
                        side = 0;
                    }
                    else {
                        sideDistanceVec.y += distY;
                        mapVec.y += stepVec.y;
                        side = 1;
                    }
                    // for some reason, this doesnt work in a do/while
                    if (_this._world[mapVec.x][mapVec.y] > 0) {
                        break;
                    }
                }
                // projection
                var perpDist = side === 0 ?
                    (mapVec.x - rayLoc.x + (1 - stepVec.x) / 2) / rayDir.x :
                    (mapVec.y - rayLoc.y + (1 - stepVec.y) / 2) / rayDir.y;
                var lineHeight = h / perpDist;
                var start_1 = Math.max(0, -lineHeight / 2 + h / 2);
                var end = Math.min(h - 1, lineHeight / 2 + h / 2);
                var color = _this.wallColor(_this._world[mapVec.x][mapVec.y], side > 0);
                _this._ctx.strokeStyle = color;
                _this._ctx.beginPath();
                _this._ctx.moveTo(x, start_1);
                _this._ctx.lineTo(x, end);
                // TODO: batch all strokes
                _this._ctx.stroke();
            }
        };
        // dont forget to use lambda to keep lexical scoping of this
        this.frame = function (ts) {
            _this.input();
            _this.redraw(ts);
            requestAnimationFrame(_this.frame);
        };
        this._ctx = _canvas.getContext("2d");
        requestAnimationFrame(this.frame);
    }
    return RayTracer;
}());
