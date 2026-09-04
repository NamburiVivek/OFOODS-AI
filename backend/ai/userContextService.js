/**
 * User Context Service
 * Responsible for parsing and managing the user's context, including their
 * cart items, cart totals, current page, and recent chat history.
 */
class UserContextService {
    
    /**
     * Parse the raw request payload into a structured user context.
     * @param {Object} reqBody The request body from the frontend.
     * @returns {Object} Structured context.
     */
    buildContext(reqBody) {
        const { userIntent, pageContext, user, cart, chatHistory } = reqBody;
        
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

        const cartTotal = cart && Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0;
        const cartStr = cart && cart.length > 0 ? cart.map(c => `${c.qty}x ${c.name} (₹${c.price})`).join(', ') : 'Empty';

        return {
            userName,
            contextHint,
            cartTotal,
            cartStr,
            userIntent: userIntent || '',
            chatHistory: chatHistory || []
        };
    }

    /**
     * Extract recent products shown by the bot in the chat history.
     */
    extractRecentProducts(chatHistory) {
        if (!chatHistory || !Array.isArray(chatHistory)) return [];
        for (let i = chatHistory.length - 1; i >= 0; i--) {
            const msg = chatHistory[i];
            if (msg.role === 'bot' && msg.products && msg.products.length > 0) {
                return msg.products;
            }
        }
        return [];
    }

    /**
     * Formats the chat history for the LLM prompt.
     */
    formatHistory(chatHistory) {
        if (!chatHistory || !Array.isArray(chatHistory)) return 'No previous messages.';
        const recent = chatHistory.slice(-6);
        return recent.map(m => {
            let line = `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.text || ''}`;
            if (m.products && m.products.length > 0) {
                line += '\n[Showed products: ' + m.products.map(p => `${p.name} (₹${p.price}, id:${p.id})`).join(', ') + ']';
            }
            return line;
        }).join('\n');
    }
}

module.exports = new UserContextService();
