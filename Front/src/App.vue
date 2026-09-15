<template>
  <router-view />
</template>

<style>
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
  background: rgba(99, 102, 241, 0.38);
  color: #ffffff;
}
</style>
