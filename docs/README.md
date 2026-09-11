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

- 高程图和水面法线复用 `earth-bathymetry/textures/` 里的贴图；影像是同一张 4K 漫反射图调亮后预先烘好的 `cesium-earth/textures/diffuse_toned_4k.webp`（1.1 MB，原 JPEG 2.1 MB）。
- 高程从灰度合成图反解：陆地和海洋是两段独立的灰阶斜坡，海岸线处有台阶；常数由已知地点标定，是近似值，状态行因此标 `≈`。
- 自定义地形源（CustomHeightmapTerrainProvider）按瓦片现算高程，双线性采样避免瓦片接缝。
- 全程不请求 Cesium ion：影像用 SingleTileImageryProvider 走本地贴图，依赖 ion 的控件全部关掉。页面里可实测 `APP.info.ionRequests` 为 0。
- Cesium 库走 CDN，未随仓库分发（1.145 解包约 79MB）：先取国内镜像 npmmirror，失败再退回 unpkg，Workers 与 Assets 跟着同一个源走。离线内网部署需要自行托管这套文件。
- 加载性能（2026-09-10 优化）：Cesium.js 5.9 MB 实测 npmmirror 约 0.5 s、unpkg 3–5 s（地形 Worker 还要再拉约 25 个分片，走 unpkg 时首屏瓦片要十几秒）；库改为动态加载，与贴图并行下载，不再在 `<head>` 里同步阻塞；陆地提亮改为离线烘焙，省掉每次打开时 4K 图的读回、调色和 JPEG 重压（约 1.1 s 主线程）；高程只保留灰度单通道（64 MB → 16 MB）。本地实测首屏瓦片到齐从约 16 s 降到约 1.5 s，画面与改前逐点对比平均差 0.3/255。
- 高程图没有改成 WebP：试过 q85–95，会让 0.3%–0.9% 的像素跨过海岸线灰阶，岸线会变。
- 水体：Three.js 版那套水面着色器移植成 Cesium 后处理（PostProcessStage）。每个像素算视线与海平面椭球的交点，再和深度缓冲里海底的距离相减，得到视线在水里走的路程；分通道吸收、浅→深水色、折射、两层滚动法线、日光高光、菲涅尔与 Three.js 版逐项对应。越靠球的边缘，视线斜穿的水越厚，颜色随之变深。Cesium 自带的海面效果关闭，免得叠两层。
- 必须打开 `globe.depthTestAgainstTerrain`：默认情况下 Cesium 画完地球就丢掉地形深度，只留一块地平线深度板，后处理拿到的深度全是那块板（实测整个球面都解出 24,836 km，正好是地平线圆所在平面的距离）。
- 深度直接解对数深度缓冲的原始值（2^(z·log2(far−near+1)) − 1 + near），不走 czm_readDepth → czm_windowToEyeCoordinates 那条路（实测在这里会差几千公里）；与椭球求交以“地球半径”为单位算，避免 float 精度丢失。解出的距离与 CPU 求交（globe.pick）相差约 1 km（两千万米量级）。
- 折射偏移过去的像素，用它自己那条视线的海面距离算水深；拿原像素的海面距离去减，越靠边缘水会平白变厚。
- 深度映射：垂直方向按真实水深的 0.6 次幂压缩（200 米浅滩和 4000 米深海的光学厚度分别对齐 Three.js 版的 6 和 36），斜向路程照实线性累加。
- 地面大气关闭：它会给整个球面罩一层偏青的雾，实测把深海从 (69,137,143) 抬到 (119,182,196)，水色被冲淡。球外那圈天空光晕保留。
- 关掉地面大气后陆地偏暗，按线性光提亮 2.6 倍，白色处用肩部压回，雪和沙漠不会过曝；这一步已离线烘进上面那张 WebP。
- 水色五档（清澈 / 通透 / 浑浊 / 琥珀 / 灰色，W 键轮换）：参数逐项照搬 Three.js 版的五档水色。画质三档（U 键轮换）：标准按 CSS 像素渲染；高清按屏幕真实像素渲染；超清再翻一倍，渲染缓冲封顶约 1600 万像素。瓦片细分阈值随档位依次为 3 / 2 / 1.5，对应 Three.js 版的 ultra / photo。


---

最后更新：2026-09-10
