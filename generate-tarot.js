const fs = require('fs');

const content = fs.readFileSync('C:\\Users\\skyne\\.gemini\\antigravity\\brain\\72d41757-d4f9-4d51-affd-8e1786cb3fc9\\.system_generated\\steps\\57\\content.md', 'utf-8');

// The file has line numbers: `1: text` format.
// We need to strip the line numbers.
const lines = content.split('\n');
let jsonLines = [];
let inJson = false;

for (let line of lines) {
    // remove prefix like "123: "
    let cleanLine = line.replace(/^\d+:\s?/, '');
    if (cleanLine.trim() === '{' && !inJson) {
        inJson = true;
    }
    if (inJson) {
        jsonLines.push(cleanLine);
    }
}

// Find where the JSON array ends or just the final '}'
while (jsonLines.length > 0 && jsonLines[jsonLines.length - 1].trim() !== '}') {
    jsonLines.pop();
}

const jsonString = jsonLines.join('\n');
const data = JSON.parse(jsonString);

const mapPrefix = {
    'm': 'ar',
    'c': 'cu',
    'w': 'wa',
    's': 'sw',
    'p': 'pe'
};

const processedCards = data.cards.map(c => {
    let oldImg = c.img; // e.g. "m00.jpg"
    let prefix = oldImg[0];
    let newPrefix = mapPrefix[prefix];
    let num = oldImg.substring(1);
    let newImg = `https://sacred-texts.com/tarot/pkt/img/${newPrefix}${num}`;
    return {
        id: oldImg.replace('.jpg', ''),
        name: c.name,
        number: c.number,
        arcana: c.arcana,
        suit: c.suit,
        image: newImg
    };
});

const tsContent = `export interface TarotCard {
    id: string;
    name: string;
    number: string;
    arcana: string;
    suit: string | null;
    image: string;
}

export const tarotDeck: TarotCard[] = ${JSON.stringify(processedCards, null, 4)};
`;

if (!fs.existsSync('src/data')) {
    fs.mkdirSync('src/data', { recursive: true });
}
fs.writeFileSync('src/data/tarot.ts', tsContent);
console.log('Tarot deck data created successfully.');
