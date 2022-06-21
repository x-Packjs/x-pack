import type Bundle from "../Bundle";
import MagicString from "magic-string";
import { parse } from "acorn";
import type { Node } from "acorn";
import analyse from "../Ast/analyse";
import { AST_TYPE } from "../Constant";
import { hasOwnProperty } from "../utils";

type Options = {
    sourceCode: string;
    path: string;
    bundle: Bundle;
};

type ImportType = {
    name: string;
    aliasName: string;
    source: string;
};

type ExportType = {
    node: Node;
    name: string;
    expression: Node;
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

    /**
     * 当前模块（文件）所有的导入
     */
    private imports: { [propName: string]: ImportType };

    /**
     * 当前模块（文件）所有的导出
     */
    private exports: { [propName: string]: ExportType };

    /**
     * 当前模块（文件）中所有全局变量的定义语句
     */
    private definitions: { [propName: string]: Node };

    constructor(options: Options) {
        this.sourceCode = new MagicString(options.sourceCode);
        this.path = options.path;
        this.bundle = options.bundle;
        this.ast = parse(options.sourceCode, {
            ecmaVersion: 7,
            sourceType: 'module'
        });
        this.imports = {};
        this.exports = {};
        this.definitions = {};
        this.analyse();
    }

    private analyse(): void {
        (this.ast as any).body.forEach((statement: any) => {
            if (statement.type === AST_TYPE.Import) {
                // 导入的文件名
                let source = statement.source.value;
                let specifiers = statement.specifiers;
                specifiers.forEach((specifier: any) => {
                    // 导入的变量名称
                    const name = specifier.imported.name;
                    // 该变量的别名
                    const aliasName = specifier.local.name;
                    this.imports[aliasName] = { name, aliasName, source };
                });
            } else if (statement.type === AST_TYPE.Export) {
                let declaration = statement.declaration;
                if (declaration.type === AST_TYPE.VARIABLE_DECLARATION) {
                    let name = declaration.declarations[0].id.name;
                    this.exports[name] = {
                        node: statement,
                        name,
                        expression: declaration,
                    };
                }
            }
        });
        // 找到每个语句中的_defines和_dependsOn（即在本文件中定义的变量和引用其他文件中的变量）
        analyse(this.ast, this.sourceCode, this.bundle);
        (this.ast as any).body.forEach((statement: any) => {
            Object.keys(statement._defines).forEach(name => {
                this.definitions[name] = statement;
            });
        });
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
            if (statement.type === AST_TYPE.Import) {
                // 导入语句不再需要 直接引入相应的定义语句
                return;
            }
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
        let result = [];
        // 获取该语句中用到的所有外部依赖
        const dependencies = Object.keys((statement as any)._dependsOn);
        dependencies.forEach(name => {
            let definition = this.define(name);
            result.push(...definition);
        });
        if (!(statement as any)._included) {
            (statement as any)._included = true;

            result.push(statement);
        }
        return result;
    }

    private define(name: string): any[] {
        // 如果该变量在该模块的导入名称里
        if (hasOwnProperty(this.imports, name)) {
            const importData = this.imports[name];
            // 获取导入的文件信息
            const module = this.bundle.fetchModule(importData.source, this.path);
            const exportData = module.exports[importData.name];
            // 递归查询 有可能这个变量也是从其他模块导入的
            return module.define(exportData.name);
        } else {
            let statement = this.definitions[name];
            if (statement && !(statement as any)._included) {
                return this.expandStatements(statement);
            } else {
                return [];
            }
        }
    }
}

export default Module;