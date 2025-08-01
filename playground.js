// สร้าง scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// สร้างกล้อง
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 25, 5);
camera.lookAt(0, 0, 0);
let currentRotation = 0;

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") {
    currentRotation = (currentRotation + 90) % 360;
    console.log(currentRotation);
  }
});
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

const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
const lineGroup = new THREE.Group();

const size = 25;
const divisions = 25;
let dir = "top";
let isCanPlace = true;

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
// window.addEventListener("pointerup", (event) => {
//   const height = floorHeight;
//   const currentDragging = isDragging;
//   isDragging = false;
//   isClick = false;

//   if (currentDragging) return;

//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObject(plane);

//   const targetY = 0;
//   if (intersects.length > 0 && isCanPlace) {
//     const color = `${getRandomColor()}`;
//     isToStore.forEach(([x, z]) => {
//       for (let h = 0; h < height; h++) {
//         if (virtualGrid[targetY + h]?.[z]?.[x]) {
//           virtualGrid[targetY + h][z][x].isFree = false;

//           const worldX = virtualGrid[targetY + h][z][x].z;
//           const worldZ = virtualGrid[targetY + h][z][x].x;

//           const cube = new THREE.Mesh(
//             new THREE.BoxGeometry(1, 1, 1),
//             new THREE.MeshStandardMaterial({ color: color })
//           );
//           cube.position.set(worldX, 0.5 + targetY + h, worldZ);
//           scene.add(cube);
//         }
//       }
//     });
//   }
// });

const buildings = [
  {
    name: "B1",
    id: "da86dbfb-dfd2-461e-8085-5cfa7dd219ce",
    buffers: [
      {
        start: { x: 0, z: 0 },
        end: { x: 4, z: 4 },
        height: 2,
      },
    ],
  },
];

const session = {
  buildings: [],
  sessionId: "123124125125",
};

buildings.map((value) => {
  const color = `${getRandomColor()}`;
  const offset = 12;
  value.buffers.map((buffer) => {
    for (let height = 0; height < buffer.height; height++) {
      for (let xStart = buffer.start.x; xStart <= buffer.end.x; xStart++) {
        for (let zStart = buffer.start.z; zStart <= buffer.end.z; zStart++) {
          const cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: color })
          );
          cube.position.set(xStart - offset, 0.5 + height, zStart - offset);
          scene.add(cube);
        }
      }
    }
  });
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

  context.fillStyle = "black";
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
        row.push({ isFree: true, owner: "", x: x - 12, z: z - 12, y: y });
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

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  renderer.render(scene, camera);
}

animate();
