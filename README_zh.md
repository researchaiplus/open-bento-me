# Bento Profile — 您的研究个人主页

一个美观、互动的研究者个人主页，您可以免费托管在 GitHub Pages 上。在浏览器中编辑您的个人主页，实时预览更改，一键发布。

---

## 核心功能

- 便当盒网格布局 — 使用精美的卡片网格展示您的项目、论文、链接等
- 可视化编辑器 — 在浏览器中通过拖拽和内联编辑完成所有更改
- 实时预览 — 在发布前准确查看您的个人主页外观
- 一键发布 — 将更改推送到 GitHub 并自动部署到 GitHub Pages
- 本地优先 — 所有数据存储在浏览器中；支持离线使用
- 完全免费 — 零成本托管在 GitHub Pages 上
- 您的数据，您做主 — 一切都保存在您的 GitHub 仓库中
- 移动端适配 — 在所有设备上都能出色显示

### 我们的独特优势

1. **无需代码即可创建个人主页** — 即使您没有开发功底，只要有 GitHub 账户，就能通过图形化的"点点点"操作创建自己的个人主页。您不需要把代码拉下来重新部署。

2. **Needboard 功能** — 我们独有的 Needboard 功能，让您可以展示寻求和提供的合作内容，与众不同。

3. **分享我的站点** — 您的个人主页建成后：
   - 您或您的朋友都可以将个人主页下载为 PNG 图片进行分享
   - 也可以直接复制链接进行分享

---

## 快速开始（5 分钟）

### 第一步：创建仓库

点击页面顶部的绿色 **"Use this template"** 按钮，然后选择 **"Create a new repository"**。

- **仓库名称**：我们推荐 `your-username.github.io` 以获得简洁的 URL，或者您喜欢的任何名称
- **可见性**：公开（免费 GitHub Pages 的必需条件）

### 第二步：启用部署权限

1. 进入您新建仓库的 **Settings** → **Actions** → **General**
2. 向下滚动到 **"Workflow permissions"**
3. 选择 **"Read and write permissions"**
4. 点击 **Save**

### 第三步：配置 GitHub Pages

1. 进入 **Settings** → **Pages**（左侧边栏）
2. 在 **Build and deployment** → **Source** 下，选择 **GitHub Actions**

### 第四步：触发首次部署

现在手动触发部署：

1. 进入 **Actions** 选项卡
2. 点击左侧的 **"Deploy to GitHub Pages"**
3. 点击 **"Run workflow"** → 选择 `main` → 点击绿色按钮
4. 等待 2-3 分钟完成构建

### 第五步：访问您的个人主页

您的空个人主页现在已在以下地址上线：

- 如果仓库名是 `username.github.io` → `https://username.github.io`
- 如果仓库名是 `my-profile` → `https://username.github.io/my-profile`

### 第六步：编辑并发布

1. 在您的个人主页 URL 后追加 `?mode=edit`：
   - `https://username.github.io/my-profile?mode=edit`
   - 这将在您已发布的站点上打开完整的编辑界面
   - 如果您之前发布过，现有数据会自动加载作为起点
2. 点击 **Edit** 进入编辑模式
3. 添加您的简介、头像、社交链接和研究兴趣
4. 添加卡片：链接、GitHub 仓库、HuggingFace 模型、图片等
5. 点击 **Preview** 查看效果
6. 点击 **Publish** 将您的数据推送到 GitHub

#### 首次发布设置

当您第一次点击 **Publish** 时，您需要：

1. **GitHub 个人访问令牌**
   - 前往 [github.com/settings/tokens](https://github.com/settings/tokens)
   - 点击 "Generate new token (classic)"
   - 选择 `repo` 权限范围
   - 复制生成的令牌

2. **仓库 URL**
   - 格式：`username/repo-name`（例如：`alice/alice.github.io`）

3. **分支**：保持 `main`（默认）

您的凭据会缓存在浏览器中 — 以后无需再次输入。

发布后，GitHub Actions 会在 2-3 分钟内自动重建并部署您的站点。

---

## 卡片类型

| 卡片 | 描述 |
|------|------|
| **链接** | 分享网站、文章或任何 URL（自动获取标题和图片） |
| **GitHub 仓库** | 展示您的 GitHub 仓库，包含星标、编程语言和描述 |
| **HuggingFace** | 展示您的模型或数据集，包含下载量和点赞数 |
| **图片** | 上传照片、设计或截图 |
| **文本** | 带格式的富文本内容 |
| **分区标题** | 使用分区标头组织您的卡片 |
| **需求看板 (NeedBoard)** | 展示您寻求和提供的合作内容 |

---

## 在已发布的站点上编辑

您可以直接在已发布的 GitHub Pages 站点上编辑您的个人主页 — 无需本地开发环境！

1. **打开编辑模式**：访问 `https://username.github.io/my-profile?mode=edit`
2. **进行更改**：会出现完整的编辑器工具栏，已发布的数据会作为起点加载
3. **预览**：点击 Preview 查看效果
4. **发布**：点击 Publish 更新您的在线站点

> **这是如何工作的？** 当您在 URL 中添加 `?mode=edit` 时，站点会从只读模式切换到编辑模式。您已发布的个人主页数据（来自 `profile-config.json`）会自动导入到浏览器的 localStorage 中，您可以自由编辑。当您发布时，更新后的数据会被推回 GitHub，您的站点会重新构建。

> **安全吗？** 是的！只有您（使用您的 GitHub PAT）才能发布更改。其他访问者添加 `?mode=edit` 只能看到编辑器 UI，但他们进行的任何更改都只保存在自己的浏览器中，没有您的令牌无法推送到您的仓库。

---

## 工作原理

```
在浏览器中编辑 → 数据保存到 localStorage
                              ↓ 点击发布
                    GitHub API 将 profile-config.json 提交到您的仓库
                              ↓
                    GitHub Actions 构建静态站点
                              ↓
                    访问者在 GitHub Pages 上看到您的个人主页
                    （只读模式，无工具栏，数据来自 profile-config.json）
```

### 关键文件

| 文件 | 用途 |
|------|------|
| `public/profile-config.json` | 首次部署的默认空占位符 |
| `profile-config.json`（仓库根目录） | 您的实际个人主页数据（由 Publish 创建） |
| `.github/workflows/deploy.yml` | 自动化构建和部署管道 |

---

## 本地开发（可选）

如果您想在本地运行项目：

```bash
# 克隆您的仓库
git clone https://github.com/username/repo-name.git
cd repo-name

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开 http://localhost:3000/profile
```

---

## 安全性

- 您的 GitHub 令牌**base64 编码**存储在浏览器 localStorage 中
- 令牌**直接**从您的浏览器发送到 GitHub API（无中间服务器）
- 只需 `repo` 权限范围
- 令牌可随时[撤销](https://github.com/settings/tokens)

**最佳实践：**
- 为此个人主页使用专用令牌
- 不要将令牌提交到 git
- 使用共享/公共计算机时清除浏览器数据

---

## 技术栈

- [Next.js 15](https://nextjs.org/) — 静态导出 React 框架
- [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) — 样式和组件
- [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) — 拖拽网格
- [GitHub Pages](https://pages.github.com/) — 免费静态托管
- [GitHub REST API](https://docs.github.com/en/rest) — 无需后端即可发布数据

---

## 贡献

欢迎贡献！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-widget`)
3. 提交您的更改 (`git commit -m 'Add amazing widget'`)
4. 推送到分支 (`git push origin feature/amazing-widget`)
5. 打开 Pull Request

---

## 许可证

MIT License — 详情请参阅 [LICENSE](./LICENSE)。

---

## 初始贡献者

- **Liz** — Lead and maintainer
- **Xinran** — Co-creator
- **Chijiang** — Early contributor

---

由 [Research AI+](https://github.com/ResearchNexus) 制作
