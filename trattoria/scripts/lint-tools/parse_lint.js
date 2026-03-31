const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint_full.json', 'utf8'));

const errors = data.flatMap(f =>
    f.messages
        .filter(m => m.severity === 2)
        .map(m => ({
            file: f.filePath.split('\\').pop(),
            line: m.line,
            rule: m.ruleId,
            msg: m.message
        }))
);

console.log('Total errors:', errors.length);
console.log('\nFirst 30 errors:\n');
errors.slice(0, 30).forEach(e => {
    console.log(`${e.file}:${e.line} - ${e.rule}: ${e.msg.substring(0, 60)}`);
});
