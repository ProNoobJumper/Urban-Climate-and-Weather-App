const fs = require("fs");
const path = require("path");

// Folders and the files inside them
const structure = {
  config: ["database.js", "constants.js"],
  models: [
    "User.js",
    "City.js",
    "RealtimeData.js",
    "HistoricalData.js",
    "PredictedData.js",
    "ResearchUpload.js"
  ],
  controllers: [
    "authController.js",
    "dataController.js",
    "researchController.js",
    "analyticsController.js"
  ],
  routes: [
    "auth.js",
    "data.js",
    "research.js",
    "analytics.js"
  ],
  services: [
    "apiAggregation.js",
    "dataProcessor.js",
    "predictionEngine.js",
    "cacheManager.js"
  ],
  middleware: [
    "auth.js",
    "validation.js",
    "errorHandler.js"
  ],
  jobs: [
    "fetchDataJob.js",
    "predictionJob.js"
  ],
  utils: [
    "logger.js",
    "helpers.js"
  ]
};

// Folders that exist but have no required files yet
const standaloneFolders = ["uploads"];

// Files in the root project folder
const rootFiles = [
  ".env",
  ".gitignore",
  "package.json",
  "server.js"
];

console.log("\n🚀 Creating climate-backend structure...\n");

// Create structured folders + files
for (const folder in structure) {
  const folderPath = path.join(__dirname, folder);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`📁 Folder created: ${folder}`);
  }

  structure[folder].forEach(file => {
    const filePath = path.join(folderPath, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "");
      console.log(`📄 File created: ${folder}/${file}`);
    }
  });
}

// Create standalone folders (like uploads/)
standaloneFolders.forEach(folder => {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`📁 Folder created: ${folder}`);
  }
});

// Create root files
rootFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "");
    console.log(`📄 Root file created: ${file}`);
  }
});

console.log("\n✅ Done! climate-backend structure created.\n");
