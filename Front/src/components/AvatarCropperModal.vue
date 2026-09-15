<template>
  <el-dialog
    v-model="visible"
    title="调整头像与裁剪选区"
    width="680px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    class="avatar-cropper-dialog"
  >
    <div class="cropper-container">
      <!-- 左侧：交互式画布舞台与操作工具栏 -->
      <div class="cropper-main">
        <div class="canvas-wrap">
          <canvas
            ref="canvasRef"
            :width="stageSize"
            :height="stageSize"
            class="crop-stage"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
            @wheel.prevent="onWheel"
          />
          <div class="stage-guide-hint">
            <span>拖拽平移视窗 · 滚轮缩放大小</span>
          </div>
        </div>

        <!-- 缩放与旋转控制坞 -->
        <div class="cropper-toolbar">
          <div class="zoom-control">
            <el-icon class="zoom-icon-btn" @click="zoomOutStep"><ZoomOut /></el-icon>
            <el-slider
              v-model="sliderValue"
              :min="10"
              :max="300"
              :step="1"
              :show-tooltip="false"
              class="zoom-slider"
              @input="onSliderChange"
            />
            <el-icon class="zoom-icon-btn" @click="zoomInStep"><ZoomIn /></el-icon>
          </div>

          <div class="action-buttons-row">
            <el-button size="small" @click="rotateLeft" plain>
              <el-icon><RefreshLeft /></el-icon>
              <span>向左旋</span>
            </el-button>
            <el-button size="small" @click="rotateRight" plain>
              <el-icon><RefreshRight /></el-icon>
              <span>向右旋</span>
            </el-button>
            <el-button size="small" @click="resetTransform" plain>
              <el-icon><Aim /></el-icon>
              <span>居中复位</span>
            </el-button>
            <el-button size="small" @click="toggleMaskShape" plain>
              <span>{{ maskShape === 'circle' ? '方形视窗' : '圆形视窗' }}</span>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧：实时预览区域与规格展示 -->
      <div class="cropper-preview-pane">
        <div class="pane-title">实时预览效果</div>

        <div class="preview-group">
          <div class="preview-item">
            <canvas ref="previewLargeRef" width="80" height="80" class="preview-canvas circle-preview" />
            <span class="preview-sub">大头像 (80px)</span>
          </div>
          <div class="preview-item">
            <canvas ref="previewMediumRef" width="48" height="48" class="preview-canvas rounded-preview" />
            <span class="preview-sub">侧边栏 (48px)</span>
          </div>
          <div class="preview-item">
            <canvas ref="previewSmallRef" width="34" height="34" class="preview-canvas circle-preview" />
            <span class="preview-sub">聊天 (34px)</span>
          </div>
        </div>

        <div class="preview-tips-box">
          <div class="tip-line">标准 1:1 比例裁切</div>
          <div class="tip-line">360×360 高清输出</div>
          <div class="tip-line">仅保存选区内有效画面</div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <div class="cropper-footer">
        <div class="footer-left">
          <input
            ref="reselectInputRef"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            style="display: none"
            @change="onReselectFile"
          />
          <el-button plain @click="reselectInputRef?.click()">
            <el-icon><FolderOpened /></el-icon>
            <span>重新选图</span>
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="visible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="confirming"
            @click="handleConfirmCrop"
          >
            确定裁剪并保存
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { RefreshLeft, RefreshRight, Aim, ZoomOut, ZoomIn, FolderOpened } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  imageSrc: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'crop-success'])

const visible = ref(props.modelValue)
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    nextTick(() => {
      loadImage(props.imageSrc)
    })
  }
})
watch(visible, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.imageSrc, (newSrc) => {
  if (visible.value && newSrc) {
    loadImage(newSrc)
  }
})

// 画布尺寸参数
const stageSize = 340
const cropBoxSize = 220
const R = cropBoxSize / 2
const cx = stageSize / 2
const cy = stageSize / 2

const canvasRef = ref(null)
const previewLargeRef = ref(null)
const previewMediumRef = ref(null)
const previewSmallRef = ref(null)
const reselectInputRef = ref(null)

const confirming = ref(false)
const maskShape = ref('circle') // 'circle' | 'rect'

// 图像变换状态
let imgObj = null
let baseScale = 1
let scale = 1
let offsetX = 0
let offsetY = 0
let rotation = 0 // 0, 90, 180, 270
const sliderValue = ref(100)

// 拖拽状态
let isDragging = false
let startX = 0
let startY = 0

function loadImage(src) {
  if (!src) return
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    imgObj = img
    // 计算初始适配缩放：让图片最小边覆盖 cropBoxSize
    const minDim = Math.min(img.width, img.height)
    baseScale = cropBoxSize / minDim
    scale = baseScale
    offsetX = 0
    offsetY = 0
    rotation = 0
    sliderValue.value = 100
    renderAll()
  }
  img.onerror = () => {
    ElMessage.error('加载待裁剪图片失败，请重试')
  }
  img.src = src
}

function renderAll() {
  drawStage()
  drawPreview(previewLargeRef.value, 80)
  drawPreview(previewMediumRef.value, 48)
  drawPreview(previewSmallRef.value, 34)
}

function drawStage() {
  const canvas = canvasRef.value
  if (!canvas || !imgObj) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, stageSize, stageSize)

  // 1. 绘制暗色背景
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, stageSize, stageSize)

  // 2. 绘制经过拖拽、缩放、旋转后的原图
  ctx.save()
  ctx.translate(cx + offsetX, cy + offsetY)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(scale, scale)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(imgObj, -imgObj.width / 2, -imgObj.height / 2)
  ctx.restore()

  // 3. 绘制半透明遮罩与镂空裁切视窗
  ctx.save()
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)'
  ctx.beginPath()
  ctx.rect(0, 0, stageSize, stageSize)

  // 镂空（根据 maskShape）
  if (maskShape.value === 'circle') {
    ctx.arc(cx, cy, R, 0, Math.PI * 2, true)
  } else {
    // 逆时针绘制矩形进行镂空
    const left = cx - R
    const top = cy - R
    ctx.moveTo(left, top)
    ctx.lineTo(left, top + cropBoxSize)
    ctx.lineTo(left + cropBoxSize, top + cropBoxSize)
    ctx.lineTo(left + cropBoxSize, top)
    ctx.closePath()
  }
  ctx.fill('evenodd')
  ctx.restore()

  // 4. 绘制裁切框边界与九宫格指引线
  ctx.save()
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  if (maskShape.value === 'circle') {
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
  } else {
    ctx.strokeRect(cx - R, cy - R, cropBoxSize, cropBoxSize)
  }
  ctx.stroke()

  // 裁切框内微弱九宫格细线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  const step = cropBoxSize / 3
  for (let i = 1; i <= 2; i++) {
    // 竖线
    ctx.beginPath()
    ctx.moveTo(cx - R + step * i, cy - R + 10)
    ctx.lineTo(cx - R + step * i, cy + R - 10)
    ctx.stroke()
    // 横线
    ctx.beginPath()
    ctx.moveTo(cx - R + 10, cy - R + step * i)
    ctx.lineTo(cx + R - 10, cy - R + step * i)
    ctx.stroke()
  }
  ctx.restore()
}

function drawPreview(canvas, targetSize) {
  if (!canvas || !imgObj) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, targetSize, targetSize)

  const ratio = targetSize / cropBoxSize

  ctx.save()
  // 裁切视窗居中映射
  ctx.translate(targetSize / 2 + offsetX * ratio, targetSize / 2 + offsetY * ratio)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(scale * ratio, scale * ratio)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(imgObj, -imgObj.width / 2, -imgObj.height / 2)
  ctx.restore()
}

// 鼠标与触摸交互
function onMouseDown(e) {
  isDragging = true
  startX = e.clientX
  startY = e.clientY
}

function onMouseMove(e) {
  if (!isDragging) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  startX = e.clientX
  startY = e.clientY
  offsetX += dx
  offsetY += dy
  renderAll()
}

function onMouseUp() {
  isDragging = false
}

function onTouchStart(e) {
  if (e.touches.length === 1) {
    isDragging = true
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
  }
}

function onTouchMove(e) {
  if (!isDragging || e.touches.length !== 1) return
  const dx = e.touches[0].clientX - startX
  const dy = e.touches[0].clientY - startY
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  offsetX += dx
  offsetY += dy
  renderAll()
}

function onTouchEnd() {
  isDragging = false
}

function onWheel(e) {
  const delta = e.deltaY < 0 ? 1.08 : 0.92
  const newScale = scale * delta
  // 限制缩放范围
  if (newScale >= baseScale * 0.2 && newScale <= baseScale * 5) {
    scale = newScale
    sliderValue.value = Math.round((scale / baseScale) * 100)
    renderAll()
  }
}

function onSliderChange(val) {
  scale = baseScale * (val / 100)
  renderAll()
}

function zoomOutStep() {
  sliderValue.value = Math.max(10, sliderValue.value - 15)
  onSliderChange(sliderValue.value)
}

function zoomInStep() {
  sliderValue.value = Math.min(300, sliderValue.value + 15)
  onSliderChange(sliderValue.value)
}

function rotateLeft() {
  rotation = (rotation - 90 + 360) % 360
  renderAll()
}

function rotateRight() {
  rotation = (rotation + 90) % 360
  renderAll()
}

function resetTransform() {
  scale = baseScale
  offsetX = 0
  offsetY = 0
  rotation = 0
  sliderValue.value = 100
  renderAll()
}

function toggleMaskShape() {
  maskShape.value = maskShape.value === 'circle' ? 'rect' : 'circle'
  renderAll()
}

function onReselectFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 10MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (evt) => {
    loadImage(evt.target.result)
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

// 导出高分辨率头像
async function handleConfirmCrop() {
  if (!imgObj) return
  confirming.value = true

  try {
    const exportSize = 360
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = exportSize
    exportCanvas.height = exportSize
    const exportCtx = exportCanvas.getContext('2d')

    const ratio = exportSize / cropBoxSize

    exportCtx.save()
    exportCtx.translate(exportSize / 2 + offsetX * ratio, exportSize / 2 + offsetY * ratio)
    exportCtx.rotate((rotation * Math.PI) / 180)
    exportCtx.scale(scale * ratio, scale * ratio)
    exportCtx.imageSmoothingEnabled = true
    exportCtx.imageSmoothingQuality = 'high'
    exportCtx.drawImage(imgObj, -imgObj.width / 2, -imgObj.height / 2)
    exportCtx.restore()

    exportCanvas.toBlob((blob) => {
      if (!blob) {
        confirming.value = false
        ElMessage.error('裁剪失败，请重试')
        return
      }
      const croppedFile = new File([blob], `avatar_cropped_${Date.now()}.png`, { type: 'image/png' })
      const previewDataUrl = exportCanvas.toDataURL('image/png')
      emit('crop-success', {
        file: croppedFile,
        dataUrl: previewDataUrl
      })
      visible.value = false
      confirming.value = false
    }, 'image/png', 0.95)
  } catch (err) {
    confirming.value = false
    ElMessage.error('裁剪处理异常：' + (err.message || '未知错误'))
  }
}
</script>

<style scoped>
.avatar-cropper-dialog :deep(.el-dialog__body) {
  padding: 16px 20px;
}

.cropper-container {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.cropper-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.canvas-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  background: #0f172a;
  cursor: grab;
}

.canvas-wrap:active {
  cursor: grabbing;
}

.crop-stage {
  display: block;
}

.stage-guide-hint {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  color: #94a3b8;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  pointer-events: none;
  white-space: nowrap;
}

.cropper-toolbar {
  width: 100%;
  max-width: 340px;
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zoom-icon-btn {
  font-size: 16px;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-icon-btn:hover {
  color: #2563eb;
  background: #e2e8f0;
}

.zoom-slider {
  flex: 1;
}

.action-buttons-row {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

.action-buttons-row :deep(.el-button) {
  flex: 1;
  padding: 6px 8px;
  font-size: 11px;
}

/* 预览侧边面板 */
.cropper-preview-pane {
  width: 180px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pane-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 16px;
}

.preview-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.preview-canvas {
  background: #f1f5f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid #ffffff;
}

.circle-preview {
  border-radius: 50%;
}

.rounded-preview {
  border-radius: 12px;
}

.preview-sub {
  font-size: 11px;
  color: #64748b;
}

.preview-tips-box {
  margin-top: 20px;
  width: 100%;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tip-line {
  font-size: 11px;
  color: #475569;
}

.cropper-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
