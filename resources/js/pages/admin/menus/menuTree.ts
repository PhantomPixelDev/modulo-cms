/**
 * The menu builder works on the tree as a flat list in display order, each
 * item with its depth. Moving an item always moves its sub-items with it.
 */
export interface TreeNode {
    id: number;
    parentId: number | null;
    depth: number;
}

/** Nesting levels allowed; matches MenuController::MAX_DEPTH. */
export const MAX_DEPTH = 3;

export function flattenTree(items: Array<{ id: number; parent_id?: number | null; order?: number | null }>): TreeNode[] {
    const ids = new Set(items.map((item) => item.id));
    const children = new Map<number | null, typeof items>();
    for (const item of items) {
        // An item whose parent is gone is shown at the top level
        const parent = item.parent_id != null && ids.has(item.parent_id) ? item.parent_id : null;
        children.set(parent, [...(children.get(parent) ?? []), item]);
    }

    const out: TreeNode[] = [];
    const visit = (parent: number | null, depth: number) => {
        const list = [...(children.get(parent) ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
        for (const item of list) {
            out.push({ id: item.id, parentId: parent, depth });
            visit(item.id, depth + 1);
        }
    };
    visit(null, 0);

    return out;
}

/** Index just past the item's last sub-item. */
export function subtreeEnd(list: TreeNode[], index: number): number {
    let end = index + 1;
    while (end < list.length && list[end].depth > list[index].depth) end++;
    return end;
}

/** Parent ids follow from the depths. */
export function withParents(list: TreeNode[]): TreeNode[] {
    const stack: number[] = [];
    return list.map((node) => {
        stack.length = node.depth;
        const parentId = node.depth > 0 ? (stack[node.depth - 1] ?? null) : null;
        stack[node.depth] = node.id;
        return { ...node, parentId };
    });
}

/**
 * Move an item (with its sub-items) so it starts at `index` of the list
 * without it, at `depth`.
 */
export function moveTo(list: TreeNode[], id: number, index: number, depth: number): TreeNode[] {
    const from = list.findIndex((node) => node.id === id);
    if (from < 0) return list;
    const end = subtreeEnd(list, from);
    const shift = depth - list[from].depth;
    const block = list.slice(from, end).map((node) => ({ ...node, depth: node.depth + shift }));
    const rest = [...list.slice(0, from), ...list.slice(end)];
    rest.splice(index, 0, ...block);

    return withParents(rest);
}

/** How many levels an item's own sub-items add below it. */
function blockHeight(list: TreeNode[], from: number): number {
    const end = subtreeEnd(list, from);
    let height = 0;
    for (let i = from; i < end; i++) height = Math.max(height, list[i].depth - list[from].depth);
    return height;
}

/**
 * Where a dragged item would land when held over `overId`: the insertion
 * index in the list without it, and the depth, kept between what the
 * neighbours allow. Null when that spot is inside the dragged item itself.
 */
export function project(
    list: TreeNode[],
    dragId: number,
    overId: number,
    position: 'before' | 'after',
    desiredDepth: number,
): { index: number; depth: number } | null {
    const from = list.findIndex((node) => node.id === dragId);
    if (from < 0) return null;
    const end = subtreeEnd(list, from);
    const rest = [...list.slice(0, from), ...list.slice(end)];
    const over = rest.findIndex((node) => node.id === overId);
    if (over < 0) return null;

    const index = position === 'before' ? over : over + 1;
    const previous = rest[index - 1];
    const next = rest[index];
    const maxDepth = Math.min(previous ? previous.depth + 1 : 0, MAX_DEPTH - 1 - blockHeight(list, from));
    const minDepth = next ? next.depth : 0;
    const depth = Math.max(minDepth, Math.min(maxDepth, desiredDepth));

    return { index, depth: Math.max(0, depth) };
}

function siblings(list: TreeNode[], index: number): { previous: number; next: number } {
    const node = list[index];
    let previous = -1;
    for (let i = index - 1; i >= 0 && list[i].depth >= node.depth; i--) {
        if (list[i].depth === node.depth) {
            previous = i;
            break;
        }
    }
    const end = subtreeEnd(list, index);
    const next = end < list.length && list[end].depth === node.depth ? end : -1;

    return { previous, next };
}

/** Swap with the sibling above. */
export function moveUp(list: TreeNode[], id: number): TreeNode[] {
    const index = list.findIndex((node) => node.id === id);
    const { previous } = siblings(list, index);
    return previous < 0 ? list : moveTo(list, id, previous, list[index].depth);
}

/** Swap with the sibling below. */
export function moveDown(list: TreeNode[], id: number): TreeNode[] {
    const index = list.findIndex((node) => node.id === id);
    const { next } = siblings(list, index);
    if (next < 0) return list;
    // After the next sibling's own sub-items, counted in the list without this item
    const blockSize = subtreeEnd(list, index) - index;
    return moveTo(list, id, subtreeEnd(list, next) - blockSize, list[index].depth);
}

/** Become the last sub-item of the sibling above. */
export function indent(list: TreeNode[], id: number): TreeNode[] {
    const index = list.findIndex((node) => node.id === id);
    const { previous } = siblings(list, index);
    if (previous < 0 || list[index].depth + 1 + blockHeight(list, index) > MAX_DEPTH - 1) return list;
    return moveTo(list, id, index, list[index].depth + 1);
}

/** Move out of the parent, to just after it. */
export function outdent(list: TreeNode[], id: number): TreeNode[] {
    const index = list.findIndex((node) => node.id === id);
    const node = list[index];
    if (!node || node.depth === 0) return list;
    const parent = list.findIndex((candidate) => candidate.id === node.parentId);
    const blockSize = subtreeEnd(list, index) - index;
    return moveTo(list, id, subtreeEnd(list, parent) - blockSize, node.depth - 1);
}

export function canMove(list: TreeNode[], id: number) {
    const index = list.findIndex((node) => node.id === id);
    if (index < 0) return { up: false, down: false, indent: false, outdent: false };
    const { previous, next } = siblings(list, index);
    return {
        up: previous >= 0,
        down: next >= 0,
        indent: previous >= 0 && list[index].depth + 1 + blockHeight(list, index) <= MAX_DEPTH - 1,
        outdent: list[index].depth > 0,
    };
}

/** What the server stores: each item with its parent, in display order. */
export function toPayload(list: TreeNode[]): Array<{ id: number; parent_id: number | null }> {
    return list.map((node) => ({ id: node.id, parent_id: node.parentId }));
}
