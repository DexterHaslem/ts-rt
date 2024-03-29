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
// x/y vector info for direction vector and plane direction.
// also abused for locations (points)
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
    private _keysDown: {
        [keyName: string]: boolean;
    }

    // simple 16x16 world: todo move to json or something
    private _world: number[][] = [
        [R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R],
        [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
        [R, E, E, E, E, E, E, E, E, E, E, G, G, G, E, R],
        [R, E, E, B, B, B, E, E, E, E, E, G, E, G, E, R],
        [R, E, E, B, B, B, E, E, E, E, E, G, G, G, E, R],
        [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
        [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
        [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
        [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
        [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
        [R, E, E, G, G, E, E, E, E, E, E, E, E, E, E, R],
        [R, E, E, G, G, E, E, E, E, E, E, E, E, E, E, R],
        [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
        [R, E, E, E, E, E, E, E, E, B, B, B, E, E, E, R],
        [R, E, E, E, E, E, E, E, E, E, E, E, E, E, E, R],
        [R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R],
    ];

    constructor(private _canvas: HTMLCanvasElement) {
        this._ctx = <CanvasRenderingContext2D>_canvas.getContext("2d");
        this._keysDown = {}
        // such a hack: canvas is not desigend to get keyboard events,
        // slam its tab index so it gets the keyboard events
        _canvas.tabIndex = 1000;
        _canvas.addEventListener("keydown", (e: KeyboardEvent) => this._keysDown[e.key] = true);
        _canvas.addEventListener("keyup", (e: KeyboardEvent) => this._keysDown[e.key] = false);
        requestAnimationFrame(this.frame)
    }

    private fps = (ts: number): number => {
        this._prevFrameTime = this._frameTime;
        this._frameTime = ts;
        const frameTime = (this._frameTime - this._prevFrameTime) / 1000.0;
        const fps = 1.0 / frameTime;
        return Math.round(fps);
    };

    // TODO: getting stuck against walls :-(
    private input = () => {
        const moveSpeed = 0.10; //this._frameTime * 1;
        const rotSpeed = 0.03; //this._frameTime * 1;
        if (this._keysDown["w"]) {
            // forward
            const tryX = Math.ceil(this._loc.x + this._dir.x * moveSpeed);
            if (!this._world[tryX][this._loc.y]) { // if we didnt hit a wall (0), continue
                this._loc.x += this._dir.x * moveSpeed;
            } else {
                this._loc.y += this._dir.y * moveSpeed;
            }
        }

        if (this._keysDown["s"]) {
            // back
            const tryX = Math.ceil(this._loc.x - this._dir.x * moveSpeed);
            if (!this._world[tryX][this._loc.y]) { // if we didnt hit a wall (0), continue
                this._loc.x -= this._dir.x * moveSpeed;
            } else {
                this._loc.y -= this._dir.y * moveSpeed;
            }
        }

        // NOTE about movement. very naive, no way to strafe, you can go forward/back
        // and rotate the camera from that one track. need to add legit strafing..

        // rotate, not strafe on a/d. KEYBOARD TURNERS
        // to turn, change both cam dir and plane
        /* rot matrix
        [ cos(a) -sin(a) ]
        [ sin(a)  cos(a) ]
        */

        // rotate left/right
        if (this._keysDown["d"] || this._keysDown["a"]) {
            const rot = this._keysDown["d"] ? -rotSpeed : rotSpeed;
            const oldX = this._dir.x;
            this._dir.x = this._dir.x * Math.cos(rot) - this._dir.y * Math.sin(rot);
            this._dir.y = oldX * Math.sin(rot) + this._dir.y * Math.cos(rot);
            const oldPlaneX = this._plane.x;
            this._plane.x = this._plane.x * Math.cos(rot) - this._plane.y * Math.sin(rot);
            this._plane.y = oldPlaneX * Math.sin(rot) + this._plane.y * Math.cos(rot);
        }
    };

    private wallColor = (w: number, isSide: boolean): string => {
        let r, g, b = 0;
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
    };

    private redraw = (ts: number) => {
        const w = this._canvas.width;
        const h = this._canvas.height;
        this._ctx.clearRect(0, 0, w, h);
        this._ctx.font = "14px Arial";
        this._ctx.fillText(`FPS: ${this.fps(ts)}`, 2, 16);

        // TODO: cleanup, functionally map
        for (let x = 0; x < w; x++) {
            const camX = 2 * x / w - 1;
            const rayLoc = new Vector(this._loc.x, this._loc.y);
            const rayDir = new Vector(this._dir.x + this._plane.x * camX,
                this._dir.y + this._plane.y * camX);

            const map = new Vector(Math.floor(rayLoc.x), Math.floor(rayLoc.y));
            const distX = Math.sqrt(1 + Math.pow(rayDir.y, 2) / Math.pow(rayDir.x, 2));
            const distY = Math.sqrt(1 + Math.pow(rayDir.x, 2) / Math.pow(rayDir.y, 2));
            //console.log(`mapVec=${mapVec} distX=${distX} distY=${distY}`);

            let step = new Vector(0, 0);
            let sideDist = new Vector(0, 0);

            if (rayDir.x < 0) {
                step.x = -1;
                sideDist.x = (rayLoc.x - map.x) * distX;
            } else {
                step.x = 1;
                sideDist.x = (map.x + 1 - rayLoc.x) * distX;
            }

            if (rayDir.y < 0) {
                step.y = -1;
                sideDist.y = (rayLoc.y - map.y) * distY;
            } else {
                step.y = 1;
                sideDist.y = (map.y + 1 - rayLoc.y) * distY;
            }

            let side = 0;
            while (true) {
                if (sideDist.x < sideDist.y) {
                    sideDist.x += distX;
                    map.x += step.x;
                    side = 0;
                } else {
                    sideDist.y += distY;
                    map.y += step.y;
                    side = 1;
                }
                // for some reason, this doesnt work in a do/while
                if (this._world[map.x][map.y] > 0) {
                    break;
                }
            }

            // projection
            const perpDist = side === 0 ?
                (map.x - rayLoc.x + (1 - step.x) / 2) / rayDir.x :
                (map.y - rayLoc.y + (1 - step.y) / 2) / rayDir.y;

            const lineHeight = h / perpDist;
            const start = Math.max(0, -lineHeight / 2 + h / 2);
            const end = Math.min(h - 1, lineHeight / 2 + h / 2);

            const color = this.wallColor(this._world[map.x][map.y], side > 0);
            this._ctx.strokeStyle = color;
            this._ctx.beginPath();
            this._ctx.moveTo(x, start);
            this._ctx.lineTo(x, end);
            // TODO: batch all strokes
            this._ctx.stroke();
        }
    };

    // dont forget to use lambda to keep lexical scoping of this
    private frame = (ts: number) => {
        this.input();
        this.redraw(ts);
        requestAnimationFrame(this.frame);
    };
}
