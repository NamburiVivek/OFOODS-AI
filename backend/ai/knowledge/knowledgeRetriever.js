const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, 'ofoodsKnowledge.json');

class KnowledgeRetriever {
    constructor() {
        this.knowledgeBase = [];
        this.loadKnowledge();
    }

    loadKnowledge() {
        try {
            if (fs.existsSync(JSON_PATH)) {
                const data = fs.readFileSync(JSON_PATH, 'utf8');
                this.knowledgeBase = JSON.parse(data);
            } else {
                console.warn(`[Warning] Knowledge base JSON not found at ${JSON_PATH}. Run the knowledge loader first.`);
            }
        } catch (err) {
            console.error("Error loading knowledge base:", err);
        }
    }

    // A simple retriever that searches for keywords and question similarity
    search(query, topK = 3) {
        if (!this.knowledgeBase || this.knowledgeBase.length === 0) {
            return [];
        }

        const normalizedQuery = query.toLowerCase();
        const tokens = normalizedQuery.split(/\W+/).filter(t => t.length > 2);

        const scoredEntries = this.knowledgeBase.map(entry => {
            let score = 0;
            
            // 1. Direct Question Match (highest weight)
            if (entry.question.toLowerCase() === normalizedQuery) {
                score += 100;
            } else if (entry.question.toLowerCase().includes(normalizedQuery) || normalizedQuery.includes(entry.question.toLowerCase())) {
                score += 50;
            }

            // 2. Keyword matching
            if (entry.keywords && entry.keywords.length > 0) {
                entry.keywords.forEach(kw => {
                    if (normalizedQuery.includes(kw)) {
                        score += 20;
                    }
                });
            }

            // 3. Token overlap (bag of words)
            const entryTokens = entry.question.toLowerCase().split(/\W+/);
            tokens.forEach(token => {
                if (entryTokens.includes(token)) {
                    score += 5;
                }
            });

            return { entry, score };
        });

        // Filter out zero-score entries, sort by score descending, take topK
        return scoredEntries
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(item => item.entry);
    }
}

// Export a singleton instance
module.exports = new KnowledgeRetriever();
