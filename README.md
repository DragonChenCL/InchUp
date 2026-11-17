# 寸进 InchUp

一个面向 LINUX DO 佬友的自律小天地：自己立约、自己如实申报，鼠妹寸寸陪着每天前进一点。

## Docker 一键部署

服务器先安装 Docker Engine、Docker Compose 插件和 Git，然后执行：

```bash
git clone https://github.com/DragonChenCL/InchUp.git
cd InchUp
bash deploy.sh
```

脚本会更新当前分支、自动创建 `.env.production`、构建镜像并等待容器健康检查通过。默认将应用映射到服务器的 **`127.0.0.1:5173`**；容器内部同样监听 **5173**。默认站点地址为 **`https://inchup.serunio.com`**。

首次运行后，编辑 `.env.production`，填写 `LINUXDO_CLIENT_ID`、`LINUXDO_CLIENT_SECRET`，再运行一次 `bash deploy.sh`。缺少社区凭证时服务可以启动，但社区登录尚不可用。默认关闭共用体验账号，避免将本地演示空间用作正式社区。

在 LINUX DO Connect 中，将回调地址配置为：

```text
https://inchup.serunio.com/auth/linuxdo/callback
```

为 `inchup.serunio.com` 配置服务器地址和 HTTPS，再在同一服务器的 Nginx、OpenResty、宝塔或 1Panel 中反向代理到：

```text
http://127.0.0.1:5173
```

已有 HTTPS 站点的 Nginx 代理片段如下：

```nginx
location / {
    proxy_pass http://127.0.0.1:5173;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

如果反向代理运行在另一台服务器或独立容器网络中，在 `.env.production` 中调整 `BIND_ADDRESS` 为可访问的宿主机地址。修改宿主机端口可调整 `DEPLOY_PORT`，容器内部端口仍为 5173。`APP_URL` 和回调地址应始终与实际 HTTPS 域名保持一致。

后续更新与查看日志：

```bash
bash deploy.sh
docker compose --env-file .env.production logs -f --tail=100
```

SQLite 数据保存在名为 `inchup_data` 的 Docker 卷，更新代码、重建镜像和重建容器会继续使用原数据。部署脚本不删除卷，也不覆盖现有 `.env.production`；仓库有未提交修改时会停止更新。镜像以非 root 用户运行。上线前请为 `inchup_data` 做好备份。

也支持单独下载脚本后执行，默认克隆到当前目录下的 `InchUp`，可通过 `INCHUP_DIR` 指定一个尚不存在的目录：

```bash
curl -fsSLo deploy.sh https://raw.githubusercontent.com/DragonChenCL/InchUp/main/deploy.sh
bash deploy.sh
```

## 运行

需要 **Node.js 22.12 或更高版本**。使用 Node 内置 SQLite，目前启动时会显示实验性功能提示。

```powershell
npm install
npm run dev
```

打开 <http://localhost:5173>。首次运行会创建 `data/inchup.sqlite`，并初始化明确标记的本地体验数据。数据保存在服务端 SQLite 中，刷新页面不会丢失。

源码编译与生产构建：

```powershell
npm run check
npm run build
npm start
```

`check` 仅执行前后端 TypeScript 编译检查，`build` 在此基础上构建前端并编译服务端；没有自动化测试步骤。生产启动需要保留 `server/schema.sql` 和 `dist/`，工作目录为项目根目录。

## 已实现的体验

- 今日工作台：每周日期切换、待办筛选、补做过往待办、完成状态、行动统计。
- 我的契约：目标、验收标准、固定截止日期、公开或私人目标、自愿赠品、结果申报、成果记录和分享文案复制。
- 专注陪伴：按任务时长倒计时，支持暂停和恢复，结束后由本人决定是否勾选完成；后台恢复时按实际时间校正。
- 鼠妹寸寸：透明背景的立体风格动画素材，待机眨眼、行走、朝向切换和庆祝，支持拖动、点击对话、收起与安静模式。尊重系统减少动态效果设置。
- AI 计划：自带兼容 OpenAI 格式的接口、模型和密钥；根据验收标准与每日时间生成最近七天计划，预览并采纳后保存。已完成记录保留，今天起尚未完成的任务由新计划替换。
- 佬友广场：展示当前身份空间内的公开契约与真实任务进度。日常打卡留在本站，分享文案由本人选择如何发布。
- 资源抽奖：失败契约按原约定生成活动、每个账号免费报名一次、排除赠送者本人、截止后服务端随机抽取、固定结果、双方确认交付。
- 成长记录：按完成时间记录行动、累计任务与预计投入时长、连续行动天数、84 天热力图、JSON 导出。
- 账号接入：LINUX DO OAuth 授权码流程、登录状态校验、服务端会话与退出。真实社区数据和体验数据分开查询。

## 接入 LINUX DO

1. 在 <https://connect.linux.do> 申请应用。
2. 将 `.env.example` 复制为 `.env`。
3. 填写 `LINUXDO_CLIENT_ID`、`LINUXDO_CLIENT_SECRET` 和 `LINUXDO_REDIRECT_URI`。
4. 应用回调地址与 `LINUXDO_REDIRECT_URI` 完全一致，默认是 `http://localhost:5173/auth/linuxdo/callback`。
5. 重启服务，再点击页面右上角的 LINUX DO 登录。

服务端使用以下端点：

| 用途 | 端点 |
| --- | --- |
| 授权 | `https://connect.linux.do/oauth2/authorize` |
| 令牌交换 | `https://connect.linux.do/oauth2/token` |
| 用户资料 | `https://connect.linux.do/api/user` |

用户主键为 `linuxdo-社区不可变ID`。社区信任等级仅作为身份展示，本站行为不会修改论坛信任等级。应用密钥与授权令牌不会送到前端；会话使用随机令牌，数据库只保存摘要，七天失效。OAuth 使用随机状态值校验。部署到 HTTPS 时，`APP_URL` 应填写正确的 HTTPS 地址，使会话 Cookie 带上 Secure 属性。

缺少应用凭证时，页面会明确说明待配置，保留体验入口。真实 OAuth 往返需要有效应用凭证才能验证。

## 接入自己的模型

在「模型与设置」填写基础地址、模型名称、API Key、思考强度和每日可用分钟数。基础地址填写到 `/v1` 等前缀，服务端追加 `/chat/completions`。支持任意自定义 HTTP/HTTPS 模型地址，无需配置白名单。

点击「测试连接」会按当前表单发起真实请求，显示模型回复、实际模型名称、耗时和上游提供的 token 用量。测试成功后保存设置，再使用目标页或工作台的「AI 拆解」生成计划。

思考强度提供模型默认、none、minimal、low、medium、high、xhigh。模型默认不发送 `reasoning_effort`，其他选项按原值发送；上游不支持时显示错误，由用户选择合适强度。请求最长等待 180 秒，不自动降级或重试。

接口地址、模型名、思考强度和每日时间保存在浏览器本地。**API Key 仅保留在当前页面内存中**，刷新需重新填写，不写入浏览器持久存储或数据库。测试与计划请求均由本站服务端转发；生成计划时会把目标和验收标准发送给所选模型服务。

计划校验未来七天、每天最多三项、每日总时间和目标截止日期；先预览、再采纳写入待办。异常响应会明确提示，真实调用结果需以有效密钥的实测为准。

三个真实生成并采纳的例子及验证结果见 [AI 实测记录](docs/AI实测记录.md)。

## 契约与抽奖规则

时间统一使用北京时间。截止日期按当天 23:59:59 计算，之后保留 24 小时补报窗口，只补报原截止前完成的情况。窗口结束仍未申报，按未完成结算；漏做某一天的任务不会直接触发最终惩罚。

失败且设置了赠品时生成一次 48 小时报名活动。参与免费，每账号一份资格，赠送者不能参与自己的活动。服务端在每分钟处理一次到期数据，每次读取业务接口时也处理到期记录；进程停止期间不执行，恢复后补处理。截止时间以北京时间的绝对时间为准。

报名截止后，服务端从固定参与者名单中使用 `crypto.randomInt` 等概率抽取一人，写入中奖者和抽取时间。无参与者则结束并记录空中奖结果，结果没有重抽接口。赠送者标记已交付后，中奖者才能确认收到。

平台记录承诺和交付情况，资源由双方自主联系交付。当前没有资金托管、支付、论坛自动发帖或强制转移资源功能；现金及 LINUX DO Credit 的玩法需要另行设计，不能视为同一种资产。

## 数据库说明

完整建表、索引和约束 SQL 在 [server/schema.sql](server/schema.sql)，启动时幂等执行。使用 SQLite WAL 日志，启用外键，关键结算和写入使用事务。

| 表 | 数据 | 主要约束和索引 |
| --- | --- | --- |
| `users` | 社区或体验身份、头像、信任等级 | `id` 主键；身份来源枚举；等级限制为 0～4 |
| `sessions` | 会话摘要、用户、失效时间 | 摘要主键；用户外键，随用户删除；失效时间索引 |
| `goals` | 目标、验收标准、日期、公开性、赠品、申报结果 | 用户外键；状态和资源类型约束；公开性为 0 或 1；按用户和创建时间、状态和截止日、公开性索引 |
| `tasks` | 日期、具体动作、预计时长、完成时间 | 契约外键，随契约删除；时长为 1～480 分钟；按契约日期和完成时间索引 |
| `giveaways` | 活动、报名截止、中奖者、交付状态 | 契约唯一；赠送者及中奖者外键；交付状态约束；按抽取状态和截止时间索引 |
| `giveaway_entries` | 报名人与时间 | 活动和用户组合主键，防止重复报名；双方外键，随活动删除 |

接口通过当前会话检查契约和任务归属；报名和活动查询按体验或真实身份空间区分。用户输入使用参数化 SQL。删除任务、修改固定验收规则和重抽结果的接口未开放。

## 项目结构

```text
public/images/            鼠妹透明动画图集
deploy.sh                Docker 一键部署与更新
Dockerfile               多阶段构建与非 root 运行镜像
compose.yaml             端口、持久化卷与服务配置
server/index.ts          本地服务、OAuth、业务接口、模型转发与定时结算
server/schema.sql        数据表、约束和索引
shared/types.ts          前后端共享的数据结构
src/App.tsx              页面状态、导航与业务操作
src/components/          工作台、业务页面、弹窗、鼠妹
src/styles.css           手账风格界面及响应式布局
docs/鼠妹素材.md          素材来源、生成说明与动作映射
data/                    首次运行自动生成的数据库，已忽略提交
```

## 当前边界

默认监听 `127.0.0.1`，并开放共用的本地体验账号。面向真实用户部署时，配置有效的社区应用、HTTPS 与 `APP_URL`，将 `ENABLE_DEMO=false`，为 SQLite 数据文件安排持久化与备份。体验账号和示例资源供本机演示，不是真实赠品。

鼠妹是立体渲染风格的 **2.5D 动画**，由预制动作图集播放，不能任意改变相机视角。计划中的资源授权、邮寄和联系由双方在线下完成。
