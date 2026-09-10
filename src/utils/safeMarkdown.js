'use strict';

const ALLOWED_TAGS = new Set([
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'a',
    'span',
]);

const GLOBAL_FORBIDDEN_ATTR = /^(on\w+|style|srcdoc|formaction|xmlns|xlink:href)$/i;

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isSafeHref(href) {
    if (typeof href !== 'string') {
        return false;
    }

    const trimmed = href.trim();
    if (!trimmed) {
        return false;
    }

    if (/^\s*javascript:/i.test(trimmed)) {
        return false;
    }

    if (/^\s*data:/i.test(trimmed) && !/^data:image\/(?:png|jpeg|jpg|gif|webp);base64,/i.test(trimmed)) {
        return false;
    }

    return /^(https?:\/\/|mailto:|#)/i.test(trimmed);
}

function sanitizeAttributes(element) {
    for (const attr of [...element.attributes]) {
        const name = attr.name.toLowerCase();
        if (GLOBAL_FORBIDDEN_ATTR.test(name)) {
            element.removeAttribute(attr.name);
            continue;
        }

        if (name === 'href' || name === 'src') {
            if (!isSafeHref(attr.value)) {
                element.removeAttribute(attr.name);
            }
            continue;
        }

        if (name === 'target') {
            element.setAttribute('rel', 'noopener noreferrer');
            continue;
        }

        if (name !== 'data-word' && name !== 'colspan' && name !== 'rowspan' && name !== 'title' && name !== 'rel') {
            element.removeAttribute(attr.name);
        }
    }
}

function sanitizeHtmlTree(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    const toRemove = [];

    while (walker.nextNode()) {
        const element = walker.currentNode;
        const tag = element.tagName.toLowerCase();

        if (['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'link', 'meta', 'base'].includes(tag)) {
            toRemove.push(element);
            continue;
        }

        if (!ALLOWED_TAGS.has(tag)) {
            const parent = element.parentNode;
            if (parent) {
                while (element.firstChild) {
                    parent.insertBefore(element.firstChild, element);
                }
                toRemove.push(element);
            }
            continue;
        }

        sanitizeAttributes(element);
    }

    for (const node of toRemove) {
        node.remove();
    }
}

function stripDangerousMarkup(html) {
    return String(html)
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
        .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
        .replace(/<embed[\s\S]*?>/gi, '')
        .replace(/<svg[\s\S]*?>[\s\S]*?<\/svg>/gi, '')
        .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/\s(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '');
}

function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    const stripped = stripDangerousMarkup(html);

    if (typeof DOMParser === 'undefined') {
        return stripped;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(stripped, 'text/html');
    sanitizeHtmlTree(doc.body);
    return doc.body.innerHTML;
}

function prepareMarkdownContent(content) {
    if (!content || typeof content !== 'string') {
        return '';
    }

    let text = content;
    text = text.replace(/\*\*\s+([^*\n]+?)\s+\*\*/g, '**$1**');

    const boldMarkerCount = (text.match(/\*\*/g) || []).length;
    if (boldMarkerCount % 2 === 1) {
        text += '**';
    }

    return text;
}

function cleanupRenderedHtml(html) {
    const parts = html.split(/(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/gi);

    return parts
        .map((part, index) => {
            if (index % 2 === 1) {
                return part;
            }

            return part.replace(/\*\*([^*<\n]+?)\*\*/g, '<strong>$1</strong>').replace(/\*\*/g, '');
        })
        .join('');
}

function fallbackFormatMarkdown(content) {
    const prepared = prepareMarkdownContent(content);

    return sanitizeHtml(
        prepared
            .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*\*/g, '')
            .replace(/\n/g, '<br>')
    );
}

function renderSafeMarkdown(content, marked) {
    const prepared = prepareMarkdownContent(content);
    const escaped = escapeHtml(prepared);

    if (typeof marked !== 'function' && (!marked || typeof marked.parse !== 'function')) {
        return fallbackFormatMarkdown(content);
    }

    try {
        const parse = typeof marked === 'function' ? marked : marked.parse.bind(marked);
        let rendered = parse(escaped, { breaks: true, gfm: true });
        rendered = cleanupRenderedHtml(rendered);
        return sanitizeHtml(rendered);
    } catch (error) {
        console.warn('Error parsing markdown safely:', error);
        return fallbackFormatMarkdown(content);
    }
}

function wrapWordsInSpans(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tagsToSkip = ['PRE'];

    function wrap(node) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && !tagsToSkip.includes(node.parentNode.tagName)) {
            const words = node.textContent.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            words.forEach(word => {
                if (word.trim()) {
                    const span = document.createElement('span');
                    span.setAttribute('data-word', '');
                    span.textContent = word;
                    frag.appendChild(span);
                } else {
                    frag.appendChild(document.createTextNode(word));
                }
            });
            node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === Node.ELEMENT_NODE && !tagsToSkip.includes(node.tagName)) {
            Array.from(node.childNodes).forEach(wrap);
        }
    }

    Array.from(doc.body.childNodes).forEach(wrap);
    return sanitizeHtml(doc.body.innerHTML);
}

const api = {
    escapeHtml,
    sanitizeHtml,
    stripDangerousMarkup,
    renderSafeMarkdown,
    wrapWordsInSpans,
    isSafeHref,
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}

if (typeof globalThis !== 'undefined') {
    globalThis.menaceSafeMarkdown = api;
}
