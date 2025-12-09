let model;
let video = document.getElementById("camera");
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let detectedList = document.getElementById("detectedList");

let records = JSON.parse(localStorage.getItem("records") || "[]");

const WASTE_MAP = {
    "bottle": { type: "Plastic", recyclable: true },
    "cup": { type: "Paper", recyclable: true },
    "book": { type: "Paper", recyclable: true },
    "banana": { type: "Organic", recyclable: false },
    "apple": { type: "Organic", recyclable: false },
    "can": { type: "Metal", recyclable: true },
    "fork": { type: "Plastic", recyclable: true },
    "knife": { type: "Plastic", recyclable: true },
    "bowl": { type: "Glass", recyclable: true },
    "vase": { type: "Glass", recyclable: true }
};

// Switch Pages
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    if (id === "records") loadRecords();
    if (id === "analytics") loadAnalytics();
}

// Load TensorFlow Model
async function loadModel() {
    model = await cocoSsd.load();
    console.log("Model loaded!");
}
loadModel();

// Start Camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            detectLoop();
        };
    });

// Detection Loop
async function detectLoop() {
    if (!model) return requestAnimationFrame(detectLoop);

    const predictions = await model.detect(video);
    ctx.drawImage(video, 0, 0);

    detectedList.innerHTML = "";

    predictions.forEach(pred => {
        if (pred.score < 0.60) return;

        let waste = WASTE_MAP[pred.class];
        if (!waste) return;

        let li = document.createElement("li");
        li.textContent = `${pred.class} → ${waste.type}`;
        li.onclick = () => saveRecord(pred.class, waste.type, waste.recyclable);

        detectedList.appendChild(li);
    });

    requestAnimationFrame(detectLoop);
}

// Save Record
function saveRecord(name, type, recyclable) {
    records.push({ name, type, recyclable, time: new Date().toLocaleString() });
    localStorage.setItem("records", JSON.stringify(records));
    alert("Item Saved!");
}

// Load Records
function loadRecords() {
    let list = document.getElementById("recordsList");
    list.innerHTML = "";

    records.forEach(r => {
        let li = document.createElement("li");
        li.textContent = `${r.name} (${r.type}) – ${r.recyclable ? "Recyclable" : "Non-Recyclable"} | ${r.time}`;
        list.appendChild(li);
    });
}

// Analytics
function loadAnalytics() {
    let output = document.getElementById("analyticsOutput");

    let total = records.length;
    let recyclable = records.filter(r => r.recyclable).length;

    output.innerHTML = `
        <p><b>Total Items:</b> ${total}</p>
        <p><b>Recyclable:</b> ${recyclable}</p>
        <p><b>Non-Recyclable:</b> ${total - recyclable}</p>
    `;
}
