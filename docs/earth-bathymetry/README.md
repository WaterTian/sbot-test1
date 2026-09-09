# Earth bathymetry — Three.js 复刻

复刻对象:AlteredQualia 的 WebGL demo「Earth bathymetry」
(https://alteredqualia.com/xg/examples/earth_bathymetry.html)。
原站基于作者私有的 XG 引擎;这里用 Three.js r170 从零重写,观感对照原站截图逐项调到接近。

## 文件

- `index.html` — 全部逻辑(HUD + 场景 + 水面 shader),ES module,importmap 指向本地 three
- `js/three.module.min.js` — Three.js r170(MIT),本地自带,不依赖 CDN
- `textures/` — 原站同源的贴图(NASA Blue Marble 数据派生):
  - `bathymetry_diffuse_{2k,4k}.jpg` 颜色贴图(陆地卫星色 + 灰阶海底)
  - `bathymetry_bw_composite_{2k,4k}.jpg` 高程图(陆地地形 + 海底地形合成,海平面 ≈ 0.55 灰)
  - `bathymetry_gloss_{2k,4k}.jpg` 高光图
  - `water-normal.jpg` 水面法线
  - 4k 给桌面,2k 给移动端

需要 HTTP 服务打开(ES module 不能 file:// 直开)。

## 操作(与原站一致)

- 鼠标移动 / 触摸:视角绕地球轻微环绕
- `Z` 切视场角(17.5 / 10 / 17.5 / 30)· `W` 切 5 种水色 · `R` 停/起自转
- `U` Ultra(1024×512 球 + 满分辨率)· `P` Photo(2048×1024 球 + 2× 超采样,隐藏 HUD)· `H` 隐藏 HUD
- `1`–`5` 直接选球面细分档

## 实现要点

1. **地形 pass** 渲到离屏 RT(HalfFloat + 4× MSAA + 深度贴图):半径 50 的球,
   `displacementMap` 抬 10 个单位(海平面 55.5),Phong + bump + 阴影(2048 shadow map)。
2. **合成 pass** 到屏幕:先全屏 blit 地形,再画半径 55.5 的水球(自定义 ShaderMaterial):
   - 读深度贴图算「视线穿过水体的路程」→ 逐通道消光 `exp(-d/ext)` + 浅→深水色内散射
   - 屏幕空间折射(法线扰动采样偏移,若采到水面之上的地形则回退)
   - 陆地高于水面处按深度差平滑过渡,不用 discard,岸线不锯齿
   - 视线穿出球壳(背景是太空)时按弦长算厚度并封顶,避免边缘发紫
   - 太阳高光 + 弱 Fresnel 边缘
3. 色调映射 Reinhard × 2.5,和原站「photographic + brightness 2」的亮度接近。

## 对照原站的取舍

- 原站是延迟渲染 + SSAO + 平面反射的私有管线,这里没有 SSAO,水面反射原站本身也关了
- 水色 5 档保留了原站的「清澈 / 更清 / 浑浊 / 琥珀 / 灰」五种气质,数值是按截图重新调的,不是原站参数
- 深海 / 大洋中脊 / 巴哈马浅滩三处取色与原站截图误差在 ±10 以内(sRGB 0–255)
