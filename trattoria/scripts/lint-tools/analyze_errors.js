const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint_full.json', 'utf8'));

const fileErrors = {};

data.forEach(f => {
    if (f.errorCount > 0) {
        const fileName = f.filePath.split('\\').pop();
        const errors = f.messages.filter(m => m.severity === 2);

        if (!fileErrors[fileName]) {
            fileErrors[fileName] = {
                path: f.filePath,
                errors: []
            };
        }

        errors.forEach(e => {
            fileErrors[fileName].errors.push({
                line: e.line,
                rule: e.ruleId,
                message: e.message
            });
        });
    }
});

// Sort files by error count
const sorted = Object.entries(fileErrors).sort((a, b) => b[1].errors.length - a[1].errors.length);

console.log('Files with errors (sorted by count):\n');
sorted.forEach(([file, data]) => {
    console.log(`\n${file} (${data.errors.length} errors):`);
    const errorsByRule = {};
    data.errors.forEach(e => {
        if (!errorsByRule[e.rule]) errorsByRule[e.rule] = [];
        errorsByRule[e.rule].push(e.line);
    });
    Object.entries(errorsByRule).forEach(([rule, lines]) => {
        console.log(`  ${rule}: lines ${lines.join(', ')}`);
    });
});
