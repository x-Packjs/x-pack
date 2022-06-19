import { addSuffix } from "../utils";
import Module from "../Module";
import fs from "fs";
import type { Node } from "acorn";
import { Bundle as MagicStringBundle } from "magic-string";
import { timeStamp } from "console";

type Options = {
    entry: string;
};

class Bundle {
    /**
     * 入口文件的绝对路径
     */
    private entryPath: string;

    /**
     * 存放所有模块
     */
    private modules: { [propName: string]: Module };

    private statements: Node[];

    constructor(options: Options) {
        this.entryPath = addSuffix(options.entry, 'js');
        this.modules = {};
    }

    public build(outputFileName: string) {
        const entryModule = this.fetchModule(this.entryPath);
        // 把入口模块所有的语句进行展开
        this.statements = entryModule.expandAllStatements();
        const { code } = this.generate();
        fs.writeFileSync(outputFileName, code, 'utf-8');
    }

    public fetchModule(modulePath: string) {
        let route = modulePath;
        if (route) {
            let sourceCode = fs.readFileSync(route, 'utf-8');
            const module = new Module({
                sourceCode,
                path: route,
                bundle: this,
            });
            return module;
        }
    }

    private generate(): { code: string } {
        let magicString = new MagicStringBundle();
        this.statements.forEach((statement: any) => {
            const source = statement._source.clone();
            magicString.addSource({
                content: source,
            });
        });
        return { code: magicString.toString() };
    }
}

export default Bundle;