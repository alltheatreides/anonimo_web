import fs from 'fs';
// Import the original data
const originalData = JSON.parse(fs.readFileSync('./anonimo_plays.json', 'utf8'));


/**
 * Extracts a title from the text content
 * @param {string} text - The text content to extract title from
 * @returns {string} - The extracted title
 */
function extractTitle(text) {
    // Find the second parentheses group, handling nested parentheses properly
    let depth = 0;
    let firstParenEnd = -1;
    let secondParenStart = -1;
    let secondParenEnd = -1;

    // Find the end of the first parentheses group
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '(') {
            depth++;
        } else if (text[i] === ')') {
            depth--;
            if (depth === 0 && firstParenEnd === -1) {
                firstParenEnd = i;
                break;
            }
        }
    }

    if (firstParenEnd === -1) return 'Untitled Play';

    // Find the start of the second parentheses group
    for (let i = firstParenEnd + 1; i < text.length; i++) {
        if (text[i] === '(') {
            secondParenStart = i;
            break;
        }
    }

    if (secondParenStart === -1) return 'Untitled Play';

    // Find the end of the second parentheses group, handling nested parentheses
    depth = 0;
    for (let i = secondParenStart; i < text.length; i++) {
        if (text[i] === '(') {
            depth++;
        } else if (text[i] === ')') {
            depth--;
            if (depth === 0) {
                secondParenEnd = i;
                break;
            }
        }
    }

    if (secondParenEnd === -1) return 'Untitled Play';

    // Extract the title from the second parentheses group
    // Clean up the title by removing "as Patiente" or similar suffixes
    return text.substring(secondParenStart + 1, secondParenEnd)
}

/**
 * Determines if a play is a counter and extracts counter information
 * @param {string} playText - The text content of the play
 * @returns {Object} - Object with isCounter boolean and counterNumber if applicable
 */
function extractCounterData(playText) {

    const counterPatterns = [
        /counter\s+to\s+play\s+#?(\d+)/i,
        /counter\s+to\s+#?(\d+)/i,
        /counter\s+#?(\d+)/i,
        /remedy\s+to\s+play\s+#?(\d+)/i,
        /remedy\s+#?(\d+)/i,
        // New patterns for parentheses cases
        /counter\s+to\s+\(play\s+#?(\d+)\)/i,
        /counter\s+to\s+\(p\.\d+\/#?(\d+)\)/i,
        /counter\s+to\s+\(#?(\d+)\)/i
    ];

    for (const pattern of counterPatterns) {
        const match = playText.match(pattern);
        if (match) {
            return parseInt(match[1], 10);
        }
    }

    return null;
}

/**
 * Extracts the protagonist guard from the play text
 * @param {string} text - The text content to extract protagonist guard from
 * @returns {string|null} - The protagonist guard or null if not found
 */
function extractProtagonistGuard(text) {
    // Common guard patterns
    const guardPatterns = [
        'porta di ferro stretta',
        'porta di ferro larga',
        'porta larga di ferro',
        'porta di ferro alta',
        'porta di ferro larga',
        'coda lunga stretta',
        'coda lunga streta',
        'coda lunga larga',
        'coda lunga alta',
        'guardia di intrare',
        'guardia di testa',
        'guardia alta',
        'guardia di faccia',
        'guardia di sopra braccio',
        'guardia di lioncorno',
        'guardia lioncorno',
        'guardia liocorno',
        'cinghiara porta di ferro stretta',
        'cinghiara porta di ferro',
        'cinghiara porta di ferro larga',
        'sword in presence',
        'false edge',
        'false to false',
        'true edge',
        'true edge mezza spada',
        'mezza spada',
        'any',
        'unstated',
        'guardia sopra braccio',
        'cinghiara pora di ferro stretta',
        'guard with the right foot forward'
    ];

    // Patterns that indicate protagonist guard positioning
    const protagonistPatterns = [
        /you (?:will )?be (?:set|placed) in ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /you (?:will )?be (?:set|placed) against him (?:with|in) ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /you being in ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /remaining in ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /finding yourself (?:set )?in ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /finding yourself (?:set )?(?:in|with) ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /you (?:will )?(?:be )?set yourself in ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /you will be set in ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /you set in ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /you will place yourself in ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /you will place yourself into ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /being in ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /you are set in ([^;,\.]+?)(?:\s+with|;|,|\.)/i,
        /when you are in ([^;,\.]+?)(?:\s+with|;|,|\.)/i
    ];

    // Look for protagonist guard patterns
    // First try to extract from the title structure
    const title = extractTitle(text);

    // In some specific cases the guard is after a semicolon in the title
    const semiColonIndex = title.indexOf(';');
    if (semiColonIndex !== -1) {
        const afterSemi = title.slice(semiColonIndex + 1).trim().toLowerCase();
        for (const guard of guardPatterns) {
            if (afterSemi.includes(guard.toLowerCase())) {
                return guard;
            }
        }
    }

    // Split by "vs." to get protagonist part
    const parts = title.split(/\s+vs\.?\s+/i);
    if (parts.length >= 2) {
        const protagonistPart = parts[0].trim().toLowerCase();

        // Check if any guard pattern is found in the protagonist part
        for (const guard of guardPatterns) {
            if (protagonistPart.includes(guard.toLowerCase())) {
                return guard;
            }
        }
    } else {
        // Handle single guard scenarios (no "vs")
        const singlePart = title.toLowerCase();

        for (const guard of guardPatterns) {
            if (singlePart.includes(guard)) {
                return guard;
            }
        }
    }


    // If not found in title, fall back to existing text pattern matching
    for (const pattern of protagonistPatterns) {
        const match = text.match(pattern);
        if (match) {
            const guardText = match[1].toLowerCase().trim();

            // Check if any guard pattern is found in the matched text
            for (const guard of guardPatterns) {
                if (guardText.includes(guard.toLowerCase())) {
                    return guard;
                }
            }
        }
    }

    return null;
}

/**
 * Main function to extract separate keys from the original data
 * @param {Array} data - Original data array
 * @returns {Array} - Modified data array with new keys
 */
function extract_separate_keys(data) {
    return data.map(play => {
        return {
            ...play,
            protagonist_guard: extractProtagonistGuard(play.text),
            counter: extractCounterData(play.text),
            title: extractTitle(play.text)
        };
    });
}

// Process the data
const processedData = extract_separate_keys(originalData);

// Write to new JSON file
fs.writeFileSync('processed_fencing_plays.json', JSON.stringify(processedData, null, 2));

console.log('Data processed successfully. Check processed_fencing_plays.json');

