export class Engine {
  private world: World;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
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

  constructor() {
    console.log("Initializing Engine");
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.fps = 60;
    this.fpsInterval = 1000 / this.fps;
    this.startTime = 0;
    this.now = 0;
    this.elapsed = 0;
    this.then = 0;
    this.running = false;
    this.debug = true;
    this.debugText = "";
    this.world = new World(10);
    this.signal = "";
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
    this.main();
  }

  public stop() {
    this.running = false;
  }

  public pause() {
    this.running = !this.running;
    this.update();
    this.draw();
  }

  public toggleDebug() {
    this.debug = !this.debug;
  }

  public input(signal: string) {
    this.signal = signal;
    requestAnimationFrame(() => this.main());
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
      this.draw();
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
    } | Running: ${
      this.running
    } | World Size: ${this.world.getSize()} | World Cells: ${this.world
      .getWorld()
      ?.at(0)
      ?.at(0)} | Signal: ${this.signal}`;
  }

  private draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.debug) {
      this.context.fillStyle = "black";
      this.context.font = "20px Arial";
      this.context.fillText(this.debugText, 10, 20);
    }
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
      this.handleInput("");
    });
  }
}