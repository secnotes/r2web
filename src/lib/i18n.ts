// Simple i18n support
type Lang = 'en' | 'zh'

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Views
    'view_disassembly': 'Disassembly',
    'view_decompiler': 'Decompiler',
    'view_graph': 'Graph',
    'view_hex': 'Hex',
    'view_strings': 'Strings',
    'view_imports': 'Imports',
    'view_symbols': 'Symbols',
    'view_sections': 'Sections',
    'view_functions': 'Functions',
    // Header
    'settings': 'Settings',
    'theme': 'Theme',
    'language': 'Language',
    'dark': 'Dark',
    'light': 'Light',
    'english': 'English',
    'chinese': 'Chinese',
    // HexView
    'hex_dump': 'Hex Dump',
    'full_file': 'Full file',
    'bytes_total': 'bytes total',
    'loading': 'Loading...',
    // DisassemblyView
    'assembly': 'Assembly',
    'showing': 'Showing',
    'instructions': 'instructions',
    // StringsView
    'strings_title': 'Strings',
    'filter_strings': 'Filter strings...',
    // SectionsView
    'sections_title': 'Sections',
    'name': 'Name',
    'size': 'Size',
    'address': 'Address',
    'flags': 'Flags',
    // SymbolsView
    'symbols_title': 'Symbols',
    'filter_symbols': 'Filter symbols...',
    'imports': 'Imports',
    'exports': 'Exports',
    // StatusBar
    'ready': 'Ready',
    'offset': 'Offset',
    'architecture': 'Architecture',
    'format': 'Format',
    // FileDrop
    'drop_file': 'Drop binary file here',
    'or_click': 'or click to select',
    'supports': 'Supports ELF, PE, Mach-O',
    // Console
    'console': 'Console',
  },
  zh: {
    // Views
    'view_disassembly': '反汇编',
    'view_decompiler': '反编译',
    'view_graph': '图形',
    'view_hex': '十六进制',
    'view_strings': '字符串',
    'view_imports': '导入',
    'view_symbols': '符号',
    'view_sections': '段',
    'view_functions': '函数',
    // Header
    'settings': '设置',
    'theme': '主题',
    'language': '语言',
    'dark': '暗色',
    'light': '亮色',
    'english': '英语',
    'chinese': '中文',
    // HexView
    'hex_dump': '十六进制',
    'full_file': '完整文件',
    'bytes_total': '字节',
    'loading': '加载中...',
    // DisassemblyView
    'assembly': '汇编',
    'showing': '显示',
    'instructions': '条指令',
    // StringsView
    'strings_title': '字符串',
    'filter_strings': '过滤字符串...',
    // SectionsView
    'sections_title': '段',
    'name': '名称',
    'size': '大小',
    'address': '地址',
    'flags': '属性',
    // SymbolsView
    'symbols_title': '符号',
    'filter_symbols': '过滤符号...',
    'imports': '导入',
    'exports': '导出',
    // StatusBar
    'ready': '就绪',
    'offset': '偏移',
    'architecture': '架构',
    'format': '格式',
    // FileDrop
    'drop_file': '拖放二进制文件到这里',
    'or_click': '或点击选择',
    'supports': '支持 ELF, PE, Mach-O',
    // Console
    'console': '控制台',
  }
}

let currentLang: Lang = 'en'

export function initLang(): Lang {
  const saved = localStorage.getItem('r2web-language')
  if (saved === 'zh' || saved === 'en') {
    currentLang = saved
  }
  return currentLang
}

export function setLang(lang: Lang): void {
  currentLang = lang
  localStorage.setItem('r2web-language', lang)
}

export function getLang(): Lang {
  return currentLang
}

export function t(key: string): string {
  return translations[currentLang][key] || key
}