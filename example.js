// สร้าง scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x051c2c);

// สร้างกล้อง
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 25, 5); // ลด x จาก 5 → 2
camera.lookAt(0, 0, 0); // มองไปที่จุดเดิม
let currentRotation = 0;
let isCreating = false;
let isPlace = false;
let isCanSave = false;
// สร้าง renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ใช้ OrbitControls แบบ global (มาจาก THREE)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false; // ❌ ปิด zoom in/out
controls.enablePan = false; // ❌ ปิดการ pan
controls.minPolarAngle = Math.PI / 18; // ก้มสูงสุด
controls.maxPolarAngle = Math.PI / 2; // เงยต่ำสุด

// เพิ่มแสง
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// สร้าง Grid
const gridHelper = new THREE.GridHelper(25, 25);
scene.add(gridHelper);

const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const lineGroup = new THREE.Group();

const size = 25;
const divisions = 25;
let dir = "top";
let isCanPlace = true;
let isAlreadyPlace = false;
for (let i = -size / 2; i <= size / 2; i += 5) {
  // เส้นแนวตั้ง (Z)
  const verticalGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(i, 0, -size / 2),
    new THREE.Vector3(i, 0, size / 2),
  ]);
  const verticalLine = new THREE.Line(verticalGeo, lineMaterial);
  lineGroup.add(verticalLine);

  // เส้นแนวนอน (X)
  const horizontalGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-size / 2, 0, i),
    new THREE.Vector3(size / 2, 0, i),
  ]);
  const horizontalLine = new THREE.Line(horizontalGeo, lineMaterial);
  lineGroup.add(horizontalLine);
}
scene.add(lineGroup);

const planeGeo = new THREE.PlaneGeometry(25, 25);
const planeMat = new THREE.MeshBasicMaterial({
  visible: false, // ให้เป็นพื้นล่องหน
  side: THREE.DoubleSide, // รับ raycast จากบน-ล่าง
});
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotateX(-Math.PI / 2); // ให้นอนราบกับพื้น
scene.add(plane);

// ✅ กล่อง hover highlight
const hoverGeo = new THREE.BoxGeometry(1, 1, 1);
const hoverMat = new THREE.MeshStandardMaterial({
  color: 0xffff0,
  transparent: true, // ✅ ต้องเปิดก่อนถึงจะใช้ opacity ได้
  opacity: 0.7, // ✅ ค่าความทึบ ยิ่งน้อยยิ่งโปร่ง
});
const hoverMesh = new THREE.Mesh(hoverGeo, hoverMat);
// hoverMesh.rotateX(-Math.PI / 2); // แนวนอน
hoverMesh.visible = false;
scene.add(hoverMesh);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener("mousemove", (event) => {
  // แปลงตำแหน่งเมาส์เป็น normalized device coordinates (NDC)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

let isDragging = false;
let isClick = false;
let dragStart = { x: 0, y: 0 };
let isToStore = [];
window.addEventListener("pointerdown", (event) => {
  dragStart.x = event.clientX;
  dragStart.y = event.clientY;
  isClick = true;
  isDragging = false; // 👈 รีเซตตรงนี้ด้วย
});

window.addEventListener("pointermove", (event) => {
  const dx = event.clientX - dragStart.x;
  const dy = event.clientY - dragStart.y;

  if (Math.sqrt(dx * dx + dy * dy) > 5 && isClick) {
    isDragging = true;
    isCanPlace = true;
  }
  if (Math.sqrt(dx * dx + dy * dy) > 5) {
    isCanPlace = true;
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
let floorHeight = 1;
let bWidth = 1;
let bDepth = 1;
window.addEventListener("pointerup", (event) => {
  const height = floorHeight;
  const currentDragging = isDragging;
  isDragging = false;
  isClick = false;

  if (currentDragging || !isCreating) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(plane);

  const targetY = 0;
  if (intersects.length > 0 && isCanPlace) {
    if (!isCanCreate()) {
      alert("Bad Request");
      return;
    }
    const color = `${getRandomColor()}`;
    let start = {};
    let end = {};
    isToStore.forEach((value, index) => {
      const x = value[0];
      const z = value[1];
      if (index === 0) {
        const xStart = Math.floor(x / 5);
        const zStart = Math.floor(z / 5);
        virtualGrid2D[zStart][xStart] = buildingType === "Square" ? 1 : 2;
        start = { x: x, z: z };
      }
      if (index === isToStore.length - 1) {
        const xStart = Math.floor(x / 5);
        const zStart = Math.floor(z / 5);
        virtualGrid2D[zStart][xStart] = buildingType === "Square" ? 1 : 2;
        console.log(x, z, ":end x z");
        end = { x: x, z: z };
      }
      for (let h = 0; h < height; h++) {
        // ป้องกันหลุดขอบ
        if (virtualGrid[targetY + h]?.[z]?.[x]) {
          virtualGrid[targetY + h][z][x].isFree = false;
          const worldX = virtualGrid[targetY + h][z][x].z;
          const worldZ = virtualGrid[targetY + h][z][x].x;
          const cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: color })
          );
          cube.position.set(worldX, 0.5 + targetY + h, worldZ);
          virtualGrid[targetY + h][x][z].cube = cube;
          console.log(x, z);
          scene.add(cube);
        }
      }
    });
    const buffer = { start, end, height };
    update2DGriudUI();
    setIsAlreadyPlace(true);
    console.log(buffer, ":buffer prepare");
    storeBuilding(buffer);
  }
});
let isTyping = false;
const setIsTyping = (status) => {
  isTyping = status;
};
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r" && isCreating && !isTyping) {
    currentRotation = (currentRotation + 90) % 360;
  }
});
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
function createTextLabel(text, x, z, size = 1) {
  // สร้าง canvas สำหรับวาดข้อความ
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 256;

  context.fillStyle = "white";
  context.font = "120px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);

  sprite.scale.set(size, size, 1); // ปรับขนาด label
  sprite.position.set(x, 0.01, z); // วางแปะบนพื้น
  scene.add(sprite);
}
let virtualGrid = [];
let virtualGrid2D = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];

const create2DGridUI = () => {
  const grids = document.getElementById("2dGrid");
  virtualGrid2D.map((row, index) => {
    row.map((col, indexIn) => {
      const div = document.createElement("div");
      div.style.width = "100%";
      div.style.height = "100%";
      div.style.border = "1px solid rgba(255, 255, 255, 0.7)";
      div.id = `${index}${indexIn}`;
      grids.appendChild(div);
    });
  });
};
const update2DGriudUI = () => {
  virtualGrid2D.map((row, index) => {
    row.map((col, indexIn) => {
      const div = document.getElementById(`${index}${indexIn}`);
      const color = col === 1 ? "white" : col === 2 ? "black" : "";
      div.style.background = color;
    });
  });
};
create2DGridUI();
const defineLabelIndex = () => {
  const gridSize = 25;
  const cellSize = 1;
  const half = gridSize / 2;
  const maxHeigh = 8;
  for (let y = 0; y < maxHeigh; y++) {
    const floor = [];
    for (let x = 0; x < gridSize; x++) {
      const row = [];
      for (let z = 0; z < gridSize; z++) {
        const worldX = (x - half) * cellSize + cellSize / 2;
        const worldZ = (z - half) * cellSize + cellSize / 2;
        row.push({
          isFree: true,
          owner: "",
          x: x - 12,
          z: z - 12,
          y: y,
          cube: null,
        });
        if (y <= 0) {
          createTextLabel(`${x},${z}`, worldX, worldZ, 0.7);
        }
      }
      floor.push([...row]);
    }
    virtualGrid.push([...floor]);
  }
};
defineLabelIndex();
const getOriginIndex = (x, z) => {
  const gridSize = 25;
  const cellSize = 1;
  const halfSize = gridSize / 2;
  const worldX = x;
  const worldZ = z;
  const gridX = Math.floor((worldX + halfSize * cellSize) / cellSize);
  const gridZ = Math.floor((worldZ + halfSize * cellSize) / cellSize);
  return [gridX, gridZ];
};
let buildingType = "Square";
const buildingScale = {
  Square: { x: 5, z: 5 },
  Rectangular: { x: 10, z: 5 },
};
const ChangeBuildHandler = (type) => {
  buildingType = type;
};
const placeholderGroup = new THREE.Group();
scene.add(placeholderGroup);
function isOutOfBound(virtualX, virtualZ) {
  return (
    virtualZ < 0 ||
    virtualZ >= virtualGrid.length ||
    virtualX < 0 ||
    virtualX >= virtualGrid[virtualZ].length
  );
}

const placeholderPool = [];
const maxPoolSize = 1000;
for (let i = 0; i < maxPoolSize; i++) {
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5,
    })
  );
  cube.visible = false;
  placeholderGroup.add(cube);
  placeholderPool.push(cube);
}

function renderPlaceholder(
  startX,
  startZ,
  gridSize = 1,
  targetY = 0,
  height = 3
) {
  const baseW = buildingScale[buildingType].x;
  const baseH = buildingScale[buildingType].z;
  const rotation = currentRotation % 360;

  let buildingW = baseW;
  let buildingH = baseH;
  let offsetX = 0;
  let offsetZ = 0;

  if (rotation === 90) {
    buildingW = baseH;
    buildingH = baseW;
    offsetX = 0;
    offsetZ = -(buildingH - 1);
  } else if (rotation === 180) {
    offsetX = -(buildingW - 1);
    offsetZ = -(buildingH - 1);
  } else if (rotation === 270) {
    buildingW = baseH;
    buildingH = baseW;
    offsetX = -(buildingW - 1);
    offsetZ = 0;
  }

  const neighbours = [];
  isToStore.length = 0;
  let canPlace = true;

  for (let dx = 0; dx < buildingW; dx++) {
    for (let dz = 0; dz < buildingH; dz++) {
      const gridX = startX + offsetX + dx;
      const gridZ = startZ + offsetZ + dz;
      const virtualX = gridX + 12;
      const virtualZ = gridZ + 12;

      const outOfBound =
        targetY < 0 ||
        targetY >= virtualGrid.length ||
        virtualZ < 0 ||
        virtualZ >= virtualGrid[targetY].length ||
        virtualX < 0 ||
        virtualX >= virtualGrid[targetY][virtualZ].length;

      let overlapped = false;
      if (!outOfBound) {
        overlapped = virtualGrid[targetY][virtualZ][virtualX].isFree === false;
      }
      if (outOfBound || overlapped) {
        canPlace = false;
      }

      neighbours.push({
        gridX,
        gridZ,
        outOfBound,
        overlapped,
      });
    }
  }

  placeholderPool.forEach((cube) => (cube.visible = false));

  let poolIndex = 0;
  for (const cell of neighbours) {
    const { gridX, gridZ, outOfBound, overlapped } = cell;
    const worldX = gridX + 0.5 - gridSize / 2;
    const worldZ = gridZ + 0.5 - gridSize / 2;
    const color = outOfBound || overlapped ? 0xfc0303 : 0x00ffff;

    for (let h = 0; h < height; h++) {
      const cube = placeholderPool[poolIndex++];
      if (!cube) break;
      cube.visible = true;
      cube.material.color.set(color);
      cube.position.set(worldX, 0.5 + targetY + h, worldZ);
    }
  }

  isToStore = neighbours.map(({ gridX, gridZ }) => [gridX + 12, gridZ + 12]);
  isCanPlace = canPlace;
}

function setFloor(floor) {
  floorHeight = Number(floor);
  console.log(floorHeight);
  if (floorHeight > 8) {
    floorHeight = 8;
  }
  if (floorHeight < 1) {
    floorHeight = 1;
  }
}
function setWidth(width) {
  const widthDiv = document.getElementById("width");
  bWidth += width;
  if (bWidth > 10) {
    bWidth = 10;
  }
  if (bWidth < 1) {
    bWidth = 1;
  }
  widthDiv.innerHTML = bWidth;
}
function setDepth(depth) {
  const depthDiv = document.getElementById("depth");
  bDepth += depth;
  if (bDepth > 10) {
    bDepth = 10;
  }
  if (bDepth < 1) {
    bDepth = 1;
  }
  depthDiv.innerHTML = bDepth;
}

function setIsCreating(staus) {
  isCreating = staus;
}

function setIsAlreadyPlace(status) {
  isAlreadyPlace = status;
}

const buildingList = [];

const storeBuilding = (buffer) => {
  const name = buildingName;
  const buildingSchema = {
    name,
    id: "da86dbfb-dfd2-461e-8085-5cfa7dd219ce",
    buffers: [{ ...buffer }],
  };
  buildingList.push({ ...buildingSchema });
  isCanSave = true;
  console.log(buildingList, ":bl");
};

const deleteBuilding = (buffer) => {
  for (let height = 0; height < buffer.height; height++) {
    console.log(virtualGrid[height]);
    for (let x = buffer.start.x; x <= buffer.end.x; x++) {
      for (let z = buffer.start.z; z <= buffer.end.z; z++) {
        const cube = virtualGrid[height][x][z].cube;
        if (cube) {
          scene.remove(cube);
          cube.geometry.dispose();
          cube.material.dispose();
          virtualGrid[height][x][z].cube = null;
          virtualGrid[height][z][x].isFree = true;
        } else {
          console.log(x, z, ":dont' have cube");
        }
      }
    }
  }
  console.log(virtualGrid, ":virtualGrid");
  isToStore.length = 0;
  buildingList.length = 0;
  const startX = Math.floor(buffer.start.x / 5);
  const startZ = Math.floor(buffer.start.z / 5);
  let endX = Math.floor(buffer.end.x / 5);
  let endZ = Math.floor(buffer.end.z / 5);
  endX = endX < 1 ? 1 : endX;
  endZ = endZ < 1 ? 1 : endZ;
  console.log(startX, endX);
  console.log(startZ, endZ);
  for (let x = startX; x <= endX; x++) {
    for (let z = startZ; z <= endZ; z++) {
      virtualGrid2D[z][x] = 0;
    }
  }
  update2DGriudUI();
  setIsAlreadyPlace(false);
};

const onClearHandler = () => {
  const buffer = buildingList[0].buffers[0];
  deleteBuilding(buffer);
};
// const buffer = { start: {}, end: {}, height };
const getIsAlreadyPlace = () => isAlreadyPlace;

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(plane);
  const gridUnitSize = 1;
  const targetY = 0;

  if (intersects.length > 0 && !isDragging && isCreating && !isAlreadyPlace) {
    const point = intersects[0].point;
    const gridX = Math.floor(point.x + gridUnitSize / 2);
    const gridZ = Math.floor(point.z + gridUnitSize / 2);

    renderPlaceholder(gridX, gridZ, 1, targetY, floorHeight);
  } else {
    placeholderPool.forEach((cube) => {
      cube.visible = false;
    });
  }

  renderer.render(scene, camera);
}

animate();
