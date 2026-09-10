# 开运二号外观概念模型网页

静态 Three.js 单页，基于公开实物参考图建立展示级外观；不代表卫星制造、尺寸或功能参数。

## 2026-09-05 展示与交互修正

- Three.js 0.167.1 和 OrbitControls 随站点部署，许可证在 vendor/THREE-LICENSE.txt，无运行时 CDN 依赖。
- 画布 CSS 尺寸独立于高分屏像素尺寸，修复模型偏出视口；窄屏自动适配相机距离。
- 首帧后结束加载；模块异常、20 秒超时、WebGL 上下文丢失显示重试入口。
- 正面、侧面、复位、缩放、自转；拖动暂停自转。聚焦画布后方向键旋转，+/- 缩放，Home 复位；遵循减少动态效果偏好。
- 调整太阳能板间距，避免相邻单元重叠；统一 Z 向上相机。

验证：本地浏览器正常首帧、按钮交互，390px 手机布局截图；拦截 app.js 模拟失败并点击重试恢复；延迟模块加载验证 loading 状态。

## 科技深色重设计（已选定）

风格依据项目根 DESIGN.md；本次已同步更新 docs 页面与 design/prototype/orbital-gallery.html 单文件交付。历史海报和其他非本次页面的设计产物未修改。

- 模型舞台、展品说明、细节探索、展示设置分区，桌面双栏、手机单栏。
- 太阳能阵列、环形结构、外露组件高亮；可取消选择，不把推定信息当作实际工程参数。
- 平滑切换透视/正面/侧面，调整灯光、开关网格、全屏；减少动态效果偏好下关闭自转和过渡。
- 重复太阳能单元用 InstancedMesh 合批，避免每块单元单独绘制。
- 单文件交付包含完整脚本、样式及渲染依赖，适合下载打开；在线站点从 docs 部署。

验证记录见 ../output/playwright/verify.cjs：320/390/768/1440px 无横向溢出，三视角、缩放、键盘、部件选择/取消、灯光、网格、全屏；模块加载失败后重试、延迟加载状态、模拟渲染上下文丢失后重试。截图位于 ../output/playwright/。

## Earth bathymetry 复刻（2026-09-09）

`earth-bathymetry/` 是 AlteredQualia「Earth bathymetry」WebGL demo 的 Three.js r170 复刻，在线地址 `https://watertian.github.io/sbot-test1/earth-bathymetry/`。实现要点、操作键与对照原站的取舍见 `earth-bathymetry/README.md`；页面右下角标注了生成它的模型版本（Claude Fable 5.1）。

## Earth bathymetry · Cesium 对照版（2026-09-10）

`cesium-earth/` 用 CesiumJS 1.145 做了同一份数据的另一种实现，在线地址
`https://watertian.github.io/sbot-test1/cesium-earth/`，用来和 `earth-bathymetry/`（Three.js）对照。

- 高程与影像复用 `earth-bathymetry/textures/` 里那批 4K 贴图，不重复占空间。
- 高程从灰度合成图反解：陆地和海洋是两段独立的灰阶斜坡，海岸线处有台阶；常数由已知地点标定，是近似值，状态行因此标 `≈`。
- 自定义地形源（CustomHeightmapTerrainProvider）按瓦片现算高程，双线性采样避免瓦片接缝。
- 全程不请求 Cesium ion：影像用 SingleTileImageryProvider 走本地贴图，依赖 ion 的控件全部关掉。页面里可实测 `APP.info.ionRequests` 为 0。
- Cesium 库走 CDN，未随仓库分发（1.145 解包约 79MB）。离线内网部署需要自行托管这套文件。
- 水色：把 Three.js 版同一套水下消光公式（R/G/B 分通道吸收，加上由浅青到深蓝的水体散射）按垂直水深烘进影像。面板上「水色」开关可以切回只有海底浮雕的底图。
- 波光：自定义地形源本身不带水体掩膜，这里接管取瓦片这一步，把按高程灰度算出的掩膜一起交给 Cesium，它自带的海面波浪法线和太阳高光才会生效。
- 地面大气关闭：它会给整个球面罩一层偏青的雾，实测把深海从 (69,137,143) 抬到 (119,182,196)，水色被冲淡。球外那圈天空光晕保留。
- 关掉地面大气后陆地偏暗，按线性光提亮 2.6 倍，白色处用肩部压回，雪和沙漠不会过曝。
- 与 Three.js 版仍有的差别：那边水体厚度按视线穿过水的实际路程算，越靠球的边缘越深；烘在贴图里的颜色不知道视角，只能按垂直水深算。


---

最后更新：2026-09-10
