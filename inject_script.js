const fs = require('fs');
const path = require('path');

const targetFiles = [
    'index.html', 'menu.html', 'all-items.html', 'papad.html', 
    'pickles.html', 'snacks.html', 'spices.html', 'product.html', 
    'cart.html', 'Checkout.html', 'review.html', 'profile.html', 
    'login.html', 'conformation.html'
];

const dir = path.join(__dirname, 'frontend');

targetFiles.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove old injections if they exist (without the duplicate protection we might have added them in different ways)
        content = content.replace(/<!-- OFoods AI Assistant -->\s*<script src="ai-assistant\.js"><\/script>\s*/gi, '');
        content = content.replace(/<script src="ai-assistant\.js"><\/script>\s*/gi, '');

        // Now inject just before </body>
        const scriptTag = '\n  <!-- OFoods AI Assistant -->\n  <script src="ai-assistant.js"></script>\n';
        
        if (content.includes('</body>')) {
            content = content.replace('</body>', scriptTag + '</body>');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Injected into ' + file);
        } else {
            console.log('Could not find </body> in ' + file);
        }
    } else {
        console.log('File not found: ' + file);
    }
});
console.log('Done');
