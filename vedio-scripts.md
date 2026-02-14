   ---

   ## 中文脚本（口语化版）

   ### 开场白

   > 嗨，大家好！今天我来教大家如何在 5 分钟内搭建一个属于自己的研究者主页。
   >
   > 没错，5 分钟，只需要 5 分钟，你就能拥有一个像这样的个性化页面。
   >
   > 好，我们开始吧！

   ---

   ### 第一步：创建你的仓库

   > 首先，我们需要创建一个仓库来托管你的主页。
   >
   > 点击绿色的 "Use this template" 按钮，选择 "Create a new repository"。
   >
   > 这里给仓库起个名字，我建议用你的名字或者常用的 ID，这样 URL 会很好看。
   >
   > 比如我叫张三，仓库名就叫 zhang-san。
   >
   > 那么最终的主页地址就是：`https://你的用户名.github.io/zhang-san/profile`
   >
   > 记得把仓库设为公开，GitHub 免费版需要公开仓库才能开启 Pages。
   >
   > 好，仓库创建完成！

   ---

   ### 第二步：开启部署权限

   > 接下来我们要给 GitHub Actions 开通权限，让它能帮我们部署网站。
   >
   > 进入 Settings → Actions → General，左边这个。
   >
   > 找到 "Workflow permissions"，选择 "Read and write permissions"。
   >
   > 点 Save 保存。
   >
   > 就这么简单，权限开好了。

   ---

   ### 第三步：配置 GitHub Pages

   > 现在配置 GitHub Pages。
   >
   > Settings → Pages，左边这个。
   >
   > 在 Build and deployment 下面，Source 选择 GitHub Actions。
   >
   > 对，就是这样。现在它会使用我们预置的 Actions 来自动部署。

   ---

   ### 第四步：触发首次部署

   > 好戏来了！现在手动触发第一次部署。
   >
   > 切换到 Actions 标签页。
   >
   > 看到左边这个 "Deploy to GitHub Pages" 了吗？点它。
   >
   > 点击 "Run workflow"，保持 main 分支，点那个绿色按钮。
   >
   > 现在等个 2 到 3 分钟，让它跑完。
   >
   > 你可以先喝口水，我们等着。

   ---

   ### 第五步：访问你的主页

   > 部署完成后，你的个人主页就已经上线了！
   >
   > 地址是 `https://用户名.github.io/仓库名/profile`
   >
   > 现在打开看看——是的，一个空页面，但这代表一切正常！
   >
   > 接下来我们要往里面填内容。

   ---

   ### 第六步：编辑和发布

   > 怎么编辑呢？在网址后面加上 `?mode=edit`。
   >
   > 比如这样：`https://.../profile/?mode=edit`
   >
   > 回车——看，编辑界面出来了。
   >
   > 点击右上角的 Edit 按钮，进入编辑模式。
   >
   > 现在你可以添加：
   > - 个人简介和头像
   > - 社交链接
   > - 研究兴趣标签
   > - 各种卡片：链接、GitHub 仓库、HuggingFace 模型、图片……全部都能加
   >
   > 加完之后，点 Preview 预览效果。
   >
   > 没问题的话，点 Publish 发布！

   ---

   ### 首次发布需要设置

   > 第一次点击 Publish 时，需要配置一下。
   >
   > 三样东西：
   >
   > 第一，GitHub Personal Access Token。
   > 去 github.com/settings/tokens，点 "Generate new token (classic)"，勾选 repo 权限，生成后复制。
   >
   > 第二，仓库地址。格式是 `https://github.com/用户名/仓库名`，就是刚才创建的那个仓库。
   >
   > 第三，分支名，默认 main 就行。
   >
   > 填好之后点确认。这些信息会保存在浏览器里，之后不用再输了。
   >
   > 发布成功后，GitHub Actions 会自动重新部署，等个 2 到 3 分钟，更新就上线了！

   ---

   ### 常见问题

   > **它是怎么工作的？**
   >
   > 简单说：编辑模式下，数据存在你浏览器的 localStorage 里。发布时，我们把数据写回 GitHub 仓库的 JSON 文件，然后触发重新部署。
   >
   > **安全吗？**
   >
   > 非常安全！只有你自己用 Token 才能发布。其他访客即使加了 ?mode=edit，也只能看看编辑器，修改不会保存到你的仓库。

   ---

   ### 结尾

   > 好啦，就是这么简单！
   >
   > 5 分钟，一个属于你自己的研究者主页就搭建完成了。
   >
   > 赶紧去试试吧，有问题可以给我留言。
   >
   > 我们下期见！

   ---

   # English Script (Natural Version)

   ---

   ### Opening

   > Hey everyone! Today I'm gonna show you how to set up your own researcher profile page in just 5 minutes.
   >
   > Yeah, you heard it right—5 minutes, and you'll have something like this.
   >
   > Alright, let's jump in!

   ---

   ### Step 1: Create Your Repository

   > First things first, we need to create a repository to host your profile.
   >
   > Hit that green "Use this template" button, then select "Create a new repository".
   >
   > Now name it—I recommend using your name or your usual handle, so the URL looks clean.
   >
   > Like, if your name is John Smith, just call it john-smith.
   >
   > So your final profile URL will be: `https://your-username.github.io/john-smith/profile`
   >
   > Oh, and make sure to set it to public—GitHub's free tier requires public repos for Pages.
   >
   > Alright, repository created!

   ---

   ### Step 2: Enable Deployment Permissions

   > Next up, we need to give GitHub Actions the green light to deploy your site.
   >
   > Go to Settings → Actions → General, that's this one on the left.
   >
   > Find "Workflow permissions" and select "Read and write permissions".
   >
   > Click Save. Done! Permissions are all set.

   ---

   ### Step 3: Configure GitHub Pages

   > Now let's configure GitHub Pages.
   >
   > Settings → Pages, this one here.
   >
   > Under Build and deployment, for Source, pick GitHub Actions.
   >
   > Exactly like that. Now it'll use our pre-built Actions for automatic deployment.

   ---

   ### Step 4: Trigger the First Deployment

   > Here comes the fun part—let's kick off the first deployment.
   >
   > Switch to the Actions tab.
   >
   > See this "Deploy to GitHub Pages" on the left? Click it.
   >
   > Hit "Run workflow", keep main selected, and tap that green button.
   >
   > Now we wait—about 2 to 3 minutes for it to finish.
   >
   > Feel free to grab a coffee while we wait.

   ---

   ### Step 5: Visit Your Profile

   > And... we're live! Your profile page is now up and running.
   >
   > Head to `https://your-username.github.io/repository-name/profile`
   >
   > Go ahead, open it up—yep, it's empty, but that means everything's working!
   >
   > Time to add your content.

   ---

   ### Step 6: Edit and Publish

   > So how do you edit? Just add `?mode=edit` to your URL.
   >
   > Like this: `https://.../profile/?mode=edit`
   >
   > Hit Enter—see? The editor interface appears.
   >
   > Click the Edit button in the top right to enter editing mode.
   >
   > Now you can add:
   > - Your bio and avatar
   > - Social links
   > - Research interest tags
   > - All kinds of cards: links, GitHub repos, HuggingFace models, images... you name it
   >
   > When you're done, hit Preview to see how it looks.
   >
   > All good? Click Publish!

   ---

   ### First-Time Publish Setup

   > The first time you hit Publish, you'll need to set a few things up.
   >
   > Three things:
   >
   > First, GitHub Personal Access Token.
   >
   > Go to github.com/settings/tokens, click "Generate new token (classic)", check the repo scope, generate, and copy it.
   >
   > Second, your repository URL. The format is `https://github.com/username/repository-name`—that's the repo you just created.
   >
   > Third, branch name—just leave it as main.
   >
   > Hit confirm once you're done. These get saved in your browser, so you won't need to enter them again.
   >
   > After publishing, GitHub Actions will auto-redeploy, and within 2-3 minutes, your updates will be live!

   ---

   ### FAQ

   > **How does this work?**
   >
   > In edit mode, your data lives in your browser's localStorage. When you publish, we write it back to a JSON file in your GitHub repo, then trigger a redeploy.
   >
   > **Is it safe?**
   >
   > Absolutely! Only you can publish with your token. Even if others add ?mode=edit to your URL, they'll just see the editor—their changes stay in their own browser and won't touch your repo.

   ---

   ### Closing

   > And that's it!
   >
   > In just 5 minutes, you've got your very own researcher profile page up and running.
   >
   > Go ahead, give it a try! If you run into any issues, drop a comment below.
   >
   > Until next time!
