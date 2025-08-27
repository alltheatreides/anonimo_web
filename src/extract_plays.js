import fs from 'node:fs';
import path from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

function parseArgs() {
    const args = process.argv.slice(2);
    const usage = 'Usage: node src/extract_plays.js <PDF_PATH> <PAGE_START> <PAGE_END> <MAX_PLAY> <OUT_PATH>';
    if (args.length < 5) {
        console.error(usage);
        process.exit(1);
    }
    const [PDF_PATH, PAGE_START, PAGE_END, MAX_PLAY, OUT_PATH] = args;
    return {
        PDF_PATH,
        PAGE_START: parseInt(PAGE_START, 10),
        PAGE_END: parseInt(PAGE_END, 10),
        MAX_PLAY: parseInt(MAX_PLAY, 10),
        OUT_PATH
    };
}

const PDF_PATH = 'D:\\HEMA\\Sources\\Anonimo\\anonimo_web\\sources\\Anonimo_Bolognese_translation_(Stephen_Fratus).pdf';
const PAGE_START = 22; // inclusive, 1-indexed
const PAGE_END = 122;   // inclusive
const MAX_PLAY = 455;
const OUT_PATH = 'D:\\HEMA\\Sources\\Anonimo\\anonimo_web\\sources\\single_sword_plays\\anonimo_plays.json';

async function extractPageText(doc, pageNum) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const text = content.items.map(i => i.str).join(' ');
    return text.replace(/\s+\n\s+/g, '\n').replace(/\s{2,}/g, ' ').trim();
}

function findPlayPositions(text, maxPlay) {
    const positions = [];
    for (let n = 1; n <= maxPlay; n++) {
        const variants = [
            new RegExp(`(?:^|\\n|\\r|\\s)Play\\s+${n}(?=\\s|[).:-])`, 'i'),
            new RegExp(`(?:^|\\n|\\r|\\s)${n}\\s*[\\)\\.:\\-]`, 'i'),
        ];
        let best = -1;
        for (const rx of variants) {
            const m = rx.exec(text);
            if (m && (best === -1 || m.index < best)) best = m.index;
        }
        if (best !== -1) positions.push({ n, pos: best });
    }
    positions.sort((a, b) => a.pos - b.pos);
    const ordered = [];
    const seen = new Set();
    for (const p of positions) {
        if (!seen.has(p.n)) {
            seen.add(p.n);
            ordered.push(p);
        }
    }
    return ordered;
}

function slicePlays(text, positions) {
    const plays = [];
    for (let i = 0; i < positions.length; i++) {
        const { n, pos } = positions[i];
        const end = i + 1 < positions.length ? positions[i + 1].pos : text.length;
        const chunk = text.slice(pos, end).trim();
        const headingRx = new RegExp(`^(?:Play\\s+)?${n}\\s*[\\)\\.:\\-]\\s*`, 'i');
        const cleaned = chunk.replace(headingRx, '').trim();
        plays.push({ number: n, text: cleaned });
    }
    return plays;
}

(async () => {
    try {
        const { PDF_PATH, PAGE_START, PAGE_END, MAX_PLAY, OUT_PATH } = parseArgs();
        const outDir = path.dirname(OUT_PATH);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        const data = new Uint8Array(fs.readFileSync(PDF_PATH));
        const doc = await pdfjs.getDocument({ data }).promise;

        const pages = [];
        for (let p = PAGE_START; p <= PAGE_END; p++) {
            pages.push(await extractPageText(doc, p));
        }
        const full = pages.join('\n');

        const positions = findPlayPositions(full, MAX_PLAY);
        if (positions.length === 0) {
            console.error('No play headings found. Adjust regex patterns or page range.');
            process.exit(1);
        }

        const plays = slicePlays(full, positions).filter(p => p.number >= 1 && p.number <= MAX_PLAY);

        fs.writeFileSync(OUT_PATH, JSON.stringify(plays, null, 2), 'utf8');
        console.log(`Extracted ${plays.length} plays -> ${OUT_PATH}`);
    } catch (err) {
        console.error('Failed:', err);
        process.exit(1);
    }
})();