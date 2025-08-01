let currentMenu = "Campus";

const initializeEditor = () => {};
const changeMenuHandler = (menu) => {
  currentMenu = menu;
  console.log(currentMenu);
  const menus = [
    { name: "Campus", content: "campus-content" },
    { name: "Create", content: "create-content" },
  ];
  menus.map((value) => {
    const element = document.getElementById(value.name);
    const content = document.getElementById(value.content);
    const bg = value.name === menu ? "#435dc7" : "transparent";
    element.style.backgroundColor = bg;
    content.style.display = value.name === menu ? "block" : "none";
    console.log(content, ":content");
  });
};

const floorInput = document.getElementById("floor-input");
const buildingNameInput = document.getElementById("username-input");
let formFloor = 1;
let buildingName;

const isCanCreate = () => formFloor && buildingName;
const doneTypingDelay = 500; // ms
buildingNameInput.addEventListener("input", (e) => {
  buildingName = e.target.value;
});
buildingNameInput.addEventListener("focusin", () => {
  setIsTyping(true);
});
buildingNameInput.addEventListener("focusout", () => {
  setIsTyping(false);
});
floorInput.addEventListener("change", (e) => {
  const floor = Number(e.target.value);
  formFloor = floor;
  if (floor > 8) {
    floorInput.value = 8;
  }
  if (floor < 1) {
    floorInput.value = 1;
  }
  setFloor(floor);
});
document.querySelector("select").addEventListener("change", (e) => {
  e.target.blur(); // เคลียร์ focus ออกจาก select
});
const inputSelect = document.getElementById("input-select");
inputSelect.addEventListener("change", (e) => {
  const type = e.target.value;
  ChangeBuildHandler(type);
});
const startCreateBuilding = () => {
  setIsCreating(true);
  changeMenuHandler(`Create`);
};

const stopCreateBuilding = () => {
  setIsCreating(false);
  changeMenuHandler(`Campus`);
};
changeMenuHandler(currentMenu);
