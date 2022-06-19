import Bundle from "./Bundle";

function xPack(entry: string, outputFileName: string): void {
    // 打包对象 包含所有模块信息
    const bundle = new Bundle({ entry });
    bundle.build(outputFileName);
}

export default xPack;