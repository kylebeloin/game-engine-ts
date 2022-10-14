import { Engine, UserInterface } from "./game.js";

const SIZE = 800;

const root = document.getElementById("root");

if (root) {
  const canvas = document.createElement("canvas");

  canvas.id = "canvas";
  canvas.width = SIZE;
  canvas.height = 600;

  root.appendChild(canvas);

  const engine = new Engine();
  const ui = engine && new UserInterface(engine, root);
  ui && console.info("Game initialized");
}
