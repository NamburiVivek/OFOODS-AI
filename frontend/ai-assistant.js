// OFoods Floating AI Shopping Assistant Widget
// ═══════════════════════════════════════════════════
// This uses the SAME cart mechanism as the rest of OFoods:
//   - localStorage key: of_cart_{userId} or of_cart_guest
//   - Cart value: { "productId": quantity_integer, ... }
//   - Metadata: of_cart_meta_{productId} = { name, price, emoji, img }
//   - Calls OF.refreshBadge() to sync header count
// ═══════════════════════════════════════════════════
(function () {
    if (window.__ofoodsAIAssistantInitialized) return;
    window.__ofoodsAIAssistantInitialized = true;

    let API_URL = 'https://ofoods26-ecommerce.vercel.app/api/ai/commerce/recommend';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
        API_URL = 'http://localhost:3000/api/ai/commerce/recommend';
    }

    // ── CART HELPERS (mirrors the REAL OFoods cart exactly) ──
    function _getUser() {
        try { return JSON.parse(localStorage.getItem('of_user') || 'null'); } catch(e) { return null; }
    }
    function _cartKey() {
        const u = _getUser();
        return u ? 'of_cart_' + u.id : 'of_cart_guest';
    }
    function _getCart() {
        try { return JSON.parse(localStorage.getItem(_cartKey()) || '{}'); } catch(e) { return {}; }
    }
    function _saveCart(cart) {
        localStorage.setItem(_cartKey(), JSON.stringify(cart));
    }
    function _refreshBadge() {
        // Use window.OF if available (same page), otherwise manually update
        if (typeof OF !== 'undefined' && OF.refreshBadge) {
            OF.refreshBadge();
        } else {
            const el = document.getElementById('nav-badge');
            if (el) {
                const cart = _getCart();
                const n = Object.values(cart).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
                el.textContent = n;
                el.style.display = n > 0 ? 'flex' : 'none';
            }
        }
    }
    function _toast(msg) {
        if (typeof OF !== 'undefined' && OF.toast) {
            OF.toast(msg);
        } else {
            const t = document.getElementById('toast');
            if (t) {
                t.innerHTML = msg;
                t.classList.add('show');
                setTimeout(() => t.classList.remove('show'), 2800);
            }
        }
    }

    /**
     * Add a product to the real OFoods cart.
     * Cart format: { "productId": quantity_integer }
     * Metadata: of_cart_meta_{productId} = { name, price }
     */
    function addToRealCart(productId, name, price, qty) {
        const key = String(productId);
        const cart = _getCart();
        cart[key] = (cart[key] || 0) + qty;
        _saveCart(cart);
        // Also store metadata so cart.html can resolve the item
        localStorage.setItem('of_cart_meta_' + key, JSON.stringify({
            name: name,
            price: price,
            emoji: '',
            img: ''
        }));
        _refreshBadge();
        _toast('🛒 ' + name + ' × ' + qty + ' added to cart!');
    }

    function removeFromRealCart(productId) {
        const key = String(productId);
        const cart = _getCart();
        delete cart[key];
        _saveCart(cart);
        localStorage.removeItem('of_cart_meta_' + key);
        _refreshBadge();
        _toast('🗑️ Item removed from cart.');
    }

    function decreaseInRealCart(productId, qty) {
        const key = String(productId);
        const cart = _getCart();
        if (cart[key]) {
            cart[key] = Math.max(0, cart[key] - qty);
            if (cart[key] <= 0) delete cart[key];
        }
        _saveCart(cart);
        _refreshBadge();
    }

    function clearRealCart() {
        _saveCart({});
        _refreshBadge();
        _toast('🗑️ Cart cleared.');
    }

    function getCartSummary() {
        const cart = _getCart();
        const keys = Object.keys(cart).filter(k => cart[k] > 0);
        if (keys.length === 0) return 'Your cart is empty.';
        let total = 0;
        const lines = keys.map(k => {
            let meta = null;
            try { meta = JSON.parse(localStorage.getItem('of_cart_meta_' + k) || 'null'); } catch(e) {}
            const name = meta ? meta.name : 'Item #' + k;
            const price = meta ? meta.price : 0;
            const qty = cart[k];
            total += price * qty;
            return `• ${name} × ${qty} — ₹${price * qty}`;
        });
        return lines.join('\n') + '\n\n**Total: ₹' + total + '**';
    }

    function getCartTotal() {
        const cart = _getCart();
        const keys = Object.keys(cart).filter(k => cart[k] > 0);
        let total = 0;
        keys.forEach(k => {
            let meta = null;
            try { meta = JSON.parse(localStorage.getItem('of_cart_meta_' + k) || 'null'); } catch(e) {}
            const price = meta ? meta.price : 0;
            total += price * cart[k];
        });
        return total;
    }

    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .ai-assistant-widget {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            font-family: 'Inter', sans-serif;
        }
        @media (max-width: 768px) {
            .ai-assistant-widget {
                bottom: 18px;
                right: 18px;
            }
        }
        .ai-assistant-btn {
            background-color: #d40d0d;
            color: white;
            border: none;
            border-radius: 50%;
            width: 64px;
            height: 64px;
            font-size: 32px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative;
        }
        @media (max-width: 768px) {
            .ai-assistant-btn { width: 58px; height: 58px; font-size: 28px; }
        }
        .ai-assistant-btn:hover { 
            transform: scale(1.05); 
            box-shadow: 0 6px 16px rgba(212, 13, 13, 0.4);
        }
        .ai-assistant-btn::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            border-radius: 50%;
            border: 2px solid #d40d0d;
            animation: ai-pulse 2s infinite;
            z-index: -1;
        }
        @keyframes ai-pulse {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.3); opacity: 0; }
        }
        /* Tooltip */
        .ai-assistant-btn[data-tooltip]:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            right: 50%;
            transform: translateX(50%);
            margin-bottom: 10px;
            background: #1A1A1A;
            color: #fff;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        .ai-assistant-chat {
            display: none;
            position: absolute;
            bottom: 85px;
            right: 0;
            width: 380px;
            background: #1A1A1A;
            border: 1px solid #333;
            border-radius: 12px;
            box-shadow: 0 12px 32px rgba(0,0,0,0.5);
            overflow: hidden;
            flex-direction: column;
        }
        @media (max-width: 768px) {
            .ai-assistant-chat {
                width: calc(100vw - 36px);
                bottom: 75px;
            }
        }
        .ai-chat-header {
            background: #d40d0d;
            color: white;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .ai-chat-header-text { display: flex; flex-direction: column; }
        .ai-chat-title { font-weight: 700; font-size: 16px; }
        .ai-chat-subtitle { font-size: 12px; opacity: 0.8; }
        .ai-chat-close { cursor: pointer; background:none; border:none; color:white; font-size:20px; transition: transform 0.2s;}
        .ai-chat-close:hover { transform: scale(1.1); }
        
        .ai-chat-body {
            height: 400px;
            overflow-y: auto;
            padding: 15px;
            background: #0D0D0D;
            color: #F5F0E8;
            font-size: 14px;
            display: flex;
            flex-direction: column;
        }
        .ai-msg { margin-bottom: 15px; max-width: 85%; word-wrap: break-word; white-space: pre-wrap; }
        .ai-msg-bot { background: #333; padding: 12px; border-radius: 8px 8px 8px 0; align-self: flex-start; }
        .ai-msg-user { background: #d40d0d; padding: 12px; border-radius: 8px 8px 0 8px; align-self: flex-end; }
        .ai-product-card {
            background: #222;
            border-radius: 8px;
            padding: 10px;
            margin-top: 10px;
            border: 1px solid #444;
        }
        .ai-product-title { font-weight: 600; margin-bottom: 2px; color: #fff;}
        .ai-product-cat { font-size: 11px; color: #999; margin-bottom: 4px; }
        .ai-product-desc { font-size: 12px; color: #bbb; margin-bottom: 6px; line-height: 1.4; }
        .ai-product-price { color: #d40d0d; font-weight: bold; margin-bottom: 10px; font-size: 15px; }
        .ai-btn-add {
            background: #d40d0d; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; width: 100%; font-weight: 600;
            transition: background 0.2s;
        }
        .ai-btn-add:hover { background: #b00b0b; }
        .ai-btn-add.added { background: #2e7d32; cursor: default; }
        
        .ai-chat-input-area {
            display: flex;
            padding: 12px;
            background: #1A1A1A;
            border-top: 1px solid #333;
        }
        .ai-quick-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 10px 15px;
            background: #0D0D0D;
            border-top: 1px solid #222;
        }
        .ai-quick-btn {
            background: #222;
            color: #ccc;
            border: 1px solid #444;
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .ai-quick-btn:hover {
            background: #333;
            color: #fff;
            border-color: #666;
        }
        .ai-chat-input {
            flex: 1;
            padding: 10px;
            border: 1px solid #444;
            background: #000;
            color: white;
            border-radius: 6px;
            outline: none;
            font-family: inherit;
        }
        .ai-chat-input:focus { border-color: #d40d0d; }
        .ai-chat-send {
            background: #d40d0d;
            color: white;
            border: none;
            padding: 0 16px;
            margin-left: 8px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        }
        .ai-chat-send:disabled { background: #555; cursor: not-allowed; }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML
    const widget = document.createElement('div');
    widget.className = 'ai-assistant-widget';
    widget.innerHTML = `
        <button class="ai-assistant-btn" id="aiBtn" aria-label="Ask OFoods AI" data-tooltip="Ask OFoods AI">✨</button>
        <div class="ai-assistant-chat" id="aiChat" aria-hidden="true">
            <div class="ai-chat-header">
                <div class="ai-chat-header-text">
                    <span class="ai-chat-title">OFoods AI</span>
                    <span class="ai-chat-subtitle">Your smart shopping assistant</span>
                </div>
                <button class="ai-chat-close" id="aiClose" aria-label="Close chat">✖</button>
            </div>
            <div class="ai-chat-body" id="aiChatBody">
                <!-- Messages will be injected here -->
            </div>
            <div class="ai-quick-actions" id="aiQuickActions">
                <!-- Dynamic Quick Actions -->
            </div>
            <div class="ai-chat-input-area">
                <input type="text" id="aiInput" class="ai-chat-input" placeholder="Ask me anything about OFoods...">
                <button class="ai-chat-send" id="aiSend">Send</button>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    // 3. Logic & State
    const aiBtn = document.getElementById('aiBtn');
    const aiChat = document.getElementById('aiChat');
    const aiClose = document.getElementById('aiClose');
    const aiInput = document.getElementById('aiInput');
    const aiSend = document.getElementById('aiSend');
    const aiChatBody = document.getElementById('aiChatBody');
    const aiQuickActions = document.getElementById('aiQuickActions');
    
    let isRequesting = false;

    // Load Quick Actions based on page context
    function updateQuickActions() {
        const path = window.location.pathname.toLowerCase();
        let actions = [];
        
        if (path.includes('login') || path.includes('register')) {
            actions = ["How do I login?", "How do I create an account?"];
        } else if (path.includes('cart') || path.includes('checkout')) {
            actions = ["What is in my cart?", "Help me with checkout", "What's my cart total?"];
        } else if (path.includes('product')) {
            actions = ["Tell me about this product", "What goes well with this?", "Add this to cart"];
        } else {
            actions = ["🍽️ What should I order?", "💰 Best under ₹500", "🔥 Hot", "🍬 Sweet", "🌶️ Spicy", "🛒 What's in my cart?"];
        }
        
        aiQuickActions.innerHTML = '';
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'ai-quick-btn';
            btn.textContent = action;
            btn.onclick = () => {
                aiInput.value = action;
                sendMessage();
            };
            aiQuickActions.appendChild(btn);
        });
    }

    updateQuickActions();

    // Load History
    let history = [];
    try {
        const stored = sessionStorage.getItem('ofoods_ai_chat');
        if (stored) history = JSON.parse(stored);
    } catch(e) {}

    function saveHistory() {
        sessionStorage.setItem('ofoods_ai_chat', JSON.stringify(history));
    }

    function renderMessage(msg) {
        const div = document.createElement('div');
        div.className = 'ai-msg ai-msg-' + msg.role;
        // Simple markdown-like rendering for bold
        let html = (msg.text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n/g, '<br>');
        div.innerHTML = html;
        
        // Render product cards if present
        if (msg.products && msg.products.length > 0) {
            msg.products.forEach(function(product, idx) {
                var card = document.createElement('div');
                card.className = 'ai-product-card';
                
                var title = document.createElement('div');
                title.className = 'ai-product-title';
                title.textContent = product.name;
                card.appendChild(title);

                if (product.cat) {
                    var cat = document.createElement('div');
                    cat.className = 'ai-product-cat';
                    cat.textContent = product.cat;
                    card.appendChild(cat);
                }

                if (product.desc) {
                    var desc = document.createElement('div');
                    desc.className = 'ai-product-desc';
                    desc.textContent = product.desc;
                    card.appendChild(desc);
                }
                
                var price = document.createElement('div');
                price.className = 'ai-product-price';
                price.textContent = '₹' + product.price;
                card.appendChild(price);
                
                var btn = document.createElement('button');
                btn.className = 'ai-btn-add';
                btn.setAttribute('data-id', product.id);
                btn.setAttribute('data-name', product.name);
                btn.setAttribute('data-price', product.price);
                btn.textContent = '🛒 Add to Cart';
                card.appendChild(btn);
                
                div.appendChild(card);
            });
        }
        
        aiChatBody.appendChild(div);
    }

    function initChat() {
        aiChatBody.innerHTML = '';
        if (history.length === 0) {
            const welcome = { role: 'bot', text: "Hi there! 👋 I'm your OFoods AI assistant. I can help you:\n• Search & discover products\n• Get personalized recommendations\n• Add items directly to your cart\n• Answer questions about orders & delivery\n\nWhat would you like to do today?" };
            history.push(welcome);
            saveHistory();
        }
        history.forEach(renderMessage);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
    }

    initChat();

    // Toggle Chat
    aiBtn.addEventListener('click', () => {
        const isHidden = aiChat.style.display === 'none' || aiChat.style.display === '';
        aiChat.style.display = isHidden ? 'flex' : 'none';
        aiChat.setAttribute('aria-hidden', !isHidden);
        if (isHidden) aiInput.focus();
    });
    
    aiClose.addEventListener('click', () => {
        aiChat.style.display = 'none';
        aiChat.setAttribute('aria-hidden', 'true');
    });

    // ── CART INTEGRATION: clicking "Add to Cart" on product cards ──
    aiChatBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('ai-btn-add') && !e.target.classList.contains('added')) {
            const btn = e.target;
            const productId = parseInt(btn.getAttribute('data-id'));
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));

            try {
                addToRealCart(productId, name, price, 1);
                btn.textContent = '✓ Added to Cart';
                btn.classList.add('added');
            } catch(err) {
                console.error("Cart error", err);
                btn.textContent = '❌ Error — try again';
            }
        }
    });

    // ── ACTION EXECUTOR: processes backend-driven actions ──
    function executeAction(action) {
        if (!action) return;

        switch (action.type) {
            case 'ADD_TO_CART':
                addToRealCart(action.productId, action.name, action.price, action.qty || 1);
                break;

            case 'REMOVE_FROM_CART':
                removeFromRealCart(action.productId);
                break;

            case 'DECREASE_QTY':
                decreaseInRealCart(action.productId, action.qty || 1);
                break;

            case 'CLEAR_CART':
                clearRealCart();
                break;

            case 'VIEW_CART': {
                const summary = getCartSummary();
                const viewMsg = { role: 'bot', text: summary };
                history.push(viewMsg);
                renderMessage(viewMsg);
                saveHistory();
                break;
            }

            case 'CART_TOTAL': {
                const total = getCartTotal();
                const totalMsg = { role: 'bot', text: total > 0 ? `Your cart total is **₹${total}**.` : 'Your cart is empty.' };
                history.push(totalMsg);
                renderMessage(totalMsg);
                saveHistory();
                break;
            }

            case 'NAVIGATE':
                if (action.url) {
                    const navMsg = { role: 'bot', text: '🔗 Navigating...' };
                    history.push(navMsg);
                    renderMessage(navMsg);
                    saveHistory();
                    setTimeout(() => { window.location.href = action.url; }, 500);
                }
                break;
        }
    }

    // ── Build cart context for API requests ──
    function getCartContext() {
        const cart = _getCart();
        const keys = Object.keys(cart).filter(k => cart[k] > 0);
        return keys.map(k => {
            let meta = null;
            try { meta = JSON.parse(localStorage.getItem('of_cart_meta_' + k) || 'null'); } catch(e) {}
            return {
                id: k,
                name: meta ? meta.name : 'Item #' + k,
                price: meta ? meta.price : 0,
                qty: cart[k]
            };
        });
    }

    // ── Sending Messages ──
    async function sendMessage() {
        const text = aiInput.value.trim();
        if (!text || isRequesting) return;
        
        isRequesting = true;
        aiSend.disabled = true;
        
        // Add User message
        const userMsg = { role: 'user', text };
        history.push(userMsg);
        renderMessage(userMsg);
        saveHistory();
        
        aiInput.value = '';
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
        
        // Add loading bot msg
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-msg ai-msg-bot';
        loadingDiv.textContent = 'Thinking...';
        aiChatBody.appendChild(loadingDiv);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;

        try {
            // Get user info if available
            const user = _getUser();
            const cartContext = getCartContext();

            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userIntent: text, 
                    pageContext: window.location.pathname,
                    user: user ? { name: user.name, email: user.email } : null,
                    cart: cartContext,
                    chatHistory: history.slice(-8)  // Send last 8 messages for context
                }) 
            });
            const data = await res.json();
            
            loadingDiv.remove();
            
            if (data.success && data.recommendation) {
                var rec = data.recommendation;
                // Handle structured response with products array
                var botMsg = { role: 'bot', text: rec.text || rec };
                if (rec.products && rec.products.length > 0) {
                    botMsg.products = rec.products;
                }
                history.push(botMsg);
                renderMessage(botMsg);
                saveHistory();

                // Execute backend-driven action if present
                if (rec.action) {
                    executeAction(rec.action);
                }
            } else {
                // Raw text fallback
                var fallbackText = (data.recommendation && data.recommendation.text) || data.recommendation || "I couldn't process that. Could you rephrase?";
                var fallbackMsg = { role: 'bot', text: fallbackText };
                history.push(fallbackMsg);
                renderMessage(fallbackMsg);
                saveHistory();
            }
        } catch (e) {
            loadingDiv.remove();
            const errorMsg = { role: 'bot', text: "I'm having trouble connecting right now. Please try again in a moment." };
            // Don't save errors to history
            renderMessage(errorMsg);
        }
        
        isRequesting = false;
        aiSend.disabled = false;
        aiInput.focus();
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
    }

    aiSend.addEventListener('click', sendMessage);
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && aiChat.style.display === 'flex') {
            aiClose.click();
        }
    });

})();
