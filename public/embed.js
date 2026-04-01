(function() {
  // Extract agent ID from the script tag immediately before context is lost
  const scriptTag = document.currentScript || document.querySelector('script[data-agent-id]');
  
  const initWidget = async () => {
    const agentId = scriptTag ? scriptTag.getAttribute('data-agent-id') : null;
    
    if (!agentId) {
      console.error("AskYourSite: Missing data-agent-id attribute on the embed script.");
      return;
    }

    // Configuration
    const scriptUrl = scriptTag && scriptTag.src ? new URL(scriptTag.src) : { origin: "https://askyoursite.in" };
    const API_BASE = scriptUrl.origin;

    let widgetConfig = {
      primaryColor: '#3b82f6',
      welcomeMessage: 'Hi! How can I help you today?',
      logoUrl: '',
      name: 'AI Assistant'
    };

    try {
      const configRes = await fetch(API_BASE + '/api/widget/' + agentId);
      if (configRes.ok) {
        const data = await configRes.json();
        widgetConfig = { ...widgetConfig, ...data };
      }
    } catch (err) {
      console.warn("AskYourSite: Failed to load widget config", err);
    }

    if (!window.marked) {
      const ms = document.createElement('script');
      ms.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
      document.head.appendChild(ms);
    }
  
  const STYLES = `
    #ays-widget-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: ${widgetConfig.fontFamily || 'system-ui, -apple-system, sans-serif'};
    }
    
    #ays-chat-button {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border: none;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    #ays-chat-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
    }
    
    #ays-chat-button svg {
      fill: white;
      width: 28px;
      height: 28px;
    }
    
    #ays-chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      height: 600px;
      max-height: calc(100vh - 120px);
      max-width: calc(100vw - 48px);
      background: ${widgetConfig.bgColor || '#0a0a0a'};
      border: 1px solid #1e293b;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    #ays-chat-window.ays-open {
      display: flex;
      opacity: 1;
      transform: translateY(0);
    }
    
    #ays-chat-header {
      background: ${widgetConfig.primaryColor};
      padding: 16px 20px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    #ays-chat-header-title {
      color: #ffffff;
      font-weight: 600;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #ays-chat-header-title::before {
      content: '';
      display: block;
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }
    
    #ays-chat-close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
    }
    #ays-chat-close:hover {
      color: #ffffff;
    }
    
    #ays-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .ays-message-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      width: 100%;
    }
    .ays-message-row.model {
      justify-content: flex-start;
    }
    .ays-message-row.user {
      justify-content: flex-end;
    }

    .ays-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-bottom: 2px;
      overflow: hidden;
    }
    .ays-avatar svg {
      width: 16px;
      height: 16px;
      stroke: #3b82f6;
    }

    .ays-message {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    
    .ays-message.model {
      background: #1e293b;
      color: #f8fafc;
      border-bottom-left-radius: 4px;
      border: 1px solid #334155;
    }
    
    .ays-message.user {
      background: rgba(59, 130, 246, 0.2);
      color: #ffffff;
      border-bottom-right-radius: 4px;
      border: 1px solid rgba(59, 130, 246, 0.3);
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
    }

    .ays-typing {
      display: flex;
      gap: 4px;
      padding: 16px;
      align-self: flex-start;
      background: #1e293b;
      border-radius: 16px;
      border-top-left-radius: 4px;
      border: 1px solid #334155;
    }

    .ays-typing-dot {
      width: 6px;
      height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      animation: ays-bounce 1.4s infinite ease-in-out both;
    }
    .ays-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .ays-typing-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes ays-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    
    #ays-chat-form {
      display: flex;
      padding: 16px;
      background: ${widgetConfig.bgColor || '#0a0a0a'};
      border-top: 1px solid #1e293b;
      gap: 8px;
    }
    
    #ays-chat-input {
      flex: 1;
      background: transparent;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 12px 16px;
      color: ${widgetConfig.textColor || '#ffffff'};
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    #ays-chat-input:focus {
      border-color: ${widgetConfig.primaryColor};
    }
    
    #ays-chat-send {
      background: ${widgetConfig.primaryColor};
      color: white;
      border: none;
      border-radius: 12px;
      padding: 0 16px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }
    
    #ays-chat-send:hover {
      background: #60a5fa;
    }
    #ays-chat-send:disabled {
      background: #1e293b;
      color: #64748b;
      cursor: not-allowed;
    }
    
    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 3px;
    }
    
    #ays-chat-footer {
      text-align: center;
      padding: 0px 0 12px;
      font-size: 11px;
      background: ${widgetConfig.bgColor || '#0a0a0a'};
    }
    #ays-chat-footer a {
      color: #64748b;
      text-decoration: none;
      transition: color 0.2s;
    }
    #ays-chat-footer a:hover {
      color: ${widgetConfig.primaryColor || '#3b82f6'};
    }

    .ays-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
      padding-left: 36px;
    }

    .ays-suggestion-btn {
      background: transparent;
      border: 1px solid ${widgetConfig.primaryColor || '#3b82f6'};
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 12px;
      color: ${widgetConfig.primaryColor || '#3b82f6'};
      cursor: pointer;
      font-family: inherit;
      line-height: 1.4;
      transition: opacity 0.2s ease;
    }

    .ays-suggestion-btn:hover {
      opacity: 0.75;
    }

    #ays-image-preview-area {
      padding: 8px 16px 0;
      display: none;
      align-items: center;
      gap: 8px;
    }
    #ays-image-preview-area.visible { display: flex; }

    #ays-image-thumb {
      width: 56px;
      height: 56px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #334155;
    }

    #ays-image-clear {
      background: #334155;
      border: none;
      color: #94a3b8;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #ays-image-clear:hover { background: #ef4444; color: #fff; }

    #ays-image-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0 6px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color 0.2s;
    }
    #ays-image-btn:hover { color: ${widgetConfig.primaryColor || '#3b82f6'}; }
    #ays-image-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; }

    #ays-lead-form {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 24px 20px;
      gap: 16px;
    }
    #ays-lead-form h3 {
      color: ${widgetConfig.textColor || '#ffffff'};
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px;
    }
    #ays-lead-form p {
      color: #94a3b8;
      font-size: 13px;
      margin: 0 0 8px;
    }
    .ays-lead-input {
      width: 100%;
      background: transparent;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 10px 14px;
      color: ${widgetConfig.textColor || '#ffffff'};
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    .ays-lead-input:focus { border-color: ${widgetConfig.primaryColor || '#3b82f6'}; }
    .ays-lead-input::placeholder { color: #475569; }
    #ays-lead-submit {
      background: ${widgetConfig.primaryColor || '#3b82f6'};
      color: white;
      border: none;
      border-radius: 10px;
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      font-family: inherit;
    }
    #ays-lead-submit:hover { background: #60a5fa; }
    #ays-lead-submit:disabled { background: #1e293b; color: #64748b; cursor: not-allowed; }
    #ays-lead-error {
      color: #f87171;
      font-size: 12px;
      margin: -8px 0 0;
      display: none;
    }

    .ays-user-image {
      max-height: 120px;
      border-radius: 8px;
      margin-bottom: 4px;
      display: block;
      object-fit: contain;
    }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.innerHTML = STYLES;
  document.head.appendChild(styleEl);

  // Build UI
  const container = document.createElement('div');
  container.id = 'ays-widget-container';

  const windowEl = document.createElement('div');
  windowEl.id = 'ays-chat-window';

  const headerEl = document.createElement('div');
  headerEl.id = 'ays-chat-header';
  headerEl.innerHTML = `
    <div id="ays-chat-header-title">${widgetConfig.name}</div>
    <button id="ays-chat-close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  const botIconSvg = widgetConfig.logoUrl 
    ? `<img src="${widgetConfig.logoUrl}" style="width:100%;height:100%;object-fit:contain;background:white;" alt="Bot" />`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${widgetConfig.primaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`;

  const messagesEl = document.createElement('div');
  messagesEl.id = 'ays-chat-messages';
  messagesEl.innerHTML = `
    <div class="ays-message-row model">
      <div class="ays-avatar">${botIconSvg}</div>
      <div class="ays-message model">${widgetConfig.welcomeMessage}</div>
    </div>
  `;

  // Image preview area (above the form)
  const imagePreviewArea = document.createElement('div');
  imagePreviewArea.id = 'ays-image-preview-area';
  imagePreviewArea.innerHTML = `
    <img id="ays-image-thumb" src="" alt="Preview" />
    <button type="button" id="ays-image-clear" title="Remove image">✕</button>
  `;

  const formEl = document.createElement('form');
  formEl.id = 'ays-chat-form';
  formEl.innerHTML = `
    ${widgetConfig.image_search_enabled ? `<input type="file" id="ays-image-input" accept="image/*" style="display:none" />` : ''}
    ${widgetConfig.image_search_enabled ? `<button type="button" id="ays-image-btn" title="Upload image to search">
      <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    </button>` : ''}
    <input type="text" id="ays-chat-input" placeholder="${widgetConfig.placeholder || 'Type a message...'}" autocomplete="off" />
    <button type="submit" id="ays-chat-send">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
    </button>
  `;

  // Lead capture form (shown before chat if enabled and not yet submitted)
  const sessionKey = 'ays_lead_' + agentId;
  const leadAlreadySubmitted = sessionStorage.getItem(sessionKey) === '1';
  const showLeadForm = widgetConfig.lead_capture_enabled === true && !leadAlreadySubmitted;

  const leadFormEl = document.createElement('div');
  leadFormEl.id = 'ays-lead-form';
  leadFormEl.innerHTML = `
    <h3>Before we start...</h3>
    <p>Enter your details to begin chatting with our AI assistant.</p>
    <input class="ays-lead-input" id="ays-lead-name" type="text" placeholder="Your name (optional)" autocomplete="name" />
    <input class="ays-lead-input" id="ays-lead-email" type="email" placeholder="Your email *" autocomplete="email" required />
    <span id="ays-lead-error">Please enter a valid email address.</span>
    <button id="ays-lead-submit" type="button">Start Chat →</button>
  `;

  windowEl.appendChild(headerEl);
  if (showLeadForm) {
    windowEl.appendChild(leadFormEl);
  } else {
    windowEl.appendChild(messagesEl);
    windowEl.appendChild(imagePreviewArea);
    windowEl.appendChild(formEl);
  }
  
  if (widgetConfig.show_branding !== false) {
    const footerEl = document.createElement('div');
    footerEl.id = 'ays-chat-footer';
    footerEl.innerHTML = `
      <a href="https://askyoursite.in/" target="_blank" rel="noopener noreferrer">⚡ Powered by AskYourSite.in</a>
    `;
    windowEl.appendChild(footerEl);
  }

  const buttonEl = document.createElement('button');
  buttonEl.id = 'ays-chat-button';
  buttonEl.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

  container.appendChild(windowEl);
  container.appendChild(buttonEl);
  document.body.appendChild(container);

  // Logic
  let isOpen = false;
  let conversation = [{ role: 'assistant', content: 'Hi! How can I help you today?' }];
  let isTyping = false;
  let pendingImageBase64 = null;
  let pendingImageMimeType = null;

  // Image upload handling (only wired up when image_search_enabled)
  const imageInput = document.getElementById('ays-image-input');
  const imagePreviewImg = document.getElementById('ays-image-thumb');

  if (imageInput) {
    document.getElementById('ays-image-btn').addEventListener('click', () => imageInput.click());

    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const [header, base64] = dataUrl.split(',');
        pendingImageBase64 = base64;
        pendingImageMimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
        imagePreviewImg.src = dataUrl;
        imagePreviewArea.classList.add('visible');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });
  }

  document.getElementById('ays-image-clear').addEventListener('click', () => {
    pendingImageBase64 = null;
    pendingImageMimeType = null;
    imagePreviewArea.classList.remove('visible');
    if (imagePreviewImg) imagePreviewImg.src = '';
  });

  // Lead form submission
  if (showLeadForm) {
    document.getElementById('ays-lead-submit').addEventListener('click', async () => {
      const nameVal = document.getElementById('ays-lead-name').value.trim();
      const emailVal = document.getElementById('ays-lead-email').value.trim();
      const errorEl = document.getElementById('ays-lead-error');
      const submitBtn = document.getElementById('ays-lead-submit');

      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        errorEl.style.display = 'block';
        return;
      }
      errorEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Starting...';

      try {
        await fetch(API_BASE + '/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assistantId: agentId, sessionId: crypto.randomUUID(), name: nameVal || null, email: emailVal })
        });
      } catch (e) { /* non-blocking — proceed even if lead save fails */ }

      sessionStorage.setItem(sessionKey, '1');

      // Replace lead form with chat UI
      leadFormEl.remove();
      windowEl.appendChild(messagesEl);
      windowEl.appendChild(imagePreviewArea);
      windowEl.appendChild(formEl);
      if (widgetConfig.show_branding !== false) {
        const brandFooter = document.createElement('div');
        brandFooter.id = 'ays-chat-footer';
        brandFooter.innerHTML = `<a href="https://askyoursite.in/" target="_blank" rel="noopener noreferrer">⚡ Powered by AskYourSite.in</a>`;
        windowEl.appendChild(brandFooter);
      }
      document.getElementById('ays-chat-input')?.focus();
    });
  }

  const toggleChat = () => {
    isOpen = !isOpen;
    if (isOpen) {
      windowEl.classList.add('ays-open');
    } else {
      windowEl.classList.remove('ays-open');
    }
  };

  buttonEl.addEventListener('click', toggleChat);
  headerEl.querySelector('#ays-chat-close').addEventListener('click', toggleChat);

  const formatMessage = (text) => {
    if (window.marked) {
      return marked.parse(text);
    }
    return text;
  };

  const addMessage = (role, content) => {
    const row = document.createElement('div');
    row.className = `ays-message-row ${role}`;

    if (role === 'model') {
      const avatar = document.createElement('div');
      avatar.className = 'ays-avatar';
      avatar.innerHTML = botIconSvg;
      row.appendChild(avatar);
    }

    const msg = document.createElement('div');
    msg.className = `ays-message ${role}`;
    
    if (role === 'model') {
      msg.innerHTML = formatMessage(content);
    } else {
      msg.textContent = content;
    }
    
    row.appendChild(msg);

    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  };

  const showTyping = () => {
    const typing = document.createElement('div');
    typing.className = 'ays-typing';
    typing.id = 'ays-typing-indicator';
    typing.innerHTML = '<div class="ays-typing-dot"></div><div class="ays-typing-dot"></div><div class="ays-typing-dot"></div>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const hideTyping = () => {
    const typing = document.getElementById('ays-typing-indicator');
    if (typing) typing.remove();
  };

  const removeSuggestions = () => {
    const el = document.getElementById('ays-suggestions-container');
    if (el) el.remove();
  };

  const renderSuggestions = (questions) => {
    removeSuggestions();
    const container = document.createElement('div');
    container.className = 'ays-suggestions';
    container.id = 'ays-suggestions-container';
    questions.forEach((q) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ays-suggestion-btn';
      btn.textContent = q;
      btn.addEventListener('click', () => {
        removeSuggestions();
        const inputEl = document.getElementById('ays-chat-input');
        inputEl.value = q;
        formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
      container.appendChild(btn);
    });
    messagesEl.appendChild(container);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isTyping) return;

    const input = document.getElementById('ays-chat-input');
    const text = input.value.trim();
    if (!text && !pendingImageBase64) return;

    const currentImageBase64 = pendingImageBase64;
    const currentImageMimeType = pendingImageMimeType;
    pendingImageBase64 = null;
    pendingImageMimeType = null;
    imagePreviewArea.classList.remove('visible');
    imagePreviewImg.src = '';

    const userText = text || '🔍 Image search';
    input.value = '';
    removeSuggestions();

    // Render user message (with image thumbnail if present)
    const userRow = document.createElement('div');
    userRow.className = 'ays-message-row user';
    const userMsg = document.createElement('div');
    userMsg.className = 'ays-message user';
    if (currentImageBase64) {
      const imgEl = document.createElement('img');
      imgEl.src = `data:${currentImageMimeType};base64,${currentImageBase64}`;
      imgEl.className = 'ays-user-image';
      userMsg.appendChild(imgEl);
    }
    userMsg.appendChild(document.createTextNode(userText));
    userRow.appendChild(userMsg);
    messagesEl.appendChild(userRow);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    conversation.push({ role: 'user', content: userText });

    isTyping = true;
    showTyping();
    document.getElementById('ays-chat-send').disabled = true;

    try {
      const response = await fetch(API_BASE + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation,
          assistantId: agentId,
          ...(currentImageBase64 && {
            imageBase64: currentImageBase64,
            imageMimeType: currentImageMimeType,
          }),
        })
      });

      hideTyping();

      if (!response.ok) throw new Error("API Error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const msgEl = addMessage('model', '');
      const DELIMITER = '__AYS_SUGGESTIONS__';
      let mainResponse = '';
      let suggestionsBuffer = '';
      let delimiterFound = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        if (delimiterFound) {
          suggestionsBuffer += chunk;
        } else {
          mainResponse += chunk;
          const delimIdx = mainResponse.indexOf(DELIMITER);
          if (delimIdx !== -1) {
            delimiterFound = true;
            const cleanText = mainResponse.substring(0, delimIdx);
            suggestionsBuffer = mainResponse.substring(delimIdx + DELIMITER.length);
            mainResponse = cleanText;
          }
          msgEl.innerHTML = formatMessage(mainResponse);
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      }

      // Parse suggestions after stream fully ends
      if (delimiterFound && suggestionsBuffer) {
        try {
          const parsed = JSON.parse(suggestionsBuffer.trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
            renderSuggestions(parsed);
          }
        } catch (e) { /* skip malformed suggestions */ }
      }

      conversation.push({ role: 'assistant', content: mainResponse });

    } catch (err) {
      console.error("Chat error:", err);
      hideTyping();
      addMessage('model', 'Failed to connect to the agent.');
    } finally {
      isTyping = false;
      document.getElementById('ays-chat-send').disabled = false;
      input.focus();
    }
  });

  }; // End of initWidget

  // Ensure DOM is fully loaded before injecting widget elements
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
