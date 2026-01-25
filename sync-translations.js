const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public', 'locales');
const enPath = path.join(localesDir, 'en', 'translation.json');
const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const enKeys = Object.keys(enContent);

// Get all language directories
const languages = fs.readdirSync(localesDir).filter(f => {
    const stat = fs.statSync(path.join(localesDir, f));
    return stat.isDirectory() && f !== 'en';
});

console.log(`Syncing ${enKeys.length} English keys to ${languages.length} language files...\n`);

let totalAdded = 0;

languages.forEach(lang => {
    const filePath = path.join(localesDir, lang, 'translation.json');

    if (!fs.existsSync(filePath)) {
        console.log(`  Skipping ${lang} - no translation.json`);
        return;
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let addedCount = 0;

    enKeys.forEach(key => {
        if (!(key in content)) {
            content[key] = enContent[key]; // Use English as placeholder
            addedCount++;
        }
    });

    if (addedCount > 0) {
        fs.writeFileSync(filePath, JSON.stringify(content, null, '\t') + '\n', 'utf8');
        console.log(`  ${lang}: added ${addedCount} keys`);
        totalAdded += addedCount;
    } else {
        console.log(`  ${lang}: up to date`);
    }
});

console.log(`\nDone! Added ${totalAdded} total keys.`);
