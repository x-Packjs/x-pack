import type { Node } from "acorn";
import type MagicString from "magic-string";
import type Bundle from "../Bundle";
import Scope from "./scope";
import walk from "./walk";

function analyse(ast: Node, sourceCode: MagicString, bundle: Bundle): void {
    // 全局作用域
    let scope = new Scope();
    (ast as any).body.forEach((statement: Node) => {
        // 给当前作用域添加变量
        function addToScope(declaration: any) {
            // 获取这个变量名或者方法名
            let name = declaration.id.name;
            // 将当前的变量/方法名添加到全局作用于下
            scope.add(name);
            if (!scope.parent) {
                // 如果是全局作用域 则将该变量放到全局变量中
                // 有可能遍历到了某个方法中的变量 此时不应该放到全局变量中
                (statement as any)._defines[name] = true;
            }
        }

        Object.defineProperties(statement, {
            // 存放当前模块定义的全局变量
            _defines: { value: {} },
            // 存放当前模块未定义但是使用到的变量，及外部依赖的变量
            _dependsOn: { value: {} },
            // 该模块的此语句是否已经被包含在打包结果中了
            _included: { value: false, writable: true },
            _source: {
                value: sourceCode.snip(statement.start, statement.end)
            },
        });

        // 构建作用域链
        walk(statement, {
            enter(currentNode) {
                let newScope: Scope;
                switch (currentNode.type) {
                    case 'FunctionDeclaration':
                        const params = (currentNode as any).params.map((x: any) => x.name);
                        addToScope(currentNode);
                        // 如果是方法 则新增一个作用域 并将该作用于挂载到上一个作用域下
                        newScope = new Scope({
                            parent: scope,
                            names: params
                        });
                        break;
                    case 'VariableDeclaration':
                        (currentNode as any).declarations.forEach(addToScope);
                        break;
                }
                // 如果当前节点生成了一个新的作用域 例如是一个方法
                if (newScope) {
                    // 关联当前节点生成的作用域
                    Object.defineProperty(currentNode, '_scope', { value: newScope });
                    // 后续statement的全局作用域变成了当前节点的作用域
                    scope = newScope;
                }
            },
            leave(currentNode) {
                // 如果离开的节点是一个方法 拥有自己的作用域 则需要将全局作用域更新为当前节点的父作用域
                if ((currentNode as any)._scope) {
                    scope = scope.parent;
                }
            }
        });
    });

    // 找到当前模块（文件）所有外部依赖
    (ast as any).body.forEach((statement: Node) => {
        walk(statement, {
            enter(currentNode) {
                // 更新当前作用域
                if ((currentNode as any)._scope) {
                    scope = (currentNode as any)._scope;
                }

                if (currentNode.type === 'Identifier') {
                    // 从当前作用域出发，递归向上查找该变量
                    const definingScope = scope.findDefiningScope((currentNode as any).name);
                    if (!definingScope) {
                        (statement as any)._dependsOn[(currentNode as any).name] = true;
                    }
                }
            },
            leave(currentNode) {
                if ((currentNode as any)._scope) {
                    scope = scope.parent;
                }
            }
        });
    });
}

export default analyse;