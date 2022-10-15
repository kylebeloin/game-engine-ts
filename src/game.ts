const FPS = 60;
const RESOLUTION = 8;
const MAX_VELOCITY = 0.05;

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
  private signal: string;
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
    this.signal = "";
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
  }

  public pause() {
    this.running = !this.running;
    this.update();
    this.renderer.draw();
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

  public input(signal: string) {
    if (this.running) {
      this.signal = signal;
      requestAnimationFrame(() => this.main());
    }
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
    } | World Cells: ${this.world?.getWorld()?.at(0)?.at(0)} | Signal: ${
      this.signal
    }`;
  }

  public getDebug() {
    return this.debug;
  }

  public getSignal() {
    return this.signal;
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
  private userInput: string | null = null;

  constructor(engine: Engine, root: HTMLElement) {
    this.engine = engine;
    this.root = root;
    this.startButton = this.createButton("startButton", "Start", "start");
    this.stopButton = this.createButton("stopButton", "Stop", "stop");
    this.pauseButton = this.createButton("pauseButton", "Pause", "pause");
    this.debugButton = this.createButton("debugButton", "Debug", "debug");
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

  private handleInput(event: string): void {
    this.userInput = event;
    this.engine.input(event);
  }

  private initializeControls(): void {
    document.addEventListener("keydown", (e) => {
      this.handleInput(e.key);
    });

    document.addEventListener("keyup", (e) => {
      // check if key is being held down
      if (e.key == this.userInput) {
        this.handleInput("");
      }
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
      this.context.font = "20px Arial";
      this.context.fillStyle = "black";
      this.context.fillText(debugText, 10, 50);

      this.context.fillText(`Velocity: ${this.player.getVelocity()}`, 10, 75);
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
  private velocity: number;
  private mass = 1.5;
  private friction = 0.001;

  constructor(engine: Engine) {
    this.engine = engine;
    this.x = 0;
    this.y = 0;
    this.speed = 0.02;
    this.velocity = 0;
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

  public getVelocity(): number {
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

    this.direction = direction;

    if (
      ((this.velocity < MAX_VELOCITY && this.direction.dx != 0) ||
        (this.velocity < MAX_VELOCITY && this.direction.dy != 0)) &&
      this.velocity < MAX_VELOCITY
    ) {
      this.velocity += (this.friction * this.mass) / 2;
    }
  }

  public move(): void {
    // increment velocity
    if (this.velocity < 0) {
      this.velocity = 0;
    }

    this.setX(
      this.x + (this.velocity + this.friction * this.mass) * this.direction.dx
    );
    this.setY(this.y + this.velocity * this.direction.dy);
    window.requestAnimationFrame(() => {
      switch (this.engine.getSignal()) {
        case "ArrowLeft":
          this.setDirection({
            dx: -1,
            dy: 0,
          });

          break;
        case "ArrowRight":
          this.setDirection({ dx: 1, dy: 0 });
          break;
        case "ArrowUp":
          this.setDirection({ dx: 0, dy: -1 });
          break;
        case "ArrowDown":
          this.setDirection({ dx: 0, dy: 1 });
          break;
        default:
          if (this.velocity > 0) {
            this.velocity -= this.friction * this.mass;
            this.setDirection(this.direction);
          } else {
            this.setDirection({ dx: 0, dy: 0 });
          }
          break;
      }
    });
  }
}
