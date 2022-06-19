import type Bundle from "../Bundle";
import MagicString from "magic-string";
import { parse } from "acorn";
import type { Node } from "acorn";
import analyse from "../Ast/analyse";

type Options = {
    sourceCode: string;
    path: string;
    bundle: Bundle;
};

/**
 * 每个文件都解析为一个模块
 */
class Module {
    private sourceCode: MagicString;

    /**
     * 模块对应的文件所在路径
     */
    private path: string;

    private bundle: Bundle;

    private ast: Node;

    constructor(options: Options) {
        this.sourceCode = new MagicString(options.sourceCode);
        this.path = options.path;
        this.bundle = options.bundle;
        this.ast = parse(options.sourceCode, {
            ecmaVersion: 7,
            sourceType: 'module'
        });
        this.analyse();
    }

    private analyse(): void {
        analyse(this.ast, this.sourceCode, this.bundle);
    }

    /**
     * 展开每个语句中的内容
     * 即如果该条语句中是用到了某个变量 则把变量的定义也拿到这里
     * 或者该条语句调用了某个方法 将这个方法的定义也拿到这里
     * @returns 
     */
    public expandAllStatements(): Node[] {
        let allStatements = [];
        (this.ast as any).body.forEach((statement: Node) => {
            let statements = this.expandStatements(statement);
            allStatements.push(...statements);
        });
        return allStatements;
    }

    /**
     * 找到语句中依赖的变量 定义的方法等
     * @param statement 待展开的语句
     */
    private expandStatements(statement: Node): Node[] {
        (statement as any)._included = true;
        let result = [];
        result.push(statement);
        return result;
    }
}

export default Module;