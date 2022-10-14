import { Engine, UserInterface } from "./game.js";

const root = document.getElementById("root");

if (root) {
  root.innerHTML = "Hello World";
  const canvas = document.createElement("canvas");

  canvas.id = "canvas";
  canvas.width = 800;
  canvas.height = 600;

  root.appendChild(canvas);

  const engine = new Engine();
  const ui = new UserInterface(engine, root);
}
