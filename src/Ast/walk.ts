import type { Node } from "acorn";

type EnterType = (current: Node, parent?: Node | null) => void;

type LeaveType = (current: Node, parent?: Node | null) => void;

type WalkOptions = {
    enter: EnterType;
    leave: LeaveType;
}

function walk(ast: Node, { enter, leave }: WalkOptions): void {
    visit(ast, null, enter, leave);
}

function visit(node: Node, parent: Node | null, enter?: EnterType, leave?: LeaveType) {
    if (enter) {
        enter(node, parent);
    }
    
    let childKeys = Object.keys(node).filter(key => typeof node[key] === 'object');
    childKeys.forEach(childKey => {
        let value = node[childKey];
        if (Array.isArray(value)) {
            value.forEach(val => visit(val, node, enter, leave));
        } else if (value && value.type) {
            visit(value, node, enter, leave);
        }
    });

    if (leave) {
        leave(node, parent);
    }
}

export default walk;