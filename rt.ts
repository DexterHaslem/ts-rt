/**
 * Created by Dexter on 3/17/2017.
 */

// for debugging
let rt: RayTracer;
function start(canvas: HTMLCanvasElement) {
    rt = new RayTracer(canvas);
}

// Wall info, using enum makes the definitions painfully long even using vim
const E = 0;
const R = 1;
const G = 2;
const B = 3;

// this is intentionally not complete, just needed a more simple way to stuff
// x/y vector info for direction vector and plane direction
class Vector {
    constructor(public x: number, public y: number) { }

    public toString = (): string => {
        return `Vector(${this.x}:${this.y})`;
    }
}

class RayTracer {
    private _frameTime: number;
    private _prevFrameTime: number;
    private _ctx: CanvasRenderingContext2D;

    private _dir: Vector = new Vector(-1, 0);
    private _loc: Vector = new Vector(8, 8);
    private _plane: Vector = new Vector(0, 0.66);

    // simple 16x16 world: todo move to json or something
    private _world: number[][] = [
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

    constructor(private _canvas: HTMLCanvasElement) {
        this._ctx = <CanvasRenderingContext2D>_canvas.getContext("2d");
        requestAnimationFrame(this.frame)
    }

    private fps = (ts: number): number => {
        this._prevFrameTime = this._frameTime;
        this._frameTime = ts;
        const frameTime = (this._frameTime - this._prevFrameTime) / 1000.0;
        const fps = 1.0 / frameTime;
        return Math.round(fps);
    }

    private input = () => {

    }

    private wallColor = (w: number, isSide: boolean): string => {
        let r,g,b = 0;
        switch (w) {
            case R:
            r = 255; g = 0; b = 0;
            break;
            case G:
            r = 0; g = 255; b = 0;
            break;
            case B:
            r = 0; g = 0; b = 255;
            break;
            default:
            break;
        }

        if (isSide) {
            r /= 2;
            g /= 2;
            b /= 2;
        }
        return `rgb(${r},${g},${b})`;
    }

    private redraw = (ts: number) => {
        const w = this._canvas.width;
        const h = this._canvas.height;
        this._ctx.clearRect(0, 0, w, h);
        this._ctx.font = "14px Arial";
        this._ctx.fillText(`FPS: ${this.fps(ts)}`, 2, 16);

        for (let x = 0; x < w; x++) {
            const camX = 2 * x / w - 1;
            const rayLoc = new Vector(this._loc.x, this._loc.y);
            const rayDir = new Vector(this._dir.x + this._plane.x * camX,
                this._dir.y + this._plane.y * camX);

            const mapVec = new Vector(Math.floor(rayLoc.x), Math.floor(rayLoc.y))
            const distX = Math.sqrt(1 + Math.pow(rayDir.y, 2) / Math.pow(rayDir.x, 2))
            const distY = Math.sqrt(1 + Math.pow(rayDir.x, 2) / Math.pow(rayDir.y, 2))
            //console.log(`mapVec=${mapVec} distX=${distX} distY=${distY}`);

            let stepVec = new Vector(0, 0);
            let hit = false;
            let sideDistanceVec = new Vector(0, 0);

            if (rayDir.x < 0) {
                stepVec.x = -1;
                sideDistanceVec.x = (rayLoc.x - mapVec.x) * distX;
            } else {
                stepVec.x = 1;
                sideDistanceVec.x = (mapVec.x + 1 - rayLoc.x) * distX;
            }

            if (rayDir.y < 0) {
                stepVec.y = -1;
                sideDistanceVec.y = (rayLoc.y - mapVec.y) * distY;
            } else {
                stepVec.y = 1;
                sideDistanceVec.y = (mapVec.y + 1 - rayLoc.y) * distY;
            }

            // DDA
            let side = 0;
            while (true) {
                if (sideDistanceVec.x < sideDistanceVec.y) {
                    sideDistanceVec.x += distX;
                    mapVec.x += stepVec.x;
                    side = 0;
                } else {
                    sideDistanceVec.y += distY;
                    mapVec.y += stepVec.y;
                    side = 1;
                }
                // for some reason, this doesnt work in a do/while
                if (this._world[mapVec.x][mapVec.y] > 0) {
                    break;
                }
            }

            // projection
            const perpDist = side === 0 ?
                (mapVec.x - rayLoc.x + (1 - stepVec.x) / 2) / rayDir.x :
                (mapVec.y - rayLoc.y + (1 - stepVec.y) / 2) / rayDir.y;

            const lineHeight = h / perpDist;
            const start = Math.max(0, -lineHeight / 2 + h / 2);
            const end = Math.min(h - 1, lineHeight / 2 + h / 2);

            const color = this.wallColor(this._world[mapVec.x][mapVec.y], side > 0)
            this._ctx.strokeStyle = color;
            this._ctx.beginPath();
            this._ctx.moveTo(x,start);
            this._ctx.lineTo(x, end)
            // TODO: batch all strokes
            this._ctx.stroke();
        }
    }

    // dont forget to use lambda to keep lexical scoping of this
    private frame = (ts: number) => {
        this.input()
        this.redraw(ts);
        requestAnimationFrame(this.frame)
    }
}
