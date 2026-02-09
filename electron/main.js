const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const log = require("electron-log");
const { autoUpdater } = require("electron-updater");

let mainWindow;
let splashWindow;
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

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 360,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon: path.join(__dirname, "..", "public", "icon.png"),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, "splash.html"));
  splashWindow.center();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "LovHub",
    icon: path.join(__dirname, "..", "public", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    titleBarStyle: "default",
    backgroundColor: "#09090b",
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    // Small delay for splash effect
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
    }, 2500);
  });

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
  createSplash();
  startDaemon();
  createWindow();

  // Auto-update (only in packaged builds)
  if (!isDev) {
    setupAutoUpdater();
  }

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


// ── Auto Updater ──

function setupAutoUpdater() {
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Atualização Disponível",
      message: `Nova versão ${info.version} disponível. Deseja baixar agora?`,
      buttons: ["Baixar", "Depois"],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate();
        if (mainWindow) {
          mainWindow.webContents.send("update-status", "downloading");
        }
      }
    });
  });

  autoUpdater.on("update-not-available", () => {
    log.info("No updates available.");
  });

  autoUpdater.on("download-progress", (progress) => {
    if (mainWindow) {
      mainWindow.setProgressBar(progress.percent / 100);
      mainWindow.webContents.send("update-status", "downloading", Math.round(progress.percent));
    }
  });

  autoUpdater.on("update-downloaded", () => {
    if (mainWindow) {
      mainWindow.setProgressBar(-1);
    }
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Atualização Pronta",
      message: "A atualização foi baixada. O app será reiniciado para instalar.",
      buttons: ["Reiniciar Agora", "Depois"],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on("error", (err) => {
    log.error("Auto-update error:", err);
  });

  // Check for updates after 5 seconds
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.warn("Update check failed:", err.message);
    });
  }, 5000);
}
