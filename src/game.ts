const FPS = 60;
const RESOLUTION = 8;
const MAX_VELOCITY = 0.05;
const DIRS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

export class Engine {
  public world: World | null;
  private fps: number;
  private fpsInterval: number;
  private startTime: number;
  private now: number;
  private elapsed: number;
  private then: number;
  private running: boolean;
  private debug: boolean;
  private debugText: string;
  private signal: { [key: string]: boolean };
  public renderer: Renderer;

  constructor() {
    console.info("Initializing Engine");
    this.fps = FPS;
    this.fpsInterval = 1000 / this.fps;
    this.startTime = 0;
    this.now = 0;
    this.elapsed = 0;
    this.then = 0;
    this.running = false;
    this.debug = true;
    this.debugText = "";
    this.world = null;
    // make signal a map of signals
    this.signal = {};
    this.renderer = new Renderer(this);
  }

  public do(action: string) {
    switch (action) {
      case "start":
        this.start();
        break;
      case "stop":
        this.stop();
        break;
      case "pause":
        this.pause();
        break;
      case "debug":
        this.toggleDebug();
        break;
      default:
        break;
    }

    requestAnimationFrame(() => this.main());
  }

  public start() {
    this.running = true;
    this.then = Date.now();
    this.startTime = this.then;
    this.world = new World(this.renderer.canvas.width / 10);

    this.main();
  }

  public stop() {
    this.running = false;
    this.signal = {};
  }

  public pause() {
    this.running = !this.running;
    this.update();
    this.renderer.draw();
    this.signal = {};
  }

  public toggleDebug() {
    this.debug = !this.debug;
  }

  public getDebugText() {
    if (this.debug) {
      return this.debugText;
    }
    return "";
  }

  public input(signal: { [key: string]: boolean }) {
    if (this.running) {
      requestAnimationFrame(() => this.setSignal(signal));
      requestAnimationFrame(() => this.main());
    }
  }

  private setSignal(signal: { [key: string]: boolean }) {
    this.signal = { ...this.signal, ...signal };
  }

  private main() {
    if (this.running) {
      requestAnimationFrame(() => this.main());
    }

    this.now = Date.now();
    this.elapsed = this.now - this.then;

    if (this.elapsed > this.fpsInterval) {
      this.then = this.now - (this.elapsed % this.fpsInterval);
      this.update();
      this.renderer.draw();
    }
  }

  private update() {
    this.debugText = `FPS: ${this.fps} | Time: ${
      // counts up to fps
      (Math.floor((this.now - this.startTime) / this.fpsInterval) % this.fps) +
        1 <
      10
        ? "0"
        : ""
    }${
      (Math.floor((this.now - this.startTime) / this.fpsInterval) % this.fps) +
      1
    } | Running: ${this.running} | World Size: ${
      this.world?.getSize() ?? 0
    } | World Cells: ${this.world
      ?.getWorld()
      ?.at(0)
      ?.at(0)} | Signal: ${JSON.stringify(this.signal)}`;
  }

  public getDebug() {
    return this.debug;
  }

  public getSignal(key: string) {
    return this.signal[key];
  }

  public getSignals() {
    return Object.entries(this.signal);
  }
}

export class World {
  private world: Array<Array<number>>;
  private size: number;
  constructor(size: number) {
    this.size = size;

    this.world = new Array<Array<number>>();
    for (let i = 0; i < size; i++) {
      this.world[i] = new Array<number>();
      for (let j = 0; j < size; j++) {
        this.world[i][j] = 0;
      }
    }
  }

  public getSize(): number {
    return this.size;
  }

  public getWorld(): Array<Array<number>> {
    return this.world;
  }

  public getCell(x: number, y: number): number {
    return this.world[x][y];
  }

  public setCell(x: number, y: number, val: number): void {
    this.world[x][y] = val;
  }

  public printWorld(): void {
    for (let i = 0; i < this.size; i++) {
      let row = "";
      for (let j = 0; j < this.size; j++) {
        if (this.world[i][j] == -1) {
          row += "X ";
        } else {
          row += this.world[i][j] + " ";
        }
      }
      console.log(row);
    }
  }
}

export class UserInterface {
  private engine: Engine;
  private root: HTMLElement;
  private startButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private pauseButton: HTMLButtonElement;
  private debugButton: HTMLButtonElement;
  private userInput: { [key: string]: boolean };

  constructor(engine: Engine, root: HTMLElement) {
    this.engine = engine;
    this.root = root;
    this.startButton = this.createButton("startButton", "Start", "start");
    this.stopButton = this.createButton("stopButton", "Stop", "stop");
    this.pauseButton = this.createButton("pauseButton", "Pause", "pause");
    this.debugButton = this.createButton("debugButton", "Debug", "debug");
    this.userInput = {};
    this.initializeControls();
  }

  private removeButton(id: string): void {
    const button = document.getElementById(id) as HTMLButtonElement;
    if (button) {
      button.remove();
    }
  }

  private createButton(
    id: string,
    text: string,
    action: string
  ): HTMLButtonElement {
    let button;
    if (document.getElementById(id) != null) {
      button = document.getElementById(id) as HTMLButtonElement;
    } else {
      button = document.createElement("button");
      button.id = id;
    }

    button.innerHTML = text;
    button.onclick = () => this.engine.do(action);
    this.root.appendChild(button);
    return button;
  }

  private handleInput(event: { [key: string]: boolean }): void {
    this.userInput = event;
    this.engine.input(this.userInput);
  }

  private initializeControls(): void {
    document.addEventListener("keydown", (e) => {
      this.handleInput({ [e.key]: true });
    });

    document.addEventListener("keyup", (e) => {
      this.handleInput({ [e.key]: false });
    });
  }
}

export class Renderer {
  private engine: Engine;
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public player: Player;

  constructor(engine: Engine) {
    console.log("Renderer created");
    this.engine = engine;
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.player = new Player(this.engine);
    this.drawGrid();
  }

  private drawGrid(): void {
    const cellSize = this.canvas.width / RESOLUTION;
    this.context.strokeStyle = "#000000";
    this.context.lineWidth = 1;
    if (this.engine.getDebug()) {
      for (let i = 0; i < RESOLUTION + 1; i++) {
        this.context.beginPath();
        this.context.moveTo(i * cellSize, 0);
        this.context.lineTo(i * cellSize, this.canvas.height);
        this.context.stroke();
        this.context.beginPath();
        this.context.moveTo(0, i * cellSize);
        this.context.lineTo(this.canvas.width, i * cellSize);
        this.context.stroke();
      }
    } else {
      this.context.beginPath();
      this.context.moveTo(0, 0);
      this.context.lineTo(this.canvas.width, 0);
      this.context.lineTo(this.canvas.width, this.canvas.height);
      this.context.lineTo(0, this.canvas.height);
      this.context.lineTo(0, 0);
      this.context.stroke();
    }
  }

  public draw(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawDebug(this.engine.getDebugText());
    this.drawGrid();
    this.drawPlayer();
  }

  private drawDebug(debugText: string): void {
    if (this.context && this.engine.getDebug()) {
      this.context.font = "12px Arial";
      this.context.fillStyle = "black";
      this.context.fillText(debugText, 10, 50);

      this.context.fillText(
        `Velocity: ${JSON.stringify(this.player.getVelocity())}`,
        10,
        75
      );
      this.context.fillText(
        `Direction: ${JSON.stringify(this.player.getDirection())}`,
        10,
        100
      );

      this.context.fillText(`Player X: ${this.player.getX()}`, 10, 125);

      this.context.fillText(`Player Y: ${this.player.getY()}`, 10, 150);
    }
  }

  public drawPlayer(): void {
    if (this.context) {
      this.context.fillStyle = "red";
      this.context.fillRect(
        (this.player.getX() * this.canvas.width) / RESOLUTION,
        (this.player.getY() * this.canvas.height) / RESOLUTION,
        this.player.getWidth(),
        this.player.getHeight()
      );
    }
    window.requestAnimationFrame(() => this.player.move());
  }
}

export class Player {
  private engine: Engine;
  private x: number;
  private y: number;
  private speed: number;
  private width: number;
  private height: number;
  private color: string;
  private direction: { dx: number; dy: number };
  // keep track of velocity in each direction
  private velocity: { dx: number; dy: number };
  private mass = 3;
  private friction = 0.001;

  constructor(engine: Engine) {
    this.engine = engine;
    this.x = 0;
    this.y = 0;
    this.speed = 0.5 * RESOLUTION;
    this.velocity = { dx: 0, dy: 0 };
    this.width = 10;
    this.height = 10;
    this.color = "red";
    this.direction = { dx: 0, dy: 0 };
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public getColor(): string {
    return this.color;
  }

  public getDirection(): { dx: number; dy: number } {
    return this.direction;
  }

  public getVelocity(): { dx: number; dy: number } {
    return this.velocity;
  }

  public setX(x: number): void {
    let maxX =
      this.engine.renderer.canvas.width /
      (this.engine.renderer.canvas.width / RESOLUTION);
    if (x < 0) {
      this.x = maxX;
    } else if (x > maxX) {
      this.x = 0;
    } else {
      this.x = x;
    }
  }

  public setY(y: number): void {
    let maxY =
      this.engine.renderer.canvas.height /
      (this.engine.renderer.canvas.height / RESOLUTION);

    if (y < 0) {
      this.y = maxY;
    } else if (y > maxY) {
      this.y = 0;
    } else {
      this.y = y;
    }
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  public setWidth(width: number): void {
    this.width = width;
  }

  public setHeight(height: number): void {
    this.height = height;
  }

  public setColor(color: string): void {
    this.color = color;
  }

  public setDirection(direction: { dx: number; dy: number }): void {
    // get the direction of the player and calculate displacement

    this.velocity = {
      dx:
        direction.dx !== 0 && direction.dx
          ? this.velocity.dx < MAX_VELOCITY
            ? this.velocity.dx + (this.friction * this.mass) / 2
            : this.velocity.dx
          : this.velocity.dx - this.friction * this.mass,
      dy:
        direction.dy !== 0
          ? this.velocity.dy < MAX_VELOCITY
            ? this.velocity.dy + (this.friction * this.mass) / 2
            : this.velocity.dy
          : this.velocity.dy - this.friction * this.mass,
    };

    this.direction = {
      dx:
        direction.dx === 0
          ? this.velocity.dx > 0
            ? this.direction.dx
            : 0
          : direction.dx,
      dy:
        direction.dy === 0
          ? this.velocity.dy > 0
            ? this.direction.dy
            : 0
          : direction.dy,
    };

    // if (
    //   (this.velocity.dx < MAX_VELOCITY && this.direction.dx != 0) ||
    //   (this.velocity.dy < MAX_VELOCITY && this.direction.dy != 0)
    // ) {
    //   // this.velocity += (this.friction * this.mass) / 2;
    //   this.velocity.dx += (this.friction * this.mass) / 2;
    //   this.velocity.dy += (this.friction * this.mass) / 2;
    // }
  }

  private calculateDirection(dirs: [string, boolean][]): {
    dx: number;
    dy: number;
  } {
    let newDirs = dirs.map((dir) => DIRS[dir[0] as keyof typeof DIRS]);
    // check if any of the directions are true and return the direction; but if a direction is false and still has a velocity, keep the velocity and direction
    let newDir = newDirs.reduce(
      (a, b) => {
        return { dx: a.dx + b[0], dy: a.dy + b[1] };
      },
      { dx: 0, dy: 0 }
    );
    return newDir;
  }

  public move(): void {
    // increment velocity
    if (this.velocity.dx < 0) {
      this.velocity.dx = 0;
    }
    if (this.velocity.dy < 0) {
      this.velocity.dy = 0;
    }

    this.setX(
      this.x +
        (this.velocity.dx + this.friction * this.mass) * this.direction.dx
    );
    this.setY(this.y + this.velocity.dy * this.direction.dy);
    let dirs = this.engine
      .getSignals()
      .filter((signal) => signal[1])
      .filter((signal) => Object.keys(DIRS).includes(signal[0]));
    window.requestAnimationFrame(() => {
      if (dirs.length > 0) {
        let newDir = this.calculateDirection(dirs);
        this.setDirection(newDir);
        // if there are multiple directions, we need to figure out which one to use
        // add the directions together and then normalize
      } else {
        this.setDirection({ dx: 0, dy: 0 });
      }
    });
  }
}

// class Controls {
//   private engine: Engine;

//   constructor(engine: Engine) {
//     this.engine = engine;
//     window.addEventListener("keydown", (e) => {
//       this.engine.setSignal(e.key);
//     });
//     window.addEventListener("keyup", (e) => {
//       this.engine.setSignal("");
//     });
//   }
// }
