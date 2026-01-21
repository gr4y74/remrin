export const emoticons: Record<string, string> = {
    ':)': '😊',
    ':-)': '😊',
    ':(': '😞',
    ':-(': '😞',
    ':D': '😃',
    ':-D': '😃',
    ';)': '😉',
    ';-)': '😉',
    ':P': '😛',
    ':-P': '😛',
    ':p': '😛',
    ':-p': '😛',
    ':O': '😮',
    ':-O': '😮',
    ':o': '😮',
    ':-o': '😮',
    '<3': '❤️',
    ':|': '😐',
    ':-|': '😐',
    ':*': '😘',
    ':-*': '😘',
    '8)': '😎',
    '8-)': '😎',
    '>:(': '😠',
    '>:-(': '😠',
    ':\'(': '😢',
    ':\'-( ': '😢',
    'O:)': '😇',
    'O:-)': '😇',
    'o:)': '😇',
    'o:-)': '😇',
    'xD': '😆',
    'XD': '😆'
};

const emoticonRegex = new RegExp(
    '(' +
    Object.keys(emoticons)
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special chars
        .join('|') +
    ')',
    'g'
);

export function parseEmoticons(text: string): string {
    if (!text) return text;
    return text.replace(emoticonRegex, (match) => emoticons[match] || match);
}

export function prepareForMarkdown(text: string): string {
    let processed = parseEmoticons(text);
    // Convert *text* to **text** (Bold) - simplistic approach
    processed = processed.replace(/\*([^*]+)\*/g, '**$1**');
    // Convert _text_ to *text* (Italic)
    processed = processed.replace(/_([^_]+)_/g, '*$1*');
    // Color {red}text{/red} -> <span style="color:red">text</span> (ReactMarkdown needs rehype-raw for html, or use custom components logic)
    // For now we skip color or generic Markdown doesn't support it without HTML. 
    // And ReactMarkdown defaults disable HTML. 
    // We will stick to Bold/Italic for now as requested "Basic formatting".
    return processed;
}

export const commonEmoticons = [
    '😊', '😃', '😉', '😛',
    '😮', '❤️', '😞', '😐',
    '😘', '😎', '😠', '😢',
    '😇', '😆', '👍', '👎'
];
