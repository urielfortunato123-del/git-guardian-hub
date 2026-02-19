// 🔮 LEIGOS ACADEMY - Background Service Worker

// Importar módulos
importScripts("supabase-config.js"); // Supabase Edge Functions
importScripts("security.js"); // Assinatura HMAC
importScripts("license.js"); // Gerenciamento de licenças

// Listener para abrir extensão quando clicar no ícone
chrome.action.onClicked.addListener(async (tab) => {
  // Verificar se o navegador suporta sidepanel
  if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
    try {
      // Tentar abrir como sidepanel (Chrome, Edge, etc)
      await chrome.sidePanel.open({ windowId: tab.windowId });
      console.log('[Extension] Aberto como sidepanel');
    } catch (error) {
      console.error('[Extension] Erro ao abrir sidepanel, abrindo como popup:', error);
      // Se falhar, abrir como popup
      openAsPopup();
    }
  } else {
    // Navegador não suporta sidepanel (Opera GX, etc) - abrir como popup
    console.log('[Extension] Sidepanel não suportado, abrindo como popup');
    openAsPopup();
  }
});

// Função auxiliar para abrir como popup
async function openAsPopup() {
  try {
    await chrome.windows.create({
      url: chrome.runtime.getURL("popup.html"),
      type: "popup",
      width: 400,
      height: 600,
      left: 100,
      top: 100,
      focused: true,
    });
    console.log('[Extension] Popup aberto com sucesso');
  } catch (error) {
    console.error('[Extension] Erro ao abrir popup:', error);
  }
}

// Interceptor de Token
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const authHeader = details.requestHeaders.find(
      (header) => header.name.toLowerCase() === "authorization",
    );

    if (authHeader && authHeader.value) {
      const token = authHeader.value.replace("Bearer ", "").trim();
      if (token.length > 20) {
        chrome.storage.local.set({ authToken: token, lovable_token: token });
      }
    }

    // Capturar Project ID da URL da requisição
    const urlMatch = details.url.match(/projects\/([a-f0-9-]+)/);
    if (urlMatch && urlMatch[1]) {
      chrome.storage.local.set({ projectId: urlMatch[1] });
    }
  },
  { urls: ["https://api.lovable.dev/*"] },
  ["requestHeaders"],
);

// ===== SHIELD: Detectar fechamento do painel e remover shield =====

// Executar shield via script tag injection (MAIN world guarantido)
async function executeShieldOnTab(enable) {
  try {
    const tabs = await chrome.tabs.query({ url: '*://*.lovable.dev/*' });
    console.log('[Shield BG] Tabs encontradas:', tabs.length);
    const shieldFileUrl = chrome.runtime.getURL('shield-inject.js');
    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (action, scriptUrl) => {
            document.documentElement.setAttribute('data-shield-action', action ? 'enable' : 'disable');
            var s = document.createElement('script');
            s.src = scriptUrl + '?t=' + Date.now();
            s.onload = function() { s.remove(); };
            s.onerror = function() { console.error('[Shield] Falha ao carregar script'); s.remove(); };
            (document.head || document.documentElement).appendChild(s);
          },
          args: [enable, shieldFileUrl]
        });
        console.log('[Shield BG] executeScript OK na tab', tab.id);
      } catch (e) {
        console.error('[Shield BG] executeScript falhou:', e);
      }
    }
  } catch (e) {
    console.error('[Shield BG] Erro geral:', e);
  }
}

function removeShieldFromAllTabs() {
  executeShieldOnTab(false);
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'shield-panel') {
    console.log('[Shield BG] Painel conectado');
    port.onDisconnect.addListener(() => {
      console.log('[Shield BG] Painel desconectado - removendo shield');
      removeShieldFromAllTabs();
    });
  }
});
// ===== FIM SHIELD =====

// Listener de mensagens
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Ping
  if (request.action === "ping") {
    sendResponse("pong");
    return;
  }

  // Abrir popup (desprender)
  if (request.action === "openPopup") {
    (async () => {
      try {
        console.log("Abrindo popup...");

        // Abrir popup imediatamente
        const newWindow = await chrome.windows.create({
          url: chrome.runtime.getURL("popup.html"),
          type: "popup",
          width: 400,
          height: 600,
          left: 100,
          top: 100,
          focused: true,
        });

        console.log("Popup criado:", newWindow.id);
        sendResponse({ success: true, windowId: newWindow.id });
      } catch (error) {
        console.error("Erro ao abrir popup:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // enhance-prompt agora é chamado diretamente via Edge Function no popup.js

  // Handlers do license.js
  if (request.action === "saveToken") {
    handleSaveToken(request.token).then(sendResponse);
    return true;
  }

  if (request.action === "getToken") {
    handleGetToken().then(sendResponse);
    return true;
  }

  if (request.action === "saveProjectId") {
    handleSaveProjectId(request.projectId).then(sendResponse);
    return true;
  }

  if (request.action === "getProjectId") {
    handleGetProjectId().then(sendResponse);
    return true;
  }

  // getCredits removido - buscado direto da API Lovable no popup.js

  if (request.action === "sendMessage") {
    processMessageSend(request.data).then(sendResponse);
    return true;
  }

  // createNewProject e publish-project agora são chamados diretamente via Edge Function/API no popup.js

  if (request.action === "executeShield") {
    executeShieldOnTab(request.enabled).then(() => {
      sendResponse({ success: true });
    }).catch((e) => {
      sendResponse({ success: false, error: e.message });
    });
    return true;
  }

  if (request.action === "checkLicense") {
    handleCheckLicense().then(sendResponse);
    return true;
  }

  if (
    request.action === "licenseActivated" ||
    request.action === "licenseRemoved"
  ) {
    sendResponse({ success: true });
    return true;
  }

  sendResponse({ success: false, error: "Ação desconhecida" });
  return true;
});

// ===== VALIDAÇÃO DE SESSÃO EM TEMPO REAL =====

let sessionCheckInterval = null;

// Verificar se sessão ainda é válida (detecta acesso simultâneo em tempo real)
async function checkSessionValidity() {
  try {
    const license = await getSavedLicense();
    
    // Só validar se tiver licença
    if (!license || !license.key) {
      console.log('[Session Check] Sem licença, pulando validação');
      return;
    }

    const hwid = await getInstallationId();
    const result = await validateLicenseSupabase(license.key, hwid);

    // Se retornar erro 401 com requiresRelogin ou concurrentAccessDetected
    if (!result.valid && (result.requiresRelogin || result.concurrentAccessDetected)) {
      console.warn('⚠️ [Session Check] Acesso simultâneo detectado! Forçando logout...');
      
      // Limpar licença do storage
      await removeLicense();
      
      // Notificar popup para atualizar UI (se estiver aberto)
      chrome.runtime.sendMessage({
        action: 'forceLogout',
        reason: result.error || 'Acesso simultâneo detectado! Por segurança, você foi deslogado.'
      }).catch(() => {
        // Popup pode não estar aberto, ignorar erro
      });

      // Parar polling de sessão
      stopSessionCheck();
      
      // Parar tracking de usuários ativos
      stopActiveUsersTracking();
      
      return;
    }

    // Se licença expirou ou ficou inválida
    if (!result.valid) {
      console.warn('⚠️ [Session Check] Licença inválida detectada');
      
      await removeLicense();
      
      chrome.runtime.sendMessage({
        action: 'forceLogout',
        reason: result.error || 'Licença inválida ou expirada'
      }).catch(() => {});
      
      stopSessionCheck();
      stopActiveUsersTracking();
    }

  } catch (error) {
    console.error('[Session Check] Erro ao validar sessão:', error);
  }
}

// Iniciar verificação periódica de sessão (a cada 3 segundos para detecção quase instantânea)
function startSessionCheck() {
  // Verificar imediatamente
  checkSessionValidity();
  
  // Verificar a cada 3 segundos para logout quase instantâneo
  if (!sessionCheckInterval) {
    sessionCheckInterval = setInterval(checkSessionValidity, 3 * 1000);
    console.log('[Session Check] Validação iniciada (a cada 3 segundos - detecção rápida)');
  }
}

// Parar verificação de sessão
function stopSessionCheck() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
    console.log('[Session Check] Validação parada');
  }
}

// ===== RASTREAMENTO DE USUÁRIOS ATIVOS =====

let activeUsersInterval = null;

// Enviar heartbeat para a edge function
async function sendActiveUsersHeartbeat() {
  try {
    const license = await getSavedLicense();
    
    // Só enviar heartbeat se tiver licença válida
    if (!license || !license.key) {
      console.log('[Active Users] Sem licença, pulando heartbeat');
      return;
    }

    const response = await fetch(`${SUPABASE_CONFIG.URL}${SUPABASE_CONFIG.FUNCTIONS.ACTIVE_USERS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
        'x-extension-version': chrome.runtime.getManifest().version
      },
      body: JSON.stringify({
        licenseKey: license.key,
        action: 'heartbeat'
      })
    });

    if (!response.ok) {
      console.error('[Active Users] Heartbeat falhou:', response.status);
      return;
    }

    const data = await response.json();
    console.log('[Active Users] Heartbeat enviado. Usuários online:', data.activeUsers);

    // Enviar número de usuários ativos para o popup (se estiver aberto)
    chrome.runtime.sendMessage({
      action: 'updateActiveUsers',
      count: data.activeUsers
    }).catch(() => {
      // Popup pode não estar aberto, ignorar erro
    });

  } catch (error) {
    console.error('[Active Users] Erro ao enviar heartbeat:', error);
  }
}

// Iniciar rastreamento de usuários ativos
function startActiveUsersTracking() {
  // Enviar heartbeat imediatamente
  sendActiveUsersHeartbeat();

  // Enviar heartbeat a cada 2 minutos
  if (!activeUsersInterval) {
    activeUsersInterval = setInterval(sendActiveUsersHeartbeat, 2 * 60 * 1000);
    console.log('[Active Users] Tracking iniciado (heartbeat a cada 2 minutos)');
  }
}

// Parar rastreamento de usuários ativos
function stopActiveUsersTracking() {
  if (activeUsersInterval) {
    clearInterval(activeUsersInterval);
    activeUsersInterval = null;
    console.log('[Active Users] Tracking parado');
  }
}

// Iniciar tracking quando a extensão carregar
startActiveUsersTracking();
startSessionCheck();

// Listener para iniciar/parar tracking quando licença for ativada/removida
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'licenseActivated') {
    startActiveUsersTracking();
    startSessionCheck();
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'licenseRemoved') {
    stopActiveUsersTracking();
    stopSessionCheck();
    sendResponse({ success: true });
    return true;
  }
});

// ===== FIM RASTREAMENTO DE USUÁRIOS ATIVOS =====
