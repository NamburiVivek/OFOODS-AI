/**
 * Intent Detector
 * Analyzes a user query to detect multiple intents and extract entities (like budget).
 */
class IntentDetector {
    detect(query) {
        const lowerQuery = query.toLowerCase();
        const intents = [];
        const entities = {};

        // 1. Budget Extraction
        // matches: "₹500", "rs 500", "500 rs", "under 500"
        const budgetRegex = /(?:₹|rs\.?|inr|rupees)?\s*(\d+)\s*(?:rs\.?|inr|rupees)?/i;
        const budgetWords = ['under', 'below', 'budget', 'for', 'have', 'spend'];
        
        const hasBudgetContext = budgetWords.some(w => lowerQuery.includes(w));
        const match = lowerQuery.match(budgetRegex);
        
        if (hasBudgetContext && match) {
            intents.push('BUDGET_RECOMMENDATION');
            entities.budget = parseInt(match[1], 10);
        } else if (match && (lowerQuery.includes('₹') || lowerQuery.includes('rs'))) {
            intents.push('BUDGET_RECOMMENDATION');
            entities.budget = parseInt(match[1], 10);
        }

        // 2. Category Recommendations (Hot, Sweet, Spicy)
        if (lowerQuery.includes('hot')) intents.push('HOT_RECOMMENDATION');
        if (lowerQuery.includes('sweet')) intents.push('SWEET_RECOMMENDATION');
        if (lowerQuery.includes('spicy')) intents.push('SPICY_RECOMMENDATION');
        
        if (intents.includes('HOT_RECOMMENDATION') || intents.includes('SWEET_RECOMMENDATION') || intents.includes('SPICY_RECOMMENDATION')) {
            if (!intents.includes('CATEGORY_RECOMMENDATION')) {
                intents.push('CATEGORY_RECOMMENDATION');
            }
        }

        // 3. Cart Help & Add to Cart
        if (lowerQuery.includes('cart')) {
            if (lowerQuery.includes('add')) {
                intents.push('ADD_TO_CART');
            } else {
                intents.push('CART_HELP');
            }
        } else if (lowerQuery.includes('add this') || lowerQuery.includes('add it')) {
            intents.push('ADD_TO_CART');
        }

        // 4. Account & Login
        if (lowerQuery.includes('login') || lowerQuery.includes('sign in') || lowerQuery.includes('log in')) {
            intents.push('LOGIN_HELP');
        }
        if (lowerQuery.includes('register') || lowerQuery.includes('sign up') || lowerQuery.includes('create account')) {
            intents.push('REGISTRATION_HELP');
        }
        if (lowerQuery.includes('password') || lowerQuery.includes('profile') || lowerQuery.includes('account')) {
            intents.push('ACCOUNT_HELP');
        }

        // 5. Orders & Checkout & Payment
        if (lowerQuery.includes('order') || lowerQuery.includes('track')) {
            intents.push('ORDER_HELP');
        }
        if (lowerQuery.includes('checkout') || lowerQuery.includes('place order')) {
            intents.push('CHECKOUT_HELP');
        }
        if (lowerQuery.includes('pay') || lowerQuery.includes('razorpay') || lowerQuery.includes('card') || lowerQuery.includes('upi')) {
            intents.push('PAYMENT_HELP');
        }

        // 6. Product Details / Search
        if (lowerQuery.includes('what is this') || lowerQuery.includes('tell me about')) {
            intents.push('PRODUCT_DETAILS');
        }
        
        // General fallback
        if (intents.length === 0) {
            intents.push('GENERAL_OFoods_HELP');
        }

        return {
            intents,
            entities,
            isKnowledgeBase: this.requiresKnowledgeBase(intents),
            isProductDB: this.requiresProductDB(intents),
            isUserContext: this.requiresUserContext(intents)
        };
    }

    requiresKnowledgeBase(intents) {
        const kbIntents = ['LOGIN_HELP', 'REGISTRATION_HELP', 'ACCOUNT_HELP', 'CHECKOUT_HELP', 'PAYMENT_HELP', 'DELIVERY_HELP', 'ORDER_HELP', 'GENERAL_OFoods_HELP'];
        return intents.some(i => kbIntents.includes(i));
    }

    requiresProductDB(intents) {
        const productIntents = ['BUDGET_RECOMMENDATION', 'CATEGORY_RECOMMENDATION', 'HOT_RECOMMENDATION', 'SWEET_RECOMMENDATION', 'SPICY_RECOMMENDATION', 'PRODUCT_SEARCH', 'PRODUCT_DETAILS'];
        return intents.some(i => productIntents.includes(i));
    }

    requiresUserContext(intents) {
        const userIntents = ['CART_HELP', 'ADD_TO_CART', 'ORDER_HELP', 'ACCOUNT_HELP'];
        return intents.some(i => userIntents.includes(i));
    }
}

module.exports = new IntentDetector();
