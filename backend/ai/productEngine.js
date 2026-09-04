const { PRODUCT_CATALOG } = require("./catalog");

/**
 * Product & Budget Recommendation Engine
 * Responsible for finding combinations of products that fit within a budget
 * and match specific category requirements.
 */
class ProductEngine {
    
    /**
     * Find a combination of products that fits within the budget.
     * @param {number} budget The maximum budget allowed.
     * @param {Array<string>} categories Optional categories to filter by.
     * @param {number} qty Number of products to pick.
     * @returns {Object} { products: [], total: number }
     */
    getProductsForBudget(budget, categories, qty = 3) {
        let matches = [...PRODUCT_CATALOG];
        if (categories && categories.length > 0) {
            matches = matches.filter(p => {
                const searchStr = `${p.name} ${p.cat} ${p.catLabel} ${p.desc}`.toLowerCase();
                return categories.some(c => searchStr.includes(c.toLowerCase()));
            });
        }

        // Shuffle matches for variety
        const shuffled = matches.sort(() => 0.5 - Math.random());
        let selected = [];
        let total = 0;
        
        for (let p of shuffled) {
            if (total + p.price <= budget && selected.length < qty) {
                selected.push(p);
                total += p.price;
            }
        }
        
        return { products: selected, total };
    }

    /**
     * Finds smart picks across diverse categories.
     * @param {number} budget The maximum budget allowed (optional).
     * @param {Array<string>} categories Categories to filter by.
     * @param {number} count Number of items to return.
     * @returns {Array<Object>} List of selected products.
     */
    getSmartPicks(budget, categories, count = 3) {
        const catSet = new Set();
        let pool = [...PRODUCT_CATALOG];
        
        if (categories && categories.length > 0) {
            pool = pool.filter(p => {
                const searchStr = `${p.name} ${p.cat} ${p.catLabel} ${p.desc}`.toLowerCase();
                return categories.some(c => searchStr.includes(c.toLowerCase()));
            });
        }
        
        const shuffled = pool.sort(() => 0.5 - Math.random());
        let selected = [];
        let total = 0;
        const maxBudget = budget || 99999;
        
        for (let p of shuffled) {
            if (selected.length >= count) break;
            if (total + p.price > maxBudget) continue;
            
            // Try to pick from diverse categories
            if (!catSet.has(p.catLabel) || selected.length > 2) {
                selected.push(p);
                total += p.price;
                catSet.add(p.catLabel);
            }
        }
        
        return selected;
    }

    /**
     * Search the catalog for a specific term.
     */
    searchCatalog(term) {
        if (!term) return [];
        const lower = term.toLowerCase().trim();
        
        // Exact match first
        let exact = PRODUCT_CATALOG.filter(p => p.name.toLowerCase().includes(lower));
        if (exact.length > 0) return exact;
        
        // Fuzzy match
        const words = lower.split(/\s+/).filter(w => w.length > 2);
        return PRODUCT_CATALOG.filter(p => {
            const haystack = `${p.name} ${p.desc} ${p.catLabel} ${p.cat}`.toLowerCase();
            return words.some(w => haystack.includes(w));
        });
    }
}

module.exports = new ProductEngine();
