const { GoogleGenAI } = require("@google/genai");
const { PRODUCT_CATALOG } = require("./catalog");
const DATASET = require("./dataset.json");
const productEngine = require("./productEngine");
const userContextService = require("./userContextService");

// ═══════════════════════════════════════════════════════════════
//  OFoods LLM Service — powers the AI Shopping Assistant
//  Uses: @google/genai SDK, real product catalog, intent dataset
// ═══════════════════════════════════════════════════════════════

class LLMService {
    constructor() {
        this.apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
        this.modelName = process.env.AI_MODEL || 'gemini-1.5-flash';

        if (this.apiKey) {
            this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
        }
    }

    // ── Recovery strategy (existing feature — untouched) ────────
    async generateRecoveryStrategy(customerFeatures, eventType, failureReason, cartTotal, recoveryProbability) {
        if (!this.genAI) {
            return { recommendation: "Offer a standard 10% discount.", action: "send_email_10_percent_discount" };
        }

        const prompt = `
You are an AI Revenue Recovery Agent for OFoods e-commerce.
A customer has dropped off. Evaluate their profile and recommend a recovery strategy.

Event Type: ${eventType}
Failure Reason/Details: ${failureReason || 'N/A'}
Cart Total: ₹${cartTotal}
Customer Profile:
- Name: ${customerFeatures?.name || 'Unknown'}
- Total Past Orders: ${customerFeatures?.totalOrders || 0}
- Lifetime Value: ₹${customerFeatures?.lifetimeValue || 0}
- Account Age: ${customerFeatures?.accountAgeDays || 0} days
- Past Abandoned Carts: ${customerFeatures?.abandonedCartHistory || 0}

Calculated Recovery Probability: ${recoveryProbability}%

Choose an action from: 'send_email_reminder', 'send_email_10_percent_discount', 'send_email_free_delivery', 'call_customer', 'ignore'.

Respond ONLY in JSON format:
{
  "recommendation": "Brief explanation",
  "action": "action_code"
}`;

        try {
            const result = await this.genAI.models.generateContent({ model: this.modelName, contents: prompt });
            return JSON.parse(result.text.replace(/```json|```/g, '').trim());
        } catch (error) {
            console.error("LLM Recovery Error:", error.message);
            return { recommendation: "Fallback strategy due to AI error.", action: "send_email_reminder" };
        }
    }

    // ════════════════════════════════════════════════════════════
    //  MAIN AI ASSISTANT — generateProductRecommendation
    // ════════════════════════════════════════════════════════════

    async generateProductRecommendation(userIntent, pageContext, user, cart, chatHistory) {
        const userName = user?.name || 'Guest';
        let contextHint = '';
        if (pageContext) {
            const page = pageContext.toLowerCase();
            if (page.includes('index') || page === '/') contextHint = 'Home page';
            else if (page.includes('cart')) contextHint = 'Cart page';
            else if (page.includes('checkout')) contextHint = 'Checkout page';
            else if (page.includes('menu')) contextHint = 'Menu page';
            else if (page.includes('product')) contextHint = 'Product detail page';
            else contextHint = page;
        }

        const cartTotal = cart ? cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0;
        const cartStr = cart && cart.length > 0 ? cart.map(c => `${c.qty}x ${c.name} (₹${c.price})`).join(', ') : 'Empty';

        // Build recent context from chat history
        const recentProducts = this._extractRecentProducts(chatHistory);

        // ── FALLBACK IF NO LLM ──
        if (!this.genAI) {
            return this._fallbackRecommend(userIntent, cartTotal, recentProducts);
        }

        // ── STEP 1: AI INTENT DETECTION ──
        const catalogSummary = this._getCatalogSummary();
        const datasetExamples = this._getDatasetExamples();
        const historyStr = this._formatHistory(chatHistory);

        const intentPrompt = `
You are the OFoods AI Shopping Assistant's intent-detection engine.
Customer: ${userName}
Page Context: ${contextHint}
Current Cart: ${cartStr} (Total: ₹${cartTotal})

Conversation History:
${historyStr}

Current Message: "${userIntent}"

Here is the OFoods product catalog:
${catalogSummary}

Here are the known intent categories and example queries:
${datasetExamples}

IMPORTANT RULES:
1. Determine the user's intent from the list of known intents.
2. If the user says "add the second one" or "add that" or "those", look at the conversation history to resolve what products were recently shown.
3. Recently displayed products from conversation: ${JSON.stringify(recentProducts.map(p => ({id: p.id, name: p.name})))}
4. Extract parameters like budget, product name, quantity, category.
5. For quantities written as words (e.g. "two"), convert them to numbers.
6. When adding to cart, you MUST resolve the exact product ID from the catalog.
7. If multiple products match a search term, return all matching product IDs.

Return ONLY a JSON object:
{
  "intent": "INTENT_NAME",
  "budget": null,
  "categories": [],
  "quantity": 1,
  "productSearch": "search term if any",
  "productIds": [],
  "referenceIndex": null
}

Where:
- intent: one of the dataset intent names (e.g. "add_to_cart", "product_search", "greeting", etc.)
- budget: number or null
- categories: array of category keywords
- quantity: integer (default 1)
- productSearch: the product name/term the user mentioned
- productIds: array of resolved product IDs from catalog (empty if not applicable)
- referenceIndex: if user says "the second one", this is 1 (0-indexed). null otherwise.`;

        let intentData;
        try {
            const result = await this.genAI.models.generateContent({ model: this.modelName, contents: intentPrompt });
            let text = result.text.trim().replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
            intentData = JSON.parse(text);
        } catch (e) {
            console.error("Intent Detection Error:", e.message);
            return this._fallbackRecommend(userIntent, cartTotal, recentProducts);
        }

        // ── STEP 2: DETERMINISTIC PROCESSING ──
        return this._processIntent(intentData, userIntent, userName, cartStr, cartTotal, recentProducts, chatHistory);
    }

    // ════════════════════════════════════════════════════════════
    //  INTENT PROCESSORS — all deterministic, database-driven
    // ════════════════════════════════════════════════════════════

    async _processIntent(intentData, userIntent, userName, cartStr, cartTotal, recentProducts, chatHistory) {
        const intent = intentData.intent;

        // ── GREETING / FAREWELL / THANKS / CAPABILITIES ──
        if (['greeting', 'farewell', 'thanks', 'capabilities', 'confused'].includes(intent)) {
            return this._handleGeneral(intent, userName);
        }

        // ── NAVIGATION ──
        if (intent.startsWith('navigate_')) {
            return this._handleNavigation(intent);
        }

        // ── ACCOUNT ──
        if (intent.startsWith('account_')) {
            return this._handleAccount(intent);
        }

        // ── ORDER / CHECKOUT / PAYMENT ──
        if (['order_how', 'checkout_help', 'order_cancel', 'order_track'].includes(intent)) {
            return this._handleOrder(intent);
        }
        if (['payment_methods', 'payment_failed'].includes(intent)) {
            return this._handlePayment(intent);
        }

        // ── DELIVERY ──
        if (['delivery_info', 'delivery_pickup'].includes(intent)) {
            return this._handleDelivery(intent);
        }

        // ── CART OPERATIONS ──
        if (['add_to_cart', 'remove_from_cart', 'increase_quantity', 'decrease_quantity'].includes(intent)) {
            return this._handleCartAction(intentData, recentProducts);
        }
        if (['view_cart', 'cart_total', 'clear_cart'].includes(intent)) {
            return this._handleCartQuery(intent);
        }

        // ── PRODUCT DISCOVERY ──
        if (['product_list', 'product_category', 'product_search', 'product_info',
             'product_cheapest', 'product_expensive', 'product_price_range',
             'product_popular', 'product_vegetarian', 'product_sweet',
             'product_spicy', 'product_hot', 'product_compare'].includes(intent)) {
            return this._handleProductDiscovery(intentData, userIntent);
        }

        // ── RECOMMENDATIONS ──
        if (['recommend_general', 'recommend_budget', 'recommend_combination',
             'recommend_similar', 'recommend_party'].includes(intent)) {
            return this._handleRecommendation(intentData, userIntent, userName, cartStr, cartTotal);
        }

        // ── FALLBACK ──
        return this._handleGeneral('capabilities', userName);
    }

    // ─────────────────────────────────────────────────
    //  GENERAL HANDLERS
    // ─────────────────────────────────────────────────

    _handleGeneral(intent, userName) {
        const responses = {
            greeting: `Hi ${userName}! 👋 Welcome to OFoods! I'm your AI shopping assistant. I can help you:\n• Browse and search products\n• Get personalized recommendations\n• Add items to your cart\n• Answer questions about orders, delivery & payments\n\nWhat would you like to do today?`,
            farewell: `Goodbye ${userName}! 🙏 Thanks for visiting OFoods. Come back anytime — happy to help you shop!`,
            thanks: `You're welcome, ${userName}! 😊 Is there anything else I can help you with?`,
            capabilities: `I'm the OFoods AI assistant! Here's what I can do:\n\n🛒 **Shopping**: Search products, get recommendations, add items to cart\n💰 **Budget Help**: Find products within your budget\n📦 **Orders**: Help with checkout, tracking, and payments\n🚚 **Delivery**: Delivery info, store pickup details\n👤 **Account**: Login help, profile management\n\nJust ask me anything!`,
            confused: `No worries! Let me help. Here are some popular items to get you started:`
        };

        if (intent === 'confused') {
            const popular = PRODUCT_CATALOG.filter((_, i) => [0, 1, 11, 44, 48].includes(i)).slice(0, 5);
            if (popular.length === 0) {
                const shuffled = [...PRODUCT_CATALOG].sort(() => 0.5 - Math.random()).slice(0, 5);
                return {
                    text: responses.confused,
                    products: shuffled.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
                };
            }
            return {
                text: responses.confused,
                products: popular.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        return { text: responses[intent] || responses.capabilities, products: [] };
    }

    // ─────────────────────────────────────────────────
    //  NAVIGATION HANDLERS
    // ─────────────────────────────────────────────────

    _handleNavigation(intent) {
        const navMap = {
            navigate_cart: { text: "🛒 Here's your cart! Click the link to view it:\n\n→ [Open Cart](cart.html)\n\nYou can also click the cart icon in the top navigation bar.", action: { type: 'NAVIGATE', url: 'cart.html' } },
            navigate_checkout: { text: "💳 Ready to checkout? Make sure you have items in your cart first!\n\n→ [Go to Checkout](Checkout.html)", action: { type: 'NAVIGATE', url: 'Checkout.html' } },
            navigate_orders: { text: "📦 You can view your orders from your profile page:\n\n→ [View Orders](profile.html)\n\nGo to Profile → Orders tab.", action: { type: 'NAVIGATE', url: 'profile.html' } },
            navigate_profile: { text: "👤 Open your profile to manage your account:\n\n→ [Open Profile](profile.html)", action: { type: 'NAVIGATE', url: 'profile.html' } },
            navigate_menu: { text: "🍽️ Browse our full menu with all products:\n\n→ [Open Menu](menu.html)", action: { type: 'NAVIGATE', url: 'menu.html' } },
            navigate_help_order: { text: "Here's how to place an order:\n\n1️⃣ Browse the menu → [Open Menu](menu.html)\n2️⃣ Click on a product to see details & sizes\n3️⃣ Add items to your cart\n4️⃣ Go to Cart → Review items\n5️⃣ Proceed to Checkout\n6️⃣ Choose delivery option\n7️⃣ Complete payment via Razorpay\n\nNeed help with any step? Just ask!" }
        };
        const response = navMap[intent] || navMap.navigate_menu;
        return { text: response.text, products: [], action: response.action || null };
    }

    // ─────────────────────────────────────────────────
    //  ACCOUNT HANDLERS
    // ─────────────────────────────────────────────────

    _handleAccount(intent) {
        const map = {
            account_create: "To create an OFoods account:\n\n1. Click the 'Login' button at the top right\n2. Click 'Sign Up' or 'Create Account'\n3. Enter your name, email, and password\n4. Click Register\n\nYou'll be logged in automatically!",
            account_login: "To log in to OFoods:\n\n1. Click the 'Login' button at the top right\n2. Enter your registered email and password\n3. Click 'Login'\n\nIf you forgot your password, you can reset it from the login page.",
            account_profile: "To manage your profile:\n\n1. Make sure you're logged in\n2. Click your name at the top right → 'Profile'\n3. From there you can:\n   • Update your name & details\n   • Change your address\n   • View your order history\n   • Log out\n\n→ [Open Profile](profile.html)"
        };
        return { text: map[intent] || map.account_login, products: [] };
    }

    // ─────────────────────────────────────────────────
    //  ORDER HANDLERS
    // ─────────────────────────────────────────────────

    _handleOrder(intent) {
        const map = {
            order_how: "Here's how to place an order on OFoods:\n\n1️⃣ Browse our menu and find products you like\n2️⃣ Click on a product to see sizes and details\n3️⃣ Select your preferred size and quantity\n4️⃣ Click 'Add to Cart'\n5️⃣ When ready, go to your Cart\n6️⃣ Review items and click 'Proceed to Checkout'\n7️⃣ Choose Home Delivery or Store Pickup\n8️⃣ Complete payment securely via Razorpay\n9️⃣ You'll receive a confirmation with order details!\n\n→ [Start Shopping](menu.html)",
            checkout_help: "To complete checkout:\n\n1. Open your Cart → [Open Cart](cart.html)\n2. Review your items and quantities\n3. Click 'Proceed to Checkout'\n4. Select delivery mode (Home Delivery or Store Pickup)\n5. Confirm your address\n6. Complete payment through Razorpay (UPI, Cards, Net Banking)\n7. Once payment is verified, your order is confirmed!\n\nPayment is 100% secure through Razorpay. 🔒",
            order_cancel: "To cancel an order:\n\n1. Go to your Profile → Orders\n2. Find the order you want to cancel\n3. If the order hasn't been dispatched yet, you may be able to cancel it\n\nFor immediate assistance with cancellations, please contact us at:\n📞 +91 7981250665\n\nNote: Refunds for cancelled orders are processed within 3-5 business days.",
            order_track: "To track your order:\n\n1. Go to your Profile → [Open Profile](profile.html)\n2. Click on the 'Orders' tab\n3. Find your order and view its current status\n\nOrder statuses include:\n• Confirmed — Order received\n• Processing — Being prepared\n• Dispatched — On the way\n• Delivered — Complete!\n\nFor delivery-related queries: 📞 +91 7981250665"
        };
        return { text: map[intent] || map.order_how, products: [] };
    }

    // ─────────────────────────────────────────────────
    //  PAYMENT HANDLERS
    // ─────────────────────────────────────────────────

    _handlePayment(intent) {
        const map = {
            payment_methods: "OFoods accepts the following payment methods through **Razorpay**:\n\n💳 Credit/Debit Cards (Visa, Mastercard, RuPay)\n📱 UPI (GPay, PhonePe, Paytm, etc.)\n🏦 Net Banking (All major banks)\n💰 Wallets (Paytm, Freecharge, etc.)\n\nAll transactions are 100% secure and encrypted. 🔒",
            payment_failed: "If your payment failed, don't worry! Here's what to do:\n\n1. **Check your bank/UPI app** — If money was deducted, it usually auto-refunds within 3-5 business days\n2. **Try again** — Go to your cart and attempt checkout again\n3. **Try a different payment method** — Switch between UPI, cards, or net banking\n4. **Contact support** if the issue persists:\n   📞 +91 7981250665\n\n⚠️ Do NOT pay twice for the same order. Check your orders page first.\n→ [Check Orders](profile.html)"
        };
        return { text: map[intent] || map.payment_methods, products: [] };
    }

    // ─────────────────────────────────────────────────
    //  DELIVERY HANDLERS
    // ─────────────────────────────────────────────────

    _handleDelivery(intent) {
        const map = {
            delivery_info: "📦 **OFoods Delivery Options:**\n\n**Home Delivery** 🚚\n• Available across India via courier\n• Delivery time: 4-5 business days\n• Delivery charges calculated at checkout based on your state\n• Products are securely packaged for safe transit\n\n**Store Pickup** 🏪\n• FREE pickup from our store\n• Ready next day by 4:00 PM\n• Store: O Foods — Amaravathi\n• Address: Beside Of Police Station, Amaravathi\n• Hours: Mon–Sun, 10:00 AM – 9:00 PM\n• Phone: +91 7981250665",
            delivery_pickup: "🏪 **Store Pickup Details:**\n\n• **Store**: O Foods — Amaravathi\n• **Address**: Beside Of Police Station, Amaravathi - 522426\n• **Hours**: Mon–Sun: 10:00 AM – 9:00 PM\n• **Phone**: +91 7981250665\n\n• Pickup is **FREE** — no delivery charges!\n• Order will be ready next day by **4:00 PM**\n• Select 'Store Pickup' at checkout to use this option"
        };
        return { text: map[intent] || map.delivery_info, products: [] };
    }

    // ─────────────────────────────────────────────────
    //  CART ACTION HANDLERS (ADD, REMOVE, QUANTITY)
    // ─────────────────────────────────────────────────

    _handleCartAction(intentData, recentProducts) {
        const intent = intentData.intent;
        const qty = intentData.quantity || 1;
        let productIds = intentData.productIds || [];
        const searchTerm = intentData.productSearch || '';
        const refIndex = intentData.referenceIndex;

        // Resolve reference like "the second one"
        if (refIndex !== null && refIndex !== undefined && recentProducts.length > 0) {
            const idx = parseInt(refIndex);
            if (idx >= 0 && idx < recentProducts.length) {
                productIds = [recentProducts[idx].id];
            }
        }

        // Resolve "add that" / "add it" / "add those" — use last shown products
        if (productIds.length === 0 && ['add it', 'add that', 'add those', 'yes add it', 'yeah add it', 'yes', 'add this'].some(k => (intentData.productSearch || '').toLowerCase().includes(k) || searchTerm === '')) {
            if (recentProducts.length > 0 && !searchTerm) {
                // "add it" with no search = add last single shown product
                productIds = [recentProducts[0].id];
            }
        }

        // If we still don't have IDs, search the catalog
        if (productIds.length === 0 && searchTerm) {
            const matches = this._searchCatalog(searchTerm);
            productIds = matches.map(p => p.id);
        }

        // ── ADD TO CART ──
        if (intent === 'add_to_cart') {
            if (productIds.length === 0) {
                return { text: `I couldn't find that product in our catalog. Try searching by name, like "Add tomato pickle to cart".`, products: [], action: null };
            }

            if (productIds.length > 1) {
                // Ambiguous — show options
                const matches = productIds.map(id => PRODUCT_CATALOG.find(p => p.id === id)).filter(Boolean);
                return {
                    text: `I found ${matches.length} matching products. Which one would you like to add?`,
                    products: matches.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel })),
                    action: null
                };
            }

            // Single product — add it
            const product = PRODUCT_CATALOG.find(p => p.id === productIds[0]);
            if (!product) {
                return { text: "I couldn't find that product. Please try again.", products: [], action: null };
            }

            return {
                text: `✅ **${product.name}** (₹${product.price}) × ${qty} has been added to your cart!`,
                products: [{ id: product.id, name: product.name, price: product.price, desc: product.desc, cat: product.catLabel }],
                action: { type: 'ADD_TO_CART', productId: product.id, name: product.name, price: product.price, qty: qty }
            };
        }

        // ── REMOVE FROM CART ──
        if (intent === 'remove_from_cart') {
            if (productIds.length === 0) {
                return { text: "Which product would you like to remove from your cart? Please specify the product name.", products: [], action: null };
            }
            const product = PRODUCT_CATALOG.find(p => p.id === productIds[0]);
            if (!product) {
                return { text: "I couldn't find that product in the catalog.", products: [], action: null };
            }
            return {
                text: `🗑️ **${product.name}** has been removed from your cart.`,
                products: [],
                action: { type: 'REMOVE_FROM_CART', productId: product.id, name: product.name }
            };
        }

        // ── INCREASE QUANTITY ──
        if (intent === 'increase_quantity') {
            if (productIds.length === 0) {
                return { text: "Which product's quantity would you like to increase?", products: [], action: null };
            }
            const product = PRODUCT_CATALOG.find(p => p.id === productIds[0]);
            if (!product) return { text: "Product not found.", products: [], action: null };
            return {
                text: `➕ Increased **${product.name}** quantity by ${qty}.`,
                products: [],
                action: { type: 'ADD_TO_CART', productId: product.id, name: product.name, price: product.price, qty: qty }
            };
        }

        // ── DECREASE QUANTITY ──
        if (intent === 'decrease_quantity') {
            if (productIds.length === 0) {
                return { text: "Which product's quantity would you like to decrease?", products: [], action: null };
            }
            const product = PRODUCT_CATALOG.find(p => p.id === productIds[0]);
            if (!product) return { text: "Product not found.", products: [], action: null };
            return {
                text: `➖ Decreased **${product.name}** quantity by ${qty}.`,
                products: [],
                action: { type: 'DECREASE_QTY', productId: product.id, name: product.name, qty: qty }
            };
        }

        return { text: "I'm not sure what you'd like me to do. Could you rephrase?", products: [], action: null };
    }

    _handleCartQuery(intent) {
        if (intent === 'view_cart') {
            return {
                text: "Here's what's currently in your cart:",
                products: [],
                action: { type: 'VIEW_CART' }
            };
        }
        if (intent === 'cart_total') {
            return {
                text: "Let me calculate your cart total:",
                products: [],
                action: { type: 'CART_TOTAL' }
            };
        }
        if (intent === 'clear_cart') {
            return {
                text: "🗑️ Your cart has been cleared.",
                products: [],
                action: { type: 'CLEAR_CART' }
            };
        }
        return { text: "I couldn't process your cart request.", products: [], action: null };
    }

    // ─────────────────────────────────────────────────
    //  PRODUCT DISCOVERY HANDLERS
    // ─────────────────────────────────────────────────

    _handleProductDiscovery(intentData, userIntent) {
        const intent = intentData.intent;

        if (intent === 'product_list') {
            const categories = {};
            PRODUCT_CATALOG.forEach(p => {
                if (!categories[p.catLabel]) categories[p.catLabel] = 0;
                categories[p.catLabel]++;
            });
            const catStr = Object.entries(categories).map(([k, v]) => `• ${k}: ${v} items`).join('\n');
            const sample = [...PRODUCT_CATALOG].sort(() => 0.5 - Math.random()).slice(0, 5);
            return {
                text: `🍽️ We have **${PRODUCT_CATALOG.length} products** across these categories:\n\n${catStr}\n\nHere are some highlights:`,
                products: sample.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'product_category') {
            const cats = intentData.categories || [];
            let matches = PRODUCT_CATALOG;
            if (cats.length > 0) {
                matches = PRODUCT_CATALOG.filter(p => {
                    const searchStr = `${p.name} ${p.cat} ${p.catLabel} ${p.desc}`.toLowerCase();
                    return cats.some(c => searchStr.includes(c.toLowerCase()));
                });
            }
            if (matches.length === 0) {
                return { text: `I couldn't find products in that category. Try: pickles, snacks, sweets, spices, or chips.`, products: [] };
            }
            return {
                text: `Here are ${matches.length} products matching your request:`,
                products: matches.slice(0, 10).map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'product_search') {
            const searchTerm = intentData.productSearch || userIntent;
            const matches = this._searchCatalog(searchTerm);
            if (matches.length === 0) {
                return { text: `I couldn't find any products matching "${searchTerm}". Try searching for pickles, sweets, snacks, or spices!`, products: [] };
            }
            return {
                text: `I found ${matches.length} product${matches.length > 1 ? 's' : ''} matching "${searchTerm}":`,
                products: matches.slice(0, 10).map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'product_info') {
            const searchTerm = intentData.productSearch || userIntent;
            const matches = this._searchCatalog(searchTerm);
            if (matches.length === 0) {
                return { text: `I couldn't find a product matching "${searchTerm}".`, products: [] };
            }
            const p = matches[0];
            return {
                text: `📦 **${p.name}**\n\n• **Price**: ₹${p.price}\n• **Category**: ${p.catLabel}\n• **Description**: ${p.desc}\n\nWould you like to add it to your cart?`,
                products: [{ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }]
            };
        }

        if (intent === 'product_cheapest') {
            const sorted = [...PRODUCT_CATALOG].sort((a, b) => a.price - b.price).slice(0, 5);
            return {
                text: `💰 Here are the most affordable items on OFoods:`,
                products: sorted.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'product_expensive') {
            const sorted = [...PRODUCT_CATALOG].sort((a, b) => b.price - a.price).slice(0, 5);
            return {
                text: `✨ Here are our premium products:`,
                products: sorted.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'product_price_range') {
            const budget = intentData.budget || 100;
            const matches = PRODUCT_CATALOG.filter(p => p.price <= budget);
            if (matches.length === 0) {
                return { text: `No products found under ₹${budget}. Our cheapest item starts at ₹${Math.min(...PRODUCT_CATALOG.map(p => p.price))}.`, products: [] };
            }
            return {
                text: `Here are ${matches.length} products under ₹${budget}:`,
                products: matches.sort((a, b) => a.price - b.price).slice(0, 10).map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'product_popular') {
            // Return a curated mix from different categories
            const picks = [
                PRODUCT_CATALOG.find(p => p.id === 2),  // Mango Pickle
                PRODUCT_CATALOG.find(p => p.id === 13), // Boneless Chicken
                PRODUCT_CATALOG.find(p => p.id === 31), // Garam Masala
                PRODUCT_CATALOG.find(p => p.id === 70), // Boondi Mixture
                PRODUCT_CATALOG.find(p => p.id === 73), // Laddu
            ].filter(Boolean);
            return {
                text: `🌟 Here are our most popular products:`,
                products: picks.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'product_vegetarian') {
            const nonVegCats = ['nonveg-pickles'];
            const vegProducts = PRODUCT_CATALOG.filter(p => !nonVegCats.includes(p.cat) && !p.catLabel.toLowerCase().includes('non-veg'));
            return {
                text: `🥗 Here are ${vegProducts.length} vegetarian products:`,
                products: vegProducts.slice(0, 10).map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'product_sweet') {
            const sweets = PRODUCT_CATALOG.filter(p => p.catLabel === 'Sweet' || p.name.toLowerCase().includes('sweet') || p.desc.toLowerCase().includes('sweet'));
            return {
                text: `🍬 Here are our sweet items:`,
                products: sweets.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'product_spicy') {
            const spicy = PRODUCT_CATALOG.filter(p =>
                p.catLabel.toLowerCase().includes('karam') ||
                p.desc.toLowerCase().includes('spicy') ||
                p.desc.toLowerCase().includes('chilli') ||
                p.desc.toLowerCase().includes('fiery') ||
                p.name.toLowerCase().includes('chilli')
            );
            return {
                text: `🌶️ Here are our spicy/karam items:`,
                products: spicy.slice(0, 10).map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'product_hot') {
            const hot = PRODUCT_CATALOG.filter(p => p.catLabel === 'Hot Snack');
            return {
                text: `🔥 Here are our hot snack items:`,
                products: hot.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'product_compare') {
            const ids = intentData.productIds || [];
            if (ids.length < 2) {
                return { text: "Please specify two products to compare, e.g. 'Compare tomato pickle and mango pickle'.", products: [] };
            }
            const p1 = PRODUCT_CATALOG.find(p => p.id === ids[0]);
            const p2 = PRODUCT_CATALOG.find(p => p.id === ids[1]);
            if (!p1 || !p2) return { text: "I couldn't find one or both of those products.", products: [] };
            return {
                text: `📊 **Comparison:**\n\n| | ${p1.name} | ${p2.name} |\n|---|---|---|\n| Price | ₹${p1.price} | ₹${p2.price} |\n| Category | ${p1.catLabel} | ${p2.catLabel} |\n| Description | ${p1.desc} | ${p2.desc} |`,
                products: [
                    { id: p1.id, name: p1.name, price: p1.price, desc: p1.desc, cat: p1.catLabel },
                    { id: p2.id, name: p2.name, price: p2.price, desc: p2.desc, cat: p2.catLabel }
                ]
            };
        }

        return { text: "I couldn't process that product query. Could you rephrase?", products: [] };
    }

    // ─────────────────────────────────────────────────
    //  RECOMMENDATION HANDLERS
    // ─────────────────────────────────────────────────

    _handleRecommendation(intentData, userIntent, userName, cartStr, cartTotal) {
        const intent = intentData.intent;
        const budget = intentData.budget;
        const categories = intentData.categories || [];

        if (intent === 'recommend_general') {
            const picks = this._getSmartPicks(null, [], 5);
            return {
                text: `Here are my top recommendations for you, ${userName}! 🌟`,
                products: picks.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'recommend_budget') {
            const maxBudget = budget || 500;
            const result = this._getProductsForBudget(maxBudget, categories.length > 0 ? categories : null, intentData.quantity || 3);
            if (result.products.length === 0) {
                return {
                    text: `I couldn't find a combination under ₹${maxBudget} for those criteria. Try increasing your budget or broadening your search!`,
                    products: []
                };
            }
            const remaining = maxBudget - result.total;
            return {
                text: `💰 Here's a great combination within your ₹${maxBudget} budget!\n\nTotal: ₹${result.total}${remaining > 0 ? ` (₹${remaining} remaining)` : ''}`,
                products: result.products.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'recommend_combination') {
            const picks = this._getSmartPicks(budget, categories, intentData.quantity || 4);
            const total = picks.reduce((s, p) => s + p.price, 0);
            return {
                text: `Here's a curated combination for you! Total: ₹${total}`,
                products: picks.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'recommend_similar') {
            const searchTerm = intentData.productSearch || '';
            const matches = this._searchCatalog(searchTerm);
            if (matches.length === 0) {
                return { text: `I couldn't find the product you mentioned. Try specifying the product name.`, products: [] };
            }
            const base = matches[0];
            const similar = PRODUCT_CATALOG.filter(p => p.cat === base.cat && p.id !== base.id).slice(0, 5);
            return {
                text: `Products similar to **${base.name}**:`,
                products: similar.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        if (intent === 'recommend_party') {
            const qty = intentData.quantity || 5;
            const picks = this._getSmartPicks(budget || 2000, [], Math.min(qty, 10));
            const total = picks.reduce((s, p) => s + p.price, 0);
            return {
                text: `🎉 Here's a party selection for you! (${picks.length} items, Total: ₹${total})`,
                products: picks.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
            };
        }

        return { text: "Let me recommend something!", products: this._getSmartPicks(null, [], 3).map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel })) };
    }

    // ════════════════════════════════════════════════════════════
    //  UTILITY FUNCTIONS
    // ════════════════════════════════════════════════════════════

    _searchCatalog(term) {
        return productEngine.searchCatalog(term);
    }

    _getProductsForBudget(budget, categories, qty) {
        return productEngine.getProductsForBudget(budget, categories, qty);
    }

    _getSmartPicks(budget, categories, count) {
        return productEngine.getSmartPicks(budget, categories, count);
    }

    _extractRecentProducts(chatHistory) {
        return userContextService.extractRecentProducts(chatHistory);
    }

    _formatHistory(chatHistory) {
        return userContextService.formatHistory(chatHistory);
    }

    _getCatalogSummary() {
        return PRODUCT_CATALOG.map(p => `ID:${p.id} "${p.name}" ₹${p.price} [${p.catLabel}]`).join('\n');
    }

    _getDatasetExamples() {
        return DATASET.map(d => `Intent: ${d.intent} | Category: ${d.category} | Examples: ${d.examples.slice(0, 3).join(', ')}`).join('\n');
    }

    // ── FALLBACK when LLM is unavailable ──
    _fallbackRecommend(intent, cartTotal, recentProducts) {
        const lower = (intent || '').toLowerCase();

        // Greetings
        if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste)/.test(lower)) {
            return this._handleGeneral('greeting', 'Guest');
        }
        if (/^(bye|goodbye|see you|later|tata)/.test(lower)) {
            return this._handleGeneral('farewell', 'Guest');
        }
        if (/^(thanks|thank you|thx|ty)/.test(lower)) {
            return this._handleGeneral('thanks', 'Guest');
        }
        if (lower.includes('help') || lower.includes('what can you do')) {
            return this._handleGeneral('capabilities', 'Guest');
        }
        if (lower.includes('login') || lower.includes('register') || lower.includes('sign')) {
            return this._handleAccount('account_login');
        }
        if (lower.includes('checkout') || lower.includes('pay')) {
            return this._handleOrder('checkout_help');
        }
        if (lower.includes('cart')) {
            return this._handleCartQuery('view_cart');
        }
        if (lower.includes('deliver')) {
            return this._handleDelivery('delivery_info');
        }
        if (lower.includes('order') || lower.includes('track')) {
            return this._handleOrder('order_track');
        }

        // Product search fallback
        if (lower.includes('list') || lower.includes('show') || lower.includes('search') || lower.includes('find') || lower.includes('give me')) {
            // Remove stop words to get a better search query
            const searchTerm = lower
                .replace(/give me|show me|list of|i want|search for|find me/gi, '')
                .replace(/the|a|an|names|items/gi, '')
                .trim();
            
            if (searchTerm.length > 2) {
                const searchResults = this._searchCatalog(searchTerm);
                if (searchResults.length > 0) {
                    const matches = searchResults.slice(0, 10);
                    return {
                        text: `Here is a list of ${matches.length} matching products:`,
                        products: matches.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
                    };
                }
            }
        }

        const budgetMatch = lower.match(/(?:under|below|within|budget)\s*₹?\s*(\d+)|₹?\s*(\d+)\s*(?:rupees|budget|rs)/);
        let maxPrice = Infinity;
        if (budgetMatch) maxPrice = parseInt(budgetMatch[1] || budgetMatch[2]);

        let categories = [];
        if (lower.includes('hot')) categories.push('Hot Snack');
        if (lower.includes('sweet')) categories.push('Sweet');
        if (lower.includes('spicy') || lower.includes('karam')) categories.push('Karam');
        if (lower.includes('pickle')) categories.push('Pickle');
        if (lower.includes('snack')) categories.push('Snack');
        if (lower.includes('chip') || lower.includes('wafer')) categories.push('Chips');

        const dbResult = this._getProductsForBudget(maxPrice, categories.length > 0 ? categories : null, 3);

        if (dbResult.products.length === 0) {
            return { text: "I couldn't find products matching your criteria. Try asking about pickles, sweets, snacks, or spices!", products: [] };
        }

        return {
            text: `Here are some picks for you. Total: ₹${dbResult.total}.`,
            products: dbResult.products.map(p => ({ id: p.id, name: p.name, price: p.price, desc: p.desc, cat: p.catLabel }))
        };
    }
}

module.exports = new LLMService();
