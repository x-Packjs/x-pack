import type { Node } from "acorn";
import type MagicString from "magic-string";
import type Bundle from "../Bundle";

function analyse(ast: Node, sourceCode: MagicString, bundle: Bundle): void {
    (ast as any).body.forEach((statement: Node) => {
        Object.defineProperties(statement, {
            _source: {
                value: sourceCode.snip(statement.start, statement.end)
            },
        });
    });
}

export default analyse;