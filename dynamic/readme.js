const path = require('path');

module.exports = function generateReadmeFile(info) {
    const name = path.basename(info.root);
    return [
        `# ${name}`,
        '[TODO - Some general package information here]',
        '## Getting Started',
        'npm install [lib location here]',
        '',
        '[TODO - Some information about how to get going]'
    ].join('\n');
};
