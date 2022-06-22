import path from "path";
import * as fs from "fs";
import xPack from "../src/x-pack";
import chalk from "chalk";

async function getTestDirList() {
    let basePath = path.resolve(__dirname);
    let files = await fs.promises.readdir(basePath);
    // 过滤文件
    const dirPath = [];
    for (let file of files) {
        let absPath = path.resolve(basePath, file);
        let fileStat = await fs.promises.stat(absPath);
        fileStat.isDirectory() && dirPath.push(absPath);
    }
    return dirPath;
}

function executeSingleExample(testDir: string) {
    let entry = path.resolve(testDir, 'main.js');
    // 获取打包结果
    xPack(entry, "dist/bundle.js");
    let packResult = fs.readFileSync(path.resolve(__dirname, "../dist/bundle.js"), "utf-8")
        .replace(/(\n|\r|(\r\n)|(\u0085)|(\u2028)|(\u2029))/ig, "");
    // 获取验证结果
    let test = path.resolve(testDir, "__test__.js");
    let testContent = fs.readFileSync(test, "utf-8")
        .replace(/(\n|\r|(\r\n)|(\u0085)|(\u2028)|(\u2029))/ig, "");
    return packResult === testContent;
}

(() => {
    getTestDirList().then(dirList => {
        let rightCount = 0;
        console.log(chalk.magenta("开始测试："));
        dirList.forEach((dir) => {
            executeSingleExample(dir) && rightCount++;
        });
        console.log(chalk.magenta("测试完毕，生成分析报告中。。。"));
        let errorCount = dirList.length - rightCount;
        console.log(chalk.yellow("用例个数："), chalk.white.bgYellow(` ${dirList.length} `),
            chalk.green("成功个数："), chalk.white.bgGreen(` ${rightCount} `),
            chalk.red("错误个数："), chalk.white.bgRed(` ${errorCount} `),
            chalk.bold.yellow("\n通过率："), chalk.bold.white.bgYellow(` ${rightCount / dirList.length * 100}% `));
    });
})();