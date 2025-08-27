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
 * Extracts the antagonist guard from the play text
 * @param {string} text - The text content to extract antagonist guard from
 * @param {boolean} second - Whether to extract the second antagonist guard (if "or" is present)
 * @returns {string|null} - The protagonist guard or null if not found
 */
function extractAntagonistGuard(text, second = false) {
    const title = extractTitle(text);
    const parts = title.split(/\s+vs\.?\s+/i);

    const guardPatterns = [
        'porta di ferro stretta',  // Move more specific patterns first
        'porta di ferro larga',
        'porta larga di ferro',
        'porta di ferro alta',
        'cinghiara porta di ferro stretta',
        'cinghiara porta di ferro larga',
        'cinghiara porta di ferro',
        'coda lunga stretta',     // Less specific patterns later
        'coda lunga streta',
        'coda lunga larga',
        'coda lunga alta',
        'guardia di intrare',
        'guardia di testa',
        'guardia alta',
        'guardia di faccia',
        'guardia di sopra braccio',
        'guardia sopra braccio',
        'guardia di lioncorno',
        'guardia lioncorno',
        'guardia liocorno',
        'sword in presence',
        'point in presence',
        'porta alta di ferro',
        'false edge',
        'false to false',
        'true edge mezza spada',
        'true edge',
        'mezza spada',
        'guard with the right foot forward',
        'cinghiara pora di ferro stretta',
        'any',
        'unstated'
    ];

    if (parts.length >= 2) {
        const antagonistPart = parts[1].trim().toLowerCase();
        const orParts = antagonistPart.split(/\s+or\s+/i);

        if (orParts.length >= 2 && second) { // call of the function with second = true
            const secondGuardPart = orParts[1].trim().toLowerCase();
            for (const guard of guardPatterns) {
                if (secondGuardPart.includes(guard.toLowerCase())) {
                    return guard;
                }
            }
        } else if (orParts.length >= 2 && !second) { // call of the function with second = false
            const firstGuardPart = orParts[0].trim().toLowerCase();
            for (const guard of guardPatterns) {
                if (firstGuardPart.includes(guard.toLowerCase())) {
                    return guard;
                }
            }
        } else if (orParts.length === 1 && !second) { // If there is no or part, proceed as usual
            const firstGuardPart = orParts[0].trim().toLowerCase();
            for (const guard of guardPatterns) {
                if (firstGuardPart.includes(guard.toLowerCase())) {
                    return guard;
                }
            }
        }

    } else { // Handle cases where antagonist guard is not specified in title but in text body
        // Patterns that indicate "any" guard placement
        const anyGuardPatterns = [
            /finding your enemy in any guard he wants/i,
            /finding your adversary in what placement he wants/i,
            /finding your enemy placed however he wants/i,
            /finding your enemy in any guard/i,
            /against your enemy in whatsoever guard/i,
            /in whatsoever guard he wants/i,
            /in any guard he wants/i,
            /in what guard he wants/i,
            /however he wants/i,
            /whatsoever.*guard/i,
            /any.*guard/i
        ];

        // Check for "any" guard patterns first
        for (const pattern of anyGuardPatterns) {
            if (pattern.test(text)) {
                return "any";
            }
        }

       // If there is patiente in the title, antagonist guard is often not specified, so also return "any"
         if (/as Patiente/i.test(title) && !second) {
            return "any";
         }

    }

    return null;
}


/**
 * Extracts if the play is with the protagonist as patient
 * @returns boolean - true if protagonist is patient, otherwise undefined
 * @param text
 */
function extractPatient(text) {
    // Look for "as Patiente" or similar patterns in the title
    const title = extractTitle(text);
    if (/as Patiente/i.test(title)) {
        return true;
    } else {
        return null;
    }
}


/**
 * Extracts the protagonist foot position from the play text
 * Returns 'left', 'right', or null if not found
 * @param {string} text
 */
function extractProtagonistFoot(text) {
    // Foot position patterns
    const footPatterns = [
        'with the left foot forward',
        'with the right foot forward',
        'with the right forward',
        'left foot forward',
        'left foot traversing',
        'right foot forward',
        'right foot traversing',
    ];

    // Analyze the title first
    const title = extractTitle(text).toLowerCase();

    // split by "vs." to get protagonist part
    const parts = title.split(/\s+vs\.?\s+/i);
    if (parts.length >= 2) {
        const protagonistPart = parts[0].trim().toLowerCase();

        // Check if any foot pattern is found in the protagonist part and return only the foot direction
        for (const foot of footPatterns) {
            if (protagonistPart.includes(foot)) {
                return foot.includes('left') ? 'left' : 'right';
            }
        }

        // Look for alternative patterns with '(L)' or '(R)'
        const altMatch = protagonistPart.match(/\((L|R)\)/i);
        if (altMatch) {
            return altMatch[1].toUpperCase() === 'L' ? 'left' : 'right';
        }

    } else { // Handle single foot scenarios (no "vs")

        for (const foot of footPatterns) {
            if (title.includes(foot)) {
                return foot.includes('left') ? 'left' : 'right';
            }
        }

        // Look for alternative patterns with '(L)' or '(R)'
        const altMatch = title.match(/\((L|R)\)/i);
        if (altMatch) {
            return altMatch[1].toUpperCase() === 'L' ? 'left' : 'right';
        }
    }

    // Look inside the text for explicit foot positions
    const protagonistFootPatterns = [
        /you will be (?:set|found|placed) (?:against him )?in .+? with (?:your |the )?(\w+) foot forward/i,
        /you will be in .+? (?:but )?with (?:your |the )?(\w+) foot forward/i,
        /you will be in .+? with the (?:your |the )?(\w+) foot in narrow stance/i,
        /you (?:will be|are) set .+? with (?:your |the )?(\w+) foot forward/i,
        /you (?:being|remaining) .+? with (?:your |the )?(\w+) foot forward/i,
        /you .+? with (?:your |the )?(\w+) foot forward/i,
        /being in .+? with (?:your |the )?(\w+) foot forward/i,
        /remaining in .+? with (?:your |the )?(\w+) foot forward/i,
        /finding yourself .+? with (?:your |the )?(\w+) foot forward/i,
        /you are in .+? with (?:your |the )?(\w+) foot forward/i,
        /remaining as above in .+? with your (\w+) foot forward/i,
        /you will be set in .+? with the (\w+) foot traversing/i,
    ];

    // Patterns that indicate "same" foot position as enemy
    const sameFootPatterns = [
        /your adversary is set in .+? with the (\w+) foot forward and you are set in the same way/i,
        /your adversary is set in .+? with the (\w+) foot forward you will be in the same/i,
        /your enemy is set in .+? with the (\w+) foot forward you will yourself be placed in the same guard/i,
        /your enemy is set in .+? with the (\w+) foot forward, you will be opposite him in the same guard/i,
        /your enemy is set in .+? with the (\w+) foot forward, you will yourself be in the same guard/i,
        /your enemy is set with the sword settled in .+? with the (\w+) foot forward, you will yourself be in the same guard/i,
        /your enemy is settled in .+? with the (\w+) foot forward and you are set in the same/i,
        /your enemy is set with the sword settled in .+? with the (\w+) foot forward, you yourself will be set in the same arrangement/i,
        /your enemy is set in .+? with the (\w+) foot forward and you are set in porta di ferro larga, with the same foot forward/i,
        /you will be set in .+? with the same foot forward/i,
        /you will yourself be set opposite him in the same stance/i,
        /you will be likewise arranged/i,
        /you will be positioned likewise/i,
        /you will be in the same/i,
        /you will settle yourself in the same guard/i,
        /you are settled in the same manner/i,
        /you will be likewise settled/i,
        /you will be placed in the same/i,
        /your enemy is found in .+? with the (\w+) foot forward, you will be in .+? with the same foot forward/i,
        /Your enemy being found settled in .+? with the (\w+) foot forward you yourself will be set in the same way/i,
        /your enemy is set in .+? with the (\w+) foot forward and you are set in the same guard/i,
        /your enemy should be with his .+? with the (\w+) foot forward you will ease yourself into .+? with the same foot forward/i,
        /your enemy should be in .+? with the (\w+) foot forward you will ease yourself into .+? with the same foot forward/i,
    ];

    // First check patterns with explicit foot capture groups
    for (const pattern of protagonistFootPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const foot = match[1].toLowerCase();
            if (foot === 'left' || foot === 'right') {
                return foot;
            }
        }
    }

    // Then check "same" patterns that reference enemy foot
    for (const pattern of sameFootPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const foot = match[1].toLowerCase();
            if (foot === 'left' || foot === 'right') {
                return foot;
            }
        }
    }

    // Finally check "same" patterns without capture groups - extract enemy foot separately
    const simpleSamePatterns = [
        /you will be set in .+? with the same foot forward/i,
        /you will yourself be set opposite him in the same stance/i,
        /you will be likewise arranged/i,
        /you will be positioned likewise/i,
        /you will be in the same/i,
        /you will settle yourself in the same guard/i,
        /you are settled in the same manner/i,
        /you will be likewise settled/i,
        /you will be placed in the same/i
    ];

    for (const pattern of simpleSamePatterns) {
        if (pattern.test(text)) {
            // Extract enemy foot from earlier in the text
            const enemyFootMatch = text.match(/your (?:enemy|adversary) (?:is |being )?(?:set|settled|found|placed) .+? with (?:his |the )?(\w+) foot forward/i);
            if (enemyFootMatch && enemyFootMatch[1]) {
                const foot = enemyFootMatch[1].toLowerCase();
                if (foot === 'left' || foot === 'right') {
                    return foot;
                }
            }
        }
    }

    return null;
}


/**
 * Extracts the antagonist foot position from the play text
 * Returns 'left', 'right', or null if not found
 * @param {string} text
 */
function extractAntagonistFoot(text) {
    // Foot position patterns
    const footPatterns = [
        'with the left foot forward',
        'with the right foot forward',
        'with the right forward',
        'left foot forward',
        'left foot traversing',
        'right foot forward',
        'right foot traversing',
    ];

    // Analyze the title first
    const title = extractTitle(text).toLowerCase();

    // split by "vs." to get antagonist part
    const parts = title.split(/\s+vs\.?\s+/i);
    if (parts.length >= 2) {
        const antagonistPart = parts[1].trim().toLowerCase();

        // Check if any foot pattern is found in the antagonist part and return only the foot direction
        for (const foot of footPatterns) {
            if (antagonistPart.includes(foot)) {
                return foot.includes('left') ? 'left' : 'right';
            }
        }

        // Look for alternative patterns with '(L)' or '(R)'
        const altMatch = antagonistPart.match(/\((L|R)\)/i);
        if (altMatch) {
            return altMatch[1].toUpperCase() === 'L' ? 'left' : 'right';
        }

        // If the guard is "any", foot is likely unstated so return null
        if (antagonistPart.includes('any')) {
            return null;
        }
    }

    // Look inside the text for explicit foot positions
    // Patterns for direct enemy foot position (prioritize these)
    const directEnemyFootPatterns = [
        /your enemy .+? with (?:his |the )?(left|right) foot .+?/i,
        /your adversary .+? with (?:his |the )?(left|right) foot .+?/i,
        /your enemy is set in .+? with (?:his |the )?(left|right) foot forward/i,
        /enemy is set in .+? with (?:the )?(left|right) foot forward/i,
        /adversary is set in .+? with (?:the )?(left|right) foot forward/i,
        /he is set in .+? with (?:the )?(left|right) foot forward/i,
        /enemy remains in .+? with (?:the )?(left|right) foot forward/i,
        /your enemy both being in .+? with (?:the )?(left|right) foot forward/i,
        /your enemy with .+? and his (left|right) foot forward/i,
    ];

    // Check direct patterns first
    for (const pattern of directEnemyFootPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const foot = match[1].toLowerCase();
            if (foot === 'left' || foot === 'right') {
                return foot;
            }
        }
    }

    // Then check the "likewise" pattern (but don't use the one that captures protagonist foot)
    const likewisePattern = /you are set in .+? with your (left|right) foot forward, and your enemy is set likewise/i;
    const likewiseMatch = text.match(likewisePattern);
    if (likewiseMatch && likewiseMatch[1]) {
        const foot = likewiseMatch[1].toLowerCase();
        if (foot === 'left' || foot === 'right') {
            return foot;
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
            antagonist_guard_1: extractAntagonistGuard(play.text),
            antagonist_guard_2: extractAntagonistGuard(play.text, true),
            protagonist_foot_forward: extractProtagonistFoot(play.text),
            antagonist_foot_forward: extractAntagonistFoot(play.text),
            patient: extractPatient(play.text),
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

