const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'tarot.ts');
let content = fs.readFileSync(filePath, 'utf8');

for (let i = 1; i <= 14; i++) {
    const id = 'c' + i.toString().padStart(2, '0');
    // find the image string for this id
    const regex = new RegExp(`("id": "${id}",[\\s\\S]*?"image": )"https://sacred-texts.com/tarot/pkt/img/cu\\d{2}\\.jpg"`, 'g');
    content = content.replace(regex, `$1"/cards/${id}.png"`);
}

fs.writeFileSync(filePath, content);
console.log('Updated tarot.ts with local Cups paths.');
