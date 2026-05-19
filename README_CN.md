<div align="center">

# R2Web - 浏览器逆向工程平台

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![WebAssembly](https://img.shields.io/badge/Platform-WebAssembly-654ff0.svg)](https://webassembly.org/)
[![Version](https://img.shields.io/badge/version-0.0.1-green.svg)](https://github.com/secnotes/r2web/releases/tag/v0.0.1)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![radare2](https://img.shields.io/badge/radare2-6.1.5-orange.svg)](https://radare.org/)
[![Emscripten](https://img.shields.io/badge/Emscripten-5.0.7-yellow.svg)](https://emscripten.org/)

**基于 [Radare2](https://github.com/radareorg/radare2) WebAssembly 的浏览器逆向分析工具，类似 IDA Pro/Cutter/iaito。**

[English](README.md) | [中文](README_CN.md)

</div>

## 功能特性

- 📁 **文件分析** - 支持 ELF、PE、Mach-O 等多种二进制格式
- 🔍 **反汇编视图** - 带语法高亮的汇编代码显示
- 📊 **控制流图** - 可视化 CFG，边缘正确绕过基本块
- 🔢 **十六进制视图** - 原始十六进制数据与 ASCII 显示
- 📝 **字符串视图** - 从二进制中提取的字符串列表
- 📋 **函数列表** - 所有函数列表，支持导航跳转
- 📦 **节区/符号/导入** - 二进制结构概览
- 💻 **命令行** - 交互式 radare2 命令界面
- 🎨 **主题支持** - 亮色/暗色主题，自动检测系统偏好
- 🌐 **多语言** - 英文/中文界面切换

## 截图

![R2Web 截图](pictures/demo.png)

## 快速开始

### 开发模式

```bash
npm install
npm run dev
# 打开 http://localhost:5173
```

### 构建

```bash
npm run build
```

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **样式**: CSS (Catppuccin 主题)
- **后端**: radare2 编译为 WebAssembly (WASI)
- **运行时**: @wasmer/wasi 提供 WASM 执行环境

## 项目结构

```
r2web/
├── src/
│   ├── components/     # UI 组件
│   ├── hooks/          # React hooks (useR2)
│   ├── lib/            # 核心逻辑 (R2WasiRuntime, WASIInit)
│   ├── types/          # TypeScript 类型定义
│   ├── styles/         # CSS 样式
│   └── wasm/           # radare2 WebAssembly 模块
├── scripts/            # 构建脚本
├── index.html
├── vite.config.ts
└── package.json
```

## WASM 模块

项目使用编译为 WebAssembly 的 radare2：

- `radare2.wasm` (~42MB) - 完整分析引擎
- `rasm2.wasm` (~23MB) - 快速反汇编

模块按需加载，并显示进度追踪。

### 从源码编译 WASM

如果你想自己编译 WASM 模块：

1. 安装 [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)：
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. 克隆并编译 radare2：
   ```bash
   git clone https://github.com/radareorg/radare2.git
   cd radare2
   ./sys/emscripten.sh  # 输出: dist/web/radare2.wasm
   ```

3. 复制 WASM 文件到 `src/wasm/`：
   ```bash
   cp dist/web/*.wasm ../r2web/src/wasm/
   ```

## 浏览器要求

- 支持 WebAssembly 的现代浏览器
- 需启用 SharedArrayBuffer（要求 COOP/COEP 响应头）
- 推荐：Chrome 88+、Firefox 89+、Safari 15+

## 相关项目

- [radare2](https://github.com/radareorg/radare2) - 逆向工程框架
- [iaito](https://github.com/radareorg/iaito) - radare2 Qt GUI
- [Cutter](https://cutter.re/) - 现代 radare2 GUI

## 许可证

[MIT License](LICENSE)

## 贡献

欢迎贡献代码！请随时提交 Pull Request。