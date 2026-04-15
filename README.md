# StoryMakeup English

面向不会系统接受英语教育的儿童，提供**点击单词拼句子**的英文小故事小游戏 + **单词卡片**练习。界面与交互继承自原版 storymakeup，词汇简单易懂（每个难度各 1000 个故事自动生成）。

## 快速开始
```sh
npm install
npm run dev
# 浏览器访问 http://localhost:5173
```
如需 Electron 预览：`npm run electron:dev`

## 入口与玩法
- 首页有两个入口：拼故事（/play）与单词卡片（/words）。
- 拼故事：选择难度（简单 / 中等 / 困难），点击单词卡片按正确顺序拼成一句英文，完成三句小故事；支持切换故事、重置、撤回、朗读句子（英文发音）。
- 单词卡片：像 Quizlet 一样翻转卡片查看中文和例句，可朗读单词/例句，支持上一张、下一张、打乱顺序；卡片按难度分组，每组 500 张（简单/中等/困难各 500 个词）。

## 故事与定制
- 系统类自动生成 3000 个英文故事（每个难度 1000 个），词汇均为基础单词（如 sun, ball, school, milk）。
- 通过“修改类别/故事”可新增自定义故事：
  - 词语用空格分开，如 `I like red apples`。
  - 保存后即可在当前自定义类别下游玩。

## 教师端（可选）
- 路由 `/teacher` 提供简单的句子拆词辅助，可在浏览器访问。

## 云端朗读测试（腾讯云 ASR）
- `朗读测试` 已改为前端录音 + EdgeOne Pages Node Functions + 腾讯云一句话识别，不再依赖浏览器原生 `SpeechRecognition`。
- 在 EdgeOne Pages 项目环境变量中配置以下值：
  - `STORYMAKEUP_ASR_SECRET_ID`
  - `STORYMAKEUP_ASR_SECRET_KEY`
  - `STORYMAKEUP_ASR_REGION=ap-shanghai`
  - `STORYMAKEUP_ASR_ENG_SERVICE_TYPE=16k_en`
- 服务端函数入口为 `cloud-functions/api/asr.js`，部署到 EdgeOne Pages 后会映射为 `/api/asr`。
- 录音由前端转成 16k 单声道 WAV，再由服务端上传到腾讯云一句话识别接口，适合当前单词朗读测试的短音频场景。
- 代码目前优先读取 `STORYMAKEUP_ASR_*`，同时兼容旧的 `TENCENTCLOUD_*` 变量名，方便平滑迁移。
- 项目根目录的 `edgeone.json` 已显式声明函数依赖 `tencentcloud-sdk-nodejs-asr`，避免部署后函数运行时缺包。
- 本地 `npm run dev` 只启动前端 Vite 页面，不会自动提供 `/api/asr`；要验证完整朗读测试，请使用 `edgeone pages dev` 或部署到 EdgeOne Pages。

欢迎根据孩子水平继续增删改故事内容，保持单词简洁、句型短小。
