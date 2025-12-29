/**
 * Remove Unicode Emojis from Files
 * Fixes encoding issues in git, deployment, and Windows environments
 */

const fs = require('fs');
const path = require('path');

// Comprehensive emoji regex pattern
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F910}-\u{1F96B}\u{1F980}-\u{1F9E0}\u{2B50}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{23E9}-\u{23EC}\u{23F0}\u{23F3}\u{2600}-\u{2603}\u{2614}-\u{2615}\u{2622}-\u{2623}\u{262E}-\u{262F}\u{2638}-\u{263A}\u{2648}-\u{2653}\u{2660}\u{2663}\u{2665}-\u{2666}\u{2668}\u{267B}\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}-\u{269C}\u{26A0}-\u{26A1}\u{26AA}-\u{26AB}\u{26B0}-\u{26B1}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26C8}\u{26CE}-\u{26CF}\u{26D1}\u{26D3}-\u{26D4}\u{26E9}-\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;

// Emoji to text replacements
const EMOJI_REPLACEMENTS = {
  '[OK]': '[OK]',
  '[X]': '[X]',
  '[!]': '[!]',
  '[!]': '[!]',
  '[ROCKET]': '[ROCKET]',
  '[TOOL]': '[TOOL]',
  '[PAGE]': '[LIST]',
  '[MOBILE]': '[MOBILE]',
  '[SEARCH]': '[SEARCH]',
  '[TOOLS]': '[TOOLS]',
  '[TOOLS]': '[TOOLS]',
  '[TARGET]': '[TARGET]',
  '[LOCK]': '[LOCK]',
  '[CHART]': '[CHART]',
  '[PARTY]': '[PARTY]',
  '[BOOKS]': '[BOOKS]',
  '[PACKAGE]': '[BOX]',
  '[ANTENNA]': '[ANTENNA]',
  '[CYCLE]': '[CYCLE]',
  '[BULB]': '[IDEA]',
  '[STAR]': '[STAR]',
  '[NEW]': '[NEW]',
  '[CART]': '[CART]',
  '[SPARKLE]': '[SPARKLE]',
  '[STAR]': '[STAR]',
  '[STRONG]': '[STRONG]',
  '[THUMBSUP]': '[THUMBSUP]',
  '[FIRE]': '[FIRE]',
  '[MEMO]': '[MEMO]',
  '[UP]': '[TRENDING]',
  '[ART]': '[ART]',
  '[KEY]': '[KEY]',
  '[LIGHTNING]': '[LIGHTNING]',
  '[RAINBOW]': '[RAINBOW]',
  '[TROPHY]': '[TROPHY]',
  '[GIFT]': '[GIFT]',
  '[BELL]': '[BELL]',
  '[MONEY]': '[MONEY]',
  '[GLOBE]': '[GLOBE]',
  '[GLOBE]': '[GLOBE]',
  '[GLOBE]': '[GLOBE]',
  '[PIN]': '[PIN]',
  '[PIN]': '[PIN]',
  '[LINK]': '[LINK]',
  '[COMPUTER]': '[COMPUTER]',
  '[KEYBOARD]': '[KEYBOARD]',
  '[KEYBOARD]': '[KEYBOARD]',
  '[DESKTOP]': '[DESKTOP]',
  '[DESKTOP]': '[DESKTOP]',
  '[MOUSE]': '[MOUSE]',
  '[MOUSE]': '[MOUSE]',
  '[DISK]': '[DISK]',
  '[CD]': '[CD]',
  '[DVD]': '[DVD]',
  '[GAME]': '[GAME]',
  '[JOYSTICK]': '[JOYSTICK]',
  '[JOYSTICK]': '[JOYSTICK]',
  '[DICE]': '[DICE]',
  '[SLOT]': '[SLOT]',
  '[CIRCUS]': '[CIRCUS]',
  '[THEATER]': '[THEATER]',
  '[CLAPPER]': '[CLAPPER]',
  '[MIC]': '[MIC]',
  '[HEADPHONE]': '[HEADPHONE]',
  '[MUSIC]': '[MUSIC]',
  '[PIANO]': '[PIANO]',
  '[TRUMPET]': '[TRUMPET]',
  '[GUITAR]': '[GUITAR]',
  '[VIOLIN]': '[VIOLIN]',
  '[DRUM]': '[DRUM]',
  '[CAMERA]': '[CAMERA]',
  '[VIDEO]': '[VIDEO]',
  '[TV]': '[TV]',
  '[RADIO]': '[RADIO]',
  '[PHONE]': '[PHONE]',
  '[PHONE]': '[PHONE]',
  '[PHONE]': '[PHONE]',
  '[PAGER]': '[PAGER]',
  '[FAX]': '[FAX]',
  '[BATTERY]': '[BATTERY]',
  '[PLUG]': '[PLUG]',
  '[BULB]': '[BULB]',
  '[FLASHLIGHT]': '[FLASHLIGHT]',
  '[CANDLE]': '[CANDLE]',
  '[CANDLE]': '[CANDLE]',
  '[TRASH]': '[TRASH]',
  '[TRASH]': '[TRASH]',
  '[FOLDER]': '[FOLDER]',
  '[FOLDER]': '[FOLDER]',
  '[FOLDER]': '[FOLDER]',
  '[FOLDER]': '[FOLDER]',
  '[FILE]': '[FILE]',
  '[FILE]': '[FILE]',
  '[PAGE]': '[PAGE]',
  '[PAGE]': '[PAGE]',
  '[BOOKMARK]': '[BOOKMARK]',
  '[DOWN]': '[CHART]',
  '[DOWN]': '[DOWN]',
  '[UP]': '[UP]',
  '[ABACUS]': '[ABACUS]',
  '[RULER]': '[RULER]',
  '[TRIANGLE]': '[TRIANGLE]',
  '[PENCIL]': '[PENCIL]',
  '[PENCIL]': '[PENCIL]',
  '[PEN]': '[PEN]',
  '[PEN]': '[PEN]',
  '[PEN]': '[PEN]',
  '[PEN]': '[PEN]',
  '[PEN]': '[PEN]',
  '[PEN]': '[PEN]',
  '[CRAYON]': '[CRAYON]',
  '[CRAYON]': '[CRAYON]',
  '[MAILBOX]': '[MAILBOX]',
  '[MAILBOX]': '[MAILBOX]',
  '[MAILBOX]': '[MAILBOX]',
  '[MAILBOX]': '[MAILBOX]',
  '[MAILBOX]': '[MAILBOX]',
  '[ENVELOPE]': '[ENVELOPE]',
  '[ENVELOPE]': '[ENVELOPE]',
  '[EMAIL]': '[EMAIL]',
  '[LETTER]': '[LETTER]',
  '[INBOX]': '[INBOX]',
  '[OUTBOX]': '[OUTBOX]',
  '[PACKAGE]': '[PACKAGE]'
};

// Files to process
const FILE_PATTERNS = [
  '**/*.md',
  '**/*.js',
  '**/*.ts',
  '**/*.json',
  '**/*.yml',
  '**/*.yaml',
  '**/*.txt',
  '**/*.sql'
];

// Directories to skip
const SKIP_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  'logs'
];

/**
 * Check if path should be skipped
 */
function shouldSkip(filePath) {
  return SKIP_DIRS.some(dir => filePath.includes(dir));
}

/**
 * Remove emojis from text with replacements
 */
function removeEmojis(text) {
  let cleaned = text;
  
  // First, replace known emojis with text equivalents
  for (const [emoji, replacement] of Object.entries(EMOJI_REPLACEMENTS)) {
    cleaned = cleaned.split(emoji).join(replacement);
  }
  
  // Then remove any remaining emojis
  cleaned = cleaned.replace(EMOJI_REGEX, '');
  
  return cleaned;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = removeEmojis(content);
    
    if (content !== cleaned) {
      fs.writeFileSync(filePath, cleaned, 'utf8');
      console.log(` Cleaned: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(` Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Recursively find files
 */
function findFiles(dir, extensions = []) {
  let results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      if (shouldSkip(filePath)) {
        continue;
      }
      
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results = results.concat(findFiles(filePath, extensions));
      } else if (extensions.length === 0 || extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return results;
}

/**
 * Main execution
 */
function main() {
  console.log('=== Remove Unicode Emojis ===\n');
  
  const rootDir = process.cwd();
  const extensions = ['.md', '.js', '.ts', '.json', '.yml', '.yaml', '.txt', '.sql'];
  
  console.log(`Scanning: ${rootDir}`);
  console.log(`Extensions: ${extensions.join(', ')}\n`);
  
  const files = findFiles(rootDir, extensions);
  console.log(`Found ${files.length} files to check\n`);
  
  let cleanedCount = 0;
  
  for (const file of files) {
    if (processFile(file)) {
      cleanedCount++;
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total files scanned: ${files.length}`);
  console.log(`Files cleaned: ${cleanedCount}`);
  console.log(`Files unchanged: ${files.length - cleanedCount}`);
  
  if (cleanedCount > 0) {
    console.log('\n[OK] Emoji cleanup complete!');
    console.log('Run "git diff" to review changes before committing.');
  } else {
    console.log('\n[OK] No emojis found. All files clean!');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { removeEmojis, processFile };
