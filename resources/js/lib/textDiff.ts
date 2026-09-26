export type DiffPart = { type: 'same' | 'added' | 'removed'; text: string };

/** Beyond this many tokens a pair is shown as replaced rather than compared word by word. */
const MAX_TOKENS = 600;

/** Longest-common-subsequence diff of two token lists. */
function diffTokens(a: string[], b: string[]): DiffPart[] {
    const n = a.length;
    const m = b.length;
    // lengths[i][j] = LCS length of a[i..] and b[j..]
    const lengths: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
        }
    }

    const parts: DiffPart[] = [];
    const push = (type: DiffPart['type'], text: string) => {
        const last = parts[parts.length - 1];
        if (last && last.type === type) last.text += text;
        else parts.push({ type, text });
    };

    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (a[i] === b[j]) {
            push('same', a[i]);
            i++;
            j++;
        } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
            push('removed', a[i++]);
        } else {
            push('added', b[j++]);
        }
    }
    while (i < n) push('removed', a[i++]);
    while (j < m) push('added', b[j++]);

    return parts;
}

const words = (text: string) => text.match(/\s+|[^\s]+/g) ?? [];

/**
 * What changed between two plain texts, by word. Texts are compared
 * paragraph by paragraph first, so long articles stay fast.
 */
export function diffText(before: string, after: string): DiffPart[] {
    const paragraphs = (text: string) => (text ? text.split(/(?<=\n)/) : []);
    const blocks = diffTokens(paragraphs(before), paragraphs(after));

    const out: DiffPart[] = [];
    const push = (part: DiffPart) => {
        const last = out[out.length - 1];
        if (last && last.type === part.type) last.text += part.text;
        else if (part.text) out.push({ ...part });
    };

    for (let k = 0; k < blocks.length; k++) {
        const block = blocks[k];
        const next = blocks[k + 1];
        // A paragraph that was edited shows up as removed + added: compare those by word
        if (block.type === 'removed' && next?.type === 'added') {
            const a = words(block.text);
            const b = words(next.text);
            if (a.length <= MAX_TOKENS && b.length <= MAX_TOKENS) {
                diffTokens(a, b).forEach(push);
            } else {
                push(block);
                push(next);
            }
            k++;
            continue;
        }
        push(block);
    }

    return out;
}
