<template>
  <router-view />
</template>

<style>
:root {
  /* VRChat 经典松石青绿 (Teal) 全局主题色变量 */
  --el-color-primary: #00b4c5;
  --el-color-primary-light-3: #40cbd9;
  --el-color-primary-light-5: #80dfeb;
  --el-color-primary-light-7: #b3edf3;
  --el-color-primary-light-8: #cceffa;
  --el-color-primary-light-9: #e6f7fa;
  --el-color-primary-dark-2: #009aa8;
}

/* 全局暗色沉浸式滚动条 (Game-grade Slim Scrollbars) */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.28);
  border-radius: 4px;
  transition: background 0.2s;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

/* 文本平滑渲染与选中态高亮 */
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::selection {
  background: rgba(0, 180, 197, 0.35);
  color: #ffffff;
}
</style>
