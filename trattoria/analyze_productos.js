const fs = require('fs');
const data = JSON.parse(fs.readFileSync('productos_lint.json', 'utf8'));

const file = data[0];
const errors = file.messages.filter(m => m.severity === 2);

console.log(`Total errors: ${errors.length}\n`);

// Group by rule
const byRule = {};
errors.forEach(e => {
    if (!byRule[e.ruleId]) byRule[e.ruleId] = [];
    byRule[e.ruleId].push(e);
});

Object.entries(byRule).forEach(([rule, errs]) => {
    console.log(`\n${rule} (${errs.length} occurrences):`);
    errs.slice(0, 5).forEach(e => {
        console.log(`  Line ${e.line}: ${e.message.substring(0, 80)}`);
    });
    if (errs.length > 5) {
        console.log(`  ... and ${errs.length - 5} more`);
    }
});
