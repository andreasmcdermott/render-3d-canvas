console.log("Source: https://github.com/andreasmcdermott/render-3d-canvas");

let deg2rad = Math.PI / 180;

let { sin, cos } = Math;

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let w = window.innerWidth;
let h = window.innerHeight;
canvas.width = w;
canvas.height = h;

class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  copy() {
    return new Vec3(this.x, this.y, this.z);
  }
  scale(vec) {
    this.x *= vec.x;
    this.y *= vec.y;
    this.z *= vec.z;
    return this;
  }
  add(vec) {
    this.x += vec.x;
    this.y += vec.y;
    this.z += vec.z;
    return this;
  }
  sub(vec) {
    this.x -= vec.x;
    this.y -= vec.y;
    this.z -= vec.z;
    return this;
  }
  rotate(vec) {
    if (vec.x) this.rotateX(vec.x);
    if (vec.y) this.rotateY(vec.y);
    if (vec.z) this.rotateZ(vec.z);
    return this;
  }
  rotateX(deg) {
    let rad = deg * deg2rad;
    let { y, z } = this;
    this.y = y * cos(rad) - z * sin(rad);
    this.z = y * sin(rad) + z * cos(rad);
    return this;
  }
  rotateY(deg) {
    let rad = deg * deg2rad;
    let { x, z } = this;
    this.x = x * cos(rad) + z * sin(rad);
    this.z = x * -sin(rad) + z * cos(rad);
    return this;
  }
  rotateZ(deg) {
    let rad = deg * deg2rad;
    let { x, y } = this;
    this.x = x * cos(rad) - y * sin(rad);
    this.y = x * sin(rad) + y * cos(rad);
    return this;
  }
}

class Polygon {
  constructor(...vertices) {
    this.vertices = vertices;
  }
}

class Mesh {
  constructor(...polygons) {
    this.polygons = polygons;
  }
}

class Entity {
  constructor(
    mesh,
    pos = new Vec3(),
    rot = new Vec3(),
    scale = new Vec3(1, 1, 1)
  ) {
    this.mesh = mesh;
    this.pos = pos;
    this.rot = rot;
    this.scale = scale;
    this.color = "black";
    this.lineWidth = 1;
  }
}

class Camera {
  constructor(pos = new Vec3(), rot = new Vec3()) {
    this.pos = pos;
    this.rot = rot;
  }
}

let boxmesh = new Mesh(
  // Front
  new Polygon(
    new Vec3(-2, 2, -2),
    new Vec3(2, 2, -2),
    new Vec3(2, -2, -2),
    new Vec3(-2, -2, -2)
  ),
  // Back
  new Polygon(
    new Vec3(2, 2, 2),
    new Vec3(-2, 2, 2),
    new Vec3(-2, -2, 2),
    new Vec3(2, -2, 2)
  ),
  // Left
  new Polygon(
    new Vec3(-2, 2, 2),
    new Vec3(-2, 2, -2),
    new Vec3(-2, -2, -2),
    new Vec3(-2, -2, 2)
  ),
  // Right
  new Polygon(
    new Vec3(2, 2, -2),
    new Vec3(2, 2, 2),
    new Vec3(2, -2, 2),
    new Vec3(2, -2, -2)
  ),
  // Top
  new Polygon(
    new Vec3(-2, 2, 2),
    new Vec3(2, 2, 2),
    new Vec3(2, 2, -2),
    new Vec3(-2, 2, -2)
  ),
  // Bottom
  new Polygon(
    new Vec3(2, -2, -2),
    new Vec3(-2, -2, -2),
    new Vec3(-2, -2, 2),
    new Vec3(2, -2, 2)
  )
);

function drawEntity(e, cam) {
  for (let i = 0; i < e.mesh.polygons.length; ++i) {
    drawPolygon(e, e.mesh.polygons[i], cam);
  }
}

function drawPolygon(e, polygon, cam) {
  let prev = null;
  for (let i = 0; i <= polygon.vertices.length; ++i) {
    let vec = polygon.vertices[i % polygon.vertices.length]
      .copy()
      .rotate(e.rot)
      .add(e.pos)
      .scale(e.scale)
      .sub(cam.pos);
    if (cam.rot.x) vec.rotateX(-cam.rot.x);
    if (cam.rot.y) vec.rotateX(-cam.rot.y);
    if (cam.rot.z) vec.rotateX(-cam.rot.z);
    if (vec.z <= 0) vec.z = 0.01;
    vec.x /= vec.z;
    vec.y /= vec.z;
    vec.x = (vec.x * w) / 2 + w / 2;
    vec.y = (-vec.y * h) / 2 + h / 2;
    if (i > 0) drawLine(prev, vec, e.color, e.lineWidth);

    prev = vec;
  }
}

function drawLine(v1, v2, color, lineWidth) {
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(v1.x, v1.y);
  ctx.lineTo(v2.x, v2.y);
  ctx.stroke();
}

let floormesh = new Mesh();
for (let x = 0; x < 20; ++x) {
  for (let z = 0; z < 20; ++z) {
    floormesh.polygons.push(
      new Polygon(
        new Vec3(x, 0, z),
        new Vec3(x + 1, 0, z),
        new Vec3(x + 1, 0, z + 1),
        new Vec3(x, 0, z + 1)
      )
    );
  }
}

let camera = new Camera(new Vec3(0, 1, 0));
let box1 = new Entity(boxmesh, new Vec3(-4, 1, 10));
box1.color = "skyblue";
box1.lineWidth = 3;
let box2 = new Entity(boxmesh, new Vec3(2, 1, 15));
box2.color = "gold";
box2.lineWidth = 3;
let box3 = new Entity(boxmesh, new Vec3(12, 1, 20));
box3.color = "hotpink";
box3.lineWidth = 3;
let floor = new Entity(
  floormesh,
  new Vec3(-10, 0, 0),
  new Vec3(),
  new Vec3(2, 1, 1)
);
floor.color = "white";

let keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
  delete keys[e.key];
});
window.addEventListener("resize", (e) => {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
});

let lt = performance.now();
function tick(t) {
  let dt = (t - lt) / 1000;
  box1.rot.x += 65 * dt;
  box2.rot.z -= 65 * dt;
  box3.rot.y -= 65 * dt;

  if (keys.ArrowUp) camera.pos.z += 10 * dt;
  if (keys.ArrowDown) camera.pos.z -= 10 * dt;
  if (keys.ArrowLeft) camera.pos.x -= 10 * dt;
  if (keys.ArrowRight) camera.pos.x += 10 * dt;

  ctx.clearRect(0, 0, w, h);
  drawEntity(floor, camera);
  drawEntity(box1, camera);
  drawEntity(box2, camera);
  drawEntity(box3, camera);
  ctx.fillStyle = "white";
  ctx.fillText(`${Math.round(1000 / (t - lt))} FPS`, 10, 10);
  lt = t;
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
