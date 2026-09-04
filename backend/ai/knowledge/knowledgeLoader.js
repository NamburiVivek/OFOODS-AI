const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Default path if not specified
const EXCEL_PATH = path.join(__dirname, 'ofoodsFAQ.xlsx');
const JSON_OUTPUT_PATH = path.join(__dirname, 'ofoodsKnowledge.json');

function extractKnowledge(excelPath = EXCEL_PATH) {
    if (!fs.existsSync(excelPath)) {
        console.error(`[Error] Excel file not found at: ${excelPath}`);
        console.error('Please make sure the file exists.');
        return null;
    }

    try {
        const workbook = xlsx.readFile(excelPath);
        const knowledgeBase = [];

        // Iterate through all sheets
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            
            // Read as json, treating first row as headers
            const rawData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

            rawData.forEach((row, index) => {
                // Normalize keys (lowercase, trim spaces)
                const normalizedRow = {};
                for (const key in row) {
                    const cleanKey = key.trim().toLowerCase();
                    normalizedRow[cleanKey] = row[key];
                }

                // Extract relevant fields, fallback to typical column names
                const question = normalizedRow['question'] || normalizedRow['query'] || normalizedRow['q'] || "";
                const answer = normalizedRow['answer'] || normalizedRow['response'] || normalizedRow['a'] || "";
                const category = normalizedRow['category'] || normalizedRow['topic'] || sheetName || "general";
                const keywords = normalizedRow['keywords'] || normalizedRow['tags'] || "";
                
                if (question && answer) {
                    knowledgeBase.push({
                        id: `faq_${sheetName}_${index}`,
                        category: category.trim(),
                        question: question.trim(),
                        answer: answer.trim(),
                        keywords: keywords ? keywords.split(',').map(k => k.trim().toLowerCase()) : []
                    });
                }
            });
        }

        fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(knowledgeBase, null, 2), 'utf8');
        console.log(`Successfully extracted ${knowledgeBase.length} entries to ${JSON_OUTPUT_PATH}`);
        return knowledgeBase;

    } catch (error) {
        console.error("Error reading Excel file:", error.message);
        return null;
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const customPath = args[0] ? path.resolve(args[0]) : undefined;
    extractKnowledge(customPath);
}

module.exports = {
    extractKnowledge
};
