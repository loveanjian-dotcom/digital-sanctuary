# 栖 · Digital Sanctuary

一个可以安静待着的数字空间。五个沉浸场景(雨夜 / 雪夜 / 炉火 / 月海 / 星河),全部环境音由代码实时合成,零音频文件。

---

# 从零到上线:完整教程

按顺序做,每一步都做完再进行下一步。全程大约 40~60 分钟(不含下载等待)。

## 第一步:安装 Node.js(一次性)

Node.js 是运行前端工具的环境,相当于你装 Python 才能跑 Jupyter。

1. 打开 https://nodejs.org
2. 下载 **LTS 版本**(长期支持版,别下 Current)
3. 安装时一路"下一步",全部默认选项
4. 装完后验证:打开终端(Windows 按 `Win+R` 输入 `cmd` 回车;Mac 打开"终端"),输入:

```
node -v
```

显示出版本号(比如 `v22.x.x`)就成功了。

## 第二步:安装 VS Code(一次性,推荐)

代码编辑器,以后你让 AI 改代码、自己看代码都在这里。

1. 打开 https://code.visualstudio.com 下载安装
2. 装完后:左侧扩展图标 → 搜索 `Chinese` → 安装中文语言包(可选)

## 第三步:本地跑起来

1. 把本项目文件夹(`digital-sanctuary`)放到一个你记得住的位置,比如 `D:\projects\`
2. 用 VS Code 打开这个文件夹(文件 → 打开文件夹)
3. 打开 VS Code 内置终端(菜单:终端 → 新建终端)
4. 输入以下命令(第一条只需要执行一次,它会下载项目依赖):

```
npm install
npm run dev
```

5. 终端会显示一个地址,通常是 `http://localhost:5173`,按住 Ctrl 点击它(或复制到浏览器)
6. 看到网站了!以后每次开发,只需要 `npm run dev` 这一条命令

> 改代码会实时生效:试试改 `src/style.css` 里的颜色,保存,浏览器立刻更新。这叫热更新,是 Vite 提供的。

## 第四步:注册 GitHub 并上传代码

GitHub 是全世界程序员存代码的地方,也是部署的起点。

1. 打开 https://github.com 注册账号(记住用户名,它会出现在你的网址里)
2. 下载 **GitHub Desktop**:https://desktop.github.com (图形界面,不用敲 git 命令)
3. 安装后登录你的 GitHub 账号
4. 菜单:File → Add local repository → 选择 `digital-sanctuary` 文件夹
   - 如果提示 "not a git repository",点提示里的 **create a repository** 链接,一路默认,点 Create Repository
5. 左下角填写描述(比如 `first commit`),点 **Commit to main**
6. 点顶部的 **Publish repository**
   - 取消勾选 "Keep this code private" 可以让代码公开(公开私有都不影响部署,看你意愿)
   - 点 Publish

完成。你的代码现在在 `github.com/你的用户名/digital-sanctuary`。

> 以后的日常流程:改完代码 → GitHub Desktop 里写一句描述 → Commit → 点 Push。每次 Commit 都是一个存档点,改坏了可以回退。

## 第五步:部署到 Vercel(免费,自动)

Vercel 会监听你的 GitHub 仓库,每次推送代码自动重新构建并发布。

1. 打开 https://vercel.com → **Sign Up** → 选 **Continue with GitHub**(直接用 GitHub 账号登录,免注册)
2. 登录后点 **Add New... → Project**
3. 在列表里找到 `digital-sanctuary`,点 **Import**
   - 如果列表为空,点 "Adjust GitHub App Permissions" 授权 Vercel 访问你的仓库
4. 配置页面什么都不用改(Vercel 会自动识别出这是 Vite 项目),直接点 **Deploy**
5. 等 1~2 分钟,出现烟花动画 🎉

你现在拥有一个真实网址,形如:

```
https://digital-sanctuary-xxxx.vercel.app
```

发给任何人,全世界都能打开。

> 从此以后:你本地改代码 → GitHub Desktop 提交推送 → Vercel 自动更新网站,全程不需要再登录 Vercel。

## 第六步(可选):绑定自己的域名

`.vercel.app` 域名在国内部分网络环境下可能不稳定。如果想要 `xxx.com` 这样的正式域名:

1. 在域名注册商购买域名(国外如 Namecheap/Cloudflare 约 $10/年,免备案;国内如阿里云约几十元/年,但绑定国内服务器需要 ICP 备案)
2. Vercel 项目页 → Settings → Domains → 输入你的域名,按提示到域名商后台添加 DNS 记录
3. 等待生效(几分钟到几小时)

**关于国内访问:** Vercel 在国内访问时快时慢。起步阶段完全够用;等有了真实用户,再考虑迁移到国内平台(需要备案)或使用 Cloudflare 加速,到时候再说。

---

# 项目结构

```
digital-sanctuary/
├── index.html            页面骨架(按钮、面板的 HTML)
├── package.json          项目清单:依赖了什么、有哪些命令
├── vite.config.js        构建工具配置
└── src/
    ├── main.js           主入口:画布、主循环、场景切换、UI 绑定
    ├── style.css         全部样式
    ├── core/
    │   ├── state.js      共享状态(画布、鼠标、场景联动信号)
    │   ├── utils.js      随机数、平滑噪声
    │   └── sprites.js    预渲染的发光贴图(火焰、月光通用)
    ├── audio/
    │   └── engine.js     声音引擎:雨/风/雷/火/浪/蟋蟀/铃 全部程序化合成
    └── scenes/
        ├── elements.js   共享元素:星、云、月、山、萤火虫
        ├── rain.js       雨 · 夜
        ├── snow.js       雪 · 夜
        ├── fire.js       炉 · 火
        ├── ocean.js      月 · 海
        └── stars.js      星 · 河
```

**想改什么去哪个文件:**

| 想改的东西 | 文件 |
|---|---|
| 某个场景的画面 | `src/scenes/对应场景.js` |
| 某个场景的声音配方 / 默认音量 | `src/audio/engine.js` 底部的 `trackDefs` |
| 按钮、面板的外观 | `src/style.css` |
| 加一个新场景 | 复制一个场景文件,然后在 `main.js` 顶部 import 并加进 `scenes`,在 `index.html` 加一个按钮 |

# 常用命令

| 命令 | 作用 |
|---|---|
| `npm install` | 安装依赖(拿到项目后第一次执行,或 package.json 变化后) |
| `npm run dev` | 启动本地开发服务器,日常开发用这个 |
| `npm run build` | 打包出正式版到 `dist/` 目录(部署平台会自动执行,本地一般不用) |

# 路线图

- [x] 五个 2D 场景 + 程序化环境音
- [x] 工程化(Vite 模块化)+ 部署上线
- [ ] Three.js 3D 星河(GPU 粒子 + Bloom)
- [ ] Three.js 月海(真实水面着色器)
- [ ] 时间系统(随本地时间变化天色)
- [ ] 移动端 PWA / 更多场景 / 专注计时器
