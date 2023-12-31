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
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  set(vec) {
    this.x = vec.x;
    this.y = vec.y;
    this.z = vec.z;
  }
  normalize() {
    let len = this.len();
    if (len !== 0) {
      this.x /= len;
      this.y /= len;
      this.z /= len;
    }
    return this;
  }
  scale(vec) {
    this.x *= vec.x;
    this.y *= vec.y;
    this.z *= vec.z;
    return this;
  }
  scaleUniform(num) {
    this.x *= num;
    this.y *= num;
    this.z *= num;
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
    meshes,
    pos = new Vec3(),
    rot = new Vec3(),
    scale = new Vec3(1, 1, 1)
  ) {
    this.meshes = Array.isArray(meshes) ? meshes : [meshes];
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
  move(vec) {
    let change = new Vec3();
    if (vec.z) {
      let roty = this.rot.y * deg2rad;
      let z = Math.cos(roty);
      let x = Math.sin(roty);
      change.x += vec.z * x;
      change.z += vec.z * z;
    }

    if (vec.x) {
      let roty = (this.rot.y + 90) * deg2rad;
      let z = Math.cos(roty);
      let x = Math.sin(roty);
      change.x += vec.x * x;
      change.z += vec.x * z;
    }

    this.pos.add(change.normalize().scaleUniform(0.5));
  }
}

let boxmesh = new Mesh(
  // Front
  new Polygon(
    new Vec3(-1, 1, -1),
    new Vec3(1, 1, -1),
    new Vec3(1, -1, -1),
    new Vec3(-1, -1, -1)
  ),
  // Back
  new Polygon(
    new Vec3(1, 1, 1),
    new Vec3(-1, 1, 1),
    new Vec3(-1, -1, 1),
    new Vec3(1, -1, 1)
  ),
  // Left
  new Polygon(
    new Vec3(-1, 1, 1),
    new Vec3(-1, 1, -1),
    new Vec3(-1, -1, -1),
    new Vec3(-1, -1, 1)
  ),
  // Right
  new Polygon(
    new Vec3(1, 1, -1),
    new Vec3(1, 1, 1),
    new Vec3(1, -1, 1),
    new Vec3(1, -1, -1)
  ),
  // Top
  new Polygon(
    new Vec3(-1, 1, 1),
    new Vec3(1, 1, 1),
    new Vec3(1, 1, -1),
    new Vec3(-1, 1, -1)
  ),
  // Bottom
  new Polygon(
    new Vec3(1, -1, -1),
    new Vec3(-1, -1, -1),
    new Vec3(-1, -1, 1),
    new Vec3(1, -1, 1)
  )
);

function drawEntity(e, cam) {
  for (let m = 0; m < e.meshes.length; ++m) {
    let mesh = e.meshes[m];
    for (let i = 0; i < mesh.polygons.length; ++i) {
      drawPolygon(e, mesh.polygons[i], cam);
    }
  }
}

function drawPolygon(e, polygon, cam) {
  let prev = null;
  for (let i = 0; i <= polygon.vertices.length; ++i) {
    let vec = polygon.vertices[i % polygon.vertices.length]
      .copy()

      .rotate(e.rot)

      .scale(e.scale)
      .add(e.pos)
      .sub(cam.pos);
    if (cam.rot.y) vec.rotateY(-cam.rot.y);
    if (cam.rot.x) vec.rotateX(-cam.rot.x);
    if (cam.rot.z) vec.rotateZ(-cam.rot.z);
    if (vec.z <= 0) vec.z = 0.001;
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

let camera = new Camera(new Vec3(0, 2, 0));
let box1 = new Entity(boxmesh, new Vec3(0, 1, 5), undefined, new Vec3(2, 2, 2));
box1.color = "skyblue";
box1.lineWidth = 3;
let box2 = new Entity(
  boxmesh,
  new Vec3(-10, 1, 10),
  undefined,
  new Vec3(2, 2, 2)
);
box2.color = "gold";
box2.lineWidth = 3;
let box3 = new Entity(
  boxmesh,
  new Vec3(10, 1, 15),
  undefined,
  new Vec3(2, 2, 2)
);
box3.color = "hotpink";
box3.lineWidth = 3;
let floor = new Entity(
  floormesh,
  new Vec3(-20, 0, -20),
  new Vec3(),
  new Vec3(4, 1, 4)
);
floor.color = "white";

function lookAround({ movementX, movementY }) {
  if (movementX) camera.rot.y += movementX;
  if (movementY)
    camera.rot.x = Math.max(Math.min(camera.rot.x + movementY, 90), -90);
}

let keys = {};
let lt = performance.now();

function tick(t) {
  let dt = (t - lt) / 1000;
  box1.rot.x += 65 * dt;
  box2.rot.z -= 65 * dt;
  box3.rot.y -= 65 * dt;

  let movement = new Vec3();
  if (keys.ArrowUp || keys.w) movement.z += 10 * dt;
  if (keys.ArrowDown || keys.s) movement.z -= 10 * dt;
  if (keys.ArrowLeft || keys.a) movement.x -= 10 * dt;
  if (keys.ArrowRight || keys.d) movement.x += 10 * dt;
  camera.move(movement);

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

window.addEventListener(
  "keydown",
  (e) => {
    keys[e.key] = true;
  },
  { passive: true }
);
window.addEventListener(
  "keyup",
  (e) => {
    delete keys[e.key];
    // if (e.key === 'Escape' && document.pointerLockElement === canvas)
  },
  { passive: true }
);
window.addEventListener(
  "resize",
  (e) => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  },
  { passive: true }
);
document.addEventListener(
  "pointerlockchange",
  () => {
    if (document.pointerLockElement === canvas) {
      document.addEventListener("mousemove", lookAround, { passive: true });
    } else {
      document.removeEventListener("mousemove", lookAround, { passive: true });
    }
  },
  { passive: true }
);

canvas.addEventListener("click", async () => {
  if (!document.pointerLockElement) {
    await canvas.requestPointerLock({ unadjustedMovement: true });
  }
});
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

requestAnimationFrame(tick);
