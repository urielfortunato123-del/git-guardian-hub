const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow;
let daemonProcess;

const isDev = !app.isPackaged;
const DEV_URL = "http://localhost:8081";
const DAEMON_PORT = 8787;

function findPython() {
  const candidates = ["python3", "python"];
  for (const cmd of candidates) {
    try {
      require("child_process").execSync(`${cmd} --version`, { stdio: "ignore" });
      return cmd;
    } catch { /* next */ }
  }
  return null;
}

function startDaemon() {
  const python = findPython();
  if (!python) {
    console.warn("Python not found, daemon will not start automatically");
    return;
  }

  const agentPath = isDev
    ? path.join(__dirname, "..", "agent", "agent.py")
    : path.join(process.resourcesPath, "agent", "agent.py");

  if (!fs.existsSync(agentPath)) {
    console.warn("agent.py not found at", agentPath);
    return;
  }

  console.log(`Starting daemon: ${python} ${agentPath}`);
  daemonProcess = spawn(python, [agentPath], {
    stdio: "inherit",
    env: { ...process.env },
  });

  daemonProcess.on("error", (err) => {
    console.error("Daemon error:", err);
  });

  daemonProcess.on("exit", (code) => {
    console.log(`Daemon exited with code ${code}`);
    daemonProcess = null;
  });
}

function stopDaemon() {
  if (daemonProcess) {
    daemonProcess.kill();
    daemonProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "LovHub",
    icon: path.join(__dirname, "..", "public", "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow local API calls
    },
    titleBarStyle: "default",
    backgroundColor: "#0a0a0a",
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startDaemon();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopDaemon();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopDaemon();
});
