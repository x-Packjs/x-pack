import * as path from "path";
import xPack from "./src/x-pack";

// 获取入口文件的绝对路径
let entry = path.resolve(__dirname, 'test/main.js');
xPack(entry, 'dist/bundle.js');
