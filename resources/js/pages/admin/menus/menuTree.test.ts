import { describe, expect, it } from 'vitest';
import { canMove, flattenTree, indent, moveDown, moveUp, outdent, project, toPayload, type TreeNode } from './menuTree';

// Home, About (Team, Jobs), Contact
const items = [
    { id: 1, parent_id: null, order: 0 },
    { id: 2, parent_id: null, order: 1 },
    { id: 3, parent_id: 2, order: 0 },
    { id: 4, parent_id: 2, order: 1 },
    { id: 5, parent_id: null, order: 2 },
];

const shape = (list: TreeNode[]) => list.map((node) => `${'-'.repeat(node.depth)}${node.id}`).join(' ');

describe('menu tree', () => {
    const tree = flattenTree(items);

    it('lists items depth first in their order', () => {
        expect(shape(tree)).toBe('1 2 -3 -4 5');
        expect(tree[2].parentId).toBe(2);
    });

    it('shows items whose parent is gone at the top level', () => {
        expect(shape(flattenTree([{ id: 9, parent_id: 99, order: 0 }]))).toBe('9');
    });

    it('moves an item with its sub-items', () => {
        expect(shape(moveUp(tree, 5))).toBe('1 5 2 -3 -4');
        expect(shape(moveDown(tree, 1))).toBe('2 -3 -4 1 5');
        expect(shape(moveUp(tree, 2))).toBe('2 -3 -4 1 5');
    });

    it('does nothing past the first or last sibling', () => {
        expect(moveUp(tree, 1)).toBe(tree);
        expect(moveUp(tree, 3)).toBe(tree);
        expect(moveDown(tree, 4)).toBe(tree);
    });

    it('nests under the sibling above and back out', () => {
        const nested = indent(tree, 5);
        expect(shape(nested)).toBe('1 2 -3 -4 -5');
        expect(nested[4].parentId).toBe(2);

        expect(shape(outdent(tree, 3))).toBe('1 2 -4 3 5');
        expect(outdent(tree, 3).find((node) => node.id === 3)?.parentId).toBeNull();
    });

    it('stops at three levels', () => {
        const deep = indent(indent(tree, 4), 5); // 4 under 3
        expect(shape(indent(tree, 4))).toBe('1 2 -3 --4 5');
        expect(canMove(indent(tree, 4), 4).indent).toBe(false);
        expect(shape(deep)).toBe('1 2 -3 --4 -5');
    });

    it('projects a drag between the depths the neighbours allow', () => {
        // Dropping Contact right after About: top level or first child of About
        expect(project(tree, 5, 2, 'after', 0)).toEqual({ index: 2, depth: 1 });
        expect(project(tree, 5, 4, 'after', 0)).toEqual({ index: 4, depth: 0 });
        expect(project(tree, 5, 4, 'after', 5)).toEqual({ index: 4, depth: 2 });
        // Never inside itself
        expect(project(tree, 2, 3, 'before', 0)).toBeNull();
    });

    it('sends every item with its parent', () => {
        expect(toPayload(tree)).toEqual([
            { id: 1, parent_id: null },
            { id: 2, parent_id: null },
            { id: 3, parent_id: 2 },
            { id: 4, parent_id: 2 },
            { id: 5, parent_id: null },
        ]);
    });
});
