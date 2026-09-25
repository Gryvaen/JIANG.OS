# JIANG.OS 后续阶段实施路线图

本文档承接 v0.1（OS Core + Personal）的现有实现，定义 Phase 3–6 的具体建设内容、依赖关系与验收标准。实施顺序遵循：先提高日常可用性，再接入基础设施，最后处理私人数据和高成本视觉表现。

## 总体原则

- Desktop Shell 与 Mobile Shell 共享 App Registry、Command Bus、领域数据和权限模型。
- 新功能优先实现为 App 或 Command Contribution，不向桌面直接堆叠信息组件。
- 浏览器本地存储只保存设备偏好与临时状态；业务数据进入 PostgreSQL。
- 所有外部服务访问经过服务端适配层，前端不得持有 Token 或直接访问私有服务。
- Vault、服务器地址、监控详情和未发布内容必须经过服务端授权检查。
- 每个阶段完成后都应保持可独立部署，不依赖尚未实施的下一阶段。

## Phase 3 — Productivity / 浏览器首页能力

### 目标

让 JIANG.OS 从个人作品展示系统变成每天可以实际使用的浏览器起始页。

### 3.1 Search 与 Command Palette 统一

- 将当前本地 App 搜索升级为统一 Search Index。
- 建立 `SearchProvider` 接口，首批提供 App、Project、Note、Command、Quick Link 五种 Provider。
- 搜索结果统一包含 `id`、`type`、`title`、`subtitle`、`icon`、`score` 和执行动作。
- 支持键盘上下选择、Enter 执行、Escape 关闭以及最近使用项排序。
- 支持命令语法：
  - `open <app>`：打开应用。
  - `search <query>`：使用默认搜索引擎。
  - `yt <query>`：搜索 YouTube。
  - `gh <query>`：搜索 GitHub。
  - `translate <text>`：进入 Translator 并预填文本。
- 搜索索引在内容发布后失效并重建；公开查询不索引草稿和 Owner-only 内容。

### 3.2 Quick Web / Bookmarks App

- 新增 `web` App，按 Development、AI、Media、Daily 等分组展示链接。
- 新增 `quick_links` 与 `quick_link_groups` 数据表，支持名称、URL、图标、排序、启用状态和搜索别名。
- 后台增加链接分组管理、拖动排序、URL 校验和启用/禁用操作。
- 外部链接统一在新标签页打开，并增加 `noopener noreferrer`。
- Command Palette 可以直接检索和打开 Quick Link。

### 3.3 Tools App 与首批工具

- 新增 `tools` 容器 App，内部使用工具路由和最近使用列表，不为每个小工具创建独立窗口。
- 第一批本地工具：Calculator、JSON Formatter、Timestamp、Base64、UUID、Regex Tester、QR Code。
- Translator 使用服务端 Provider Adapter；未配置翻译服务时展示明确的不可用状态。
- 每个工具定义统一 `ToolDefinition`：ID、分类、输入 schema、是否需要网络、是否支持移动端和搜索关键词。
- 输入默认仅保存在当前会话；除非用户明确收藏，不将工具输入写入数据库。
- JSON、Base64、JWT 等工具不得将输入发送到服务器，全部在浏览器本地处理。

### 3.4 URL 与状态恢复

- 为 App 和公开内容增加可分享 URL，例如 `/?app=projects&item=riscv-cpu` 和 `/notes/<slug>`。
- 浏览器前进/后退能够恢复打开的 App 和内容详情。
- Desktop 窗口布局写入 `sessionStorage`，刷新后恢复；Mobile 恢复当前页面栈顶。
- 主题、Accent、Shell 偏好和 Quick Link 排序按登录状态分别保存到本地或数据库。

### Phase 3 验收

- `Ctrl/Cmd + K` 可以检索并执行 App、项目、笔记、命令和网站链接。
- Tools 的纯本地工具断网时仍可使用，输入不会出现在网络请求中。
- 公开内容具备稳定深链，刷新及浏览器前进/后退不会丢失主要上下文。
- Desktop 与 Mobile 对相同搜索结果执行相同 Command Bus 动作。
- 为 Search ranking、命令解析、工具转换和 URL 恢复增加单元及浏览器测试。

## Phase 4 — Infrastructure / 服务器与通知

### 目标

接入真实 Server Agent、服务健康信息和告警，使 JIANG.OS 成为轻量基础设施控制面。

### 4.1 Server Agent

- 单独建立轻量 Agent 项目，推荐使用 Go，发布为单文件 Linux 二进制和容器镜像。
- Agent 采集 CPU、内存、磁盘、负载、运行时间和配置允许的服务状态。
- Agent 只主动向 JIANG.OS API 上报，不开放公网管理端口。
- Agent 使用每节点独立 Token；数据库只存 Token 哈希，明文仅在创建时显示一次。
- 上报请求包含时间戳、随机 nonce 和签名，服务端限制时间窗口并拒绝重复 nonce。
- 支持 systemd 与 Docker Compose 两种部署方式，并提供最小权限运行说明。

### 4.2 服务端监控模型

- 新增 `servers`、`server_agents`、`server_metrics`、`service_checks` 和 `incidents` 数据表。
- 原始高频指标采用有限保留周期；长期数据按小时聚合，避免 PostgreSQL 无限增长。
- 服务端根据最后心跳计算 Online、Degraded、Offline，不信任 Agent 自报状态。
- 服务检查首版支持 HTTP(S)、TCP 和 Agent 本地进程/容器检查。
- 建立 `/api/agent/v1/heartbeat`、`/metrics`、`/services` 三类版本化接口。

### 4.3 Servers 与 System Monitor App

- Servers App 展示节点列表、连接状态、当前资源、运行时间和服务状态。
- 节点详情提供 CPU、内存、磁盘趋势图，以及最近事件时间线。
- System Monitor 汇总浏览器会话、窗口数量、网络状态、后端状态和服务器概况。
- Mobile 采用列表与详情页，不缩放桌面图表。
- 监控数据加载失败时展示最后更新时间和缓存快照，禁止伪装为实时数据。

### 4.4 Notifications

- 建立统一 `Notification` 模型：来源、严重级别、标题、正文、关联资源、已读状态和时间。
- 首批触发条件包括节点离线、CPU/内存/磁盘持续超阈值、服务异常和恢复通知。
- 阈值必须具有持续时间和恢复滞回，避免瞬时尖峰造成通知风暴。
- OS 顶栏增加通知中心；支持标记已读、全部已读和跳转到关联资源。
- 浏览器系统通知必须由用户主动开启；默认只显示站内通知。

### Phase 4 验收

- 新节点可以安全注册并连续上报，Token 撤销后立即无法继续写入。
- Agent 离线、时钟偏差、重复请求和无效签名均有明确处理与审计记录。
- Servers App 的状态来自真实数据，并能区分实时、缓存和未知状态。
- 告警在持续超阈值后创建，恢复时关闭，不会为同一事件重复刷屏。
- 使用模拟 Agent 完成协议、鉴权、数据保留和告警状态机测试。

## Phase 5 — Private / 身份、Vault 与私人空间

### 目标

建立严格隔离的 Owner 私人区，用于保存服务器记录和低敏感度私人资料；不自行保管 SSH 私钥、密码或长期 Token。

### 5.1 鉴权与会话强化

- 保留 GitHub OAuth Owner 白名单，增加 WebAuthn/Passkey 作为敏感操作的二次验证。
- Owner 身份必须依据 GitHub 数字用户 ID，禁止依据可修改的用户名或客户端字段授权。
- 管理后台、Vault 页面和所有写接口统一使用服务端 `requireOwner()`。
- 对敏感操作增加短时 re-auth 状态、审计日志、速率限制与 CSRF 校验。
- Session Cookie 使用 Secure、HttpOnly、SameSite，生产环境配置固定可信 Origin。

### 5.2 Vault 数据边界

- Vault 只保存服务器别名、脱敏地址、用户名、端口、Provider、标签、备注和密码管理器引用。
- SSH 私钥、密码、恢复码、API Token 等凭据不进入 JIANG.OS 数据库。
- 增加 `vault_records`、`vault_record_fields` 和 `audit_events` 数据表。
- 敏感字段采用应用层 envelope encryption：主密钥来自部署 Secret，数据库只保存密文、nonce 和密钥版本。
- 浏览器默认展示脱敏值；Reveal 与 Copy 操作需要短时二次验证并写入审计日志。
- 禁止通过日志、错误追踪、分析工具或缓存响应泄露 Vault 内容。

### 5.3 Vault App 与后台

- Vault App 未登录时只显示锁定界面，不预加载任何私人数据。
- 登录并二次验证后展示记录列表、详情、标签过滤和密码管理器跳转。
- 支持创建、修改、归档和恢复记录；删除使用软删除和后台保留周期。
- 提供 Copy SSH 命令，但命令中的 Host 必须遵循字段可见性设置。
- Mobile 端禁止在应用切后台后继续显示已 Reveal 内容；恢复时重新锁定。

### 5.4 备份与恢复

- PostgreSQL 每日加密备份，并定期执行恢复演练。
- Vault 主密钥与数据库备份分开保管；建立密钥轮换流程。
- 后台提供数据导出，但不导出 OAuth Secret、Agent Token 或其他部署密钥。
- 所有迁移保持向后兼容；破坏性字段删除至少跨两个版本完成。

### Phase 5 验收

- 匿名访客无法通过页面、API、缓存、搜索和 VFS 推断私人记录存在或数量。
- 篡改 Session、Owner ID 或请求体不能绕过服务器授权。
- Reveal、Copy、编辑、归档和导出均产生可追踪审计事件。
- 数据库泄露场景下，加密字段无法在没有部署密钥时解密。
- 完成权限矩阵、CSRF、速率限制、缓存隔离与移动端自动锁定测试。

## Phase 6 — Crazy Cover / 数字艺术入口

### 目标

把 Cover 独立发展为可替换的数字艺术作品，同时保证它不会影响 OS 的速度、可访问性和日常使用。

### 6.1 Cover Runtime

- 建立 `CoverDefinition` Registry，Cover 与 OS Core 仅通过 `enter()`、生命周期和设置接口连接。
- 首个正式 Cover 使用 WebGL Shader 或粒子/网格系统，形成抽象 J 核心和轻微鼠标视差。
- 视觉资源延迟加载；OS 核心代码和内容不得依赖 Cover 包加载成功。
- WebGL 初始化失败、低性能设备或 reduced-motion 环境自动使用当前 CSS 几何 Cover。
- 用户可选择每次显示、每天一次、永不显示以及手动重播。

### 6.2 性能与体验预算

- Cover 首次可交互时间不超过 1 秒，进入 OS 的过渡控制在 500–1000ms。
- 动画运行时不得阻塞主线程输入；持续监测平均帧率并在性能不足时降低粒子量。
- 页面后台、窗口失焦和进入 OS 后立即暂停并释放高成本渲染资源。
- 移动端使用简化材质和更低粒子预算，不强行复制桌面视觉。
- ENTER 始终是语义化按钮，键盘、触控和屏幕阅读器可直接操作。

### 6.3 Cover 轮换与设置

- Settings 增加 Cover 选择、显示频率、交互强度和性能模式。
- Cover 资源采用版本化 manifest，可独立新增而不修改 Desktop Shell。
- “每日变化”只在选中的 Cover 内改变安全参数或 seed，不远程执行动态代码。
- 后台可启用或停用 Cover，但不把 Shader 源码编辑器暴露到生产管理界面。

### Phase 6 验收

- 主 Cover、CSS fallback、reduced-motion 和无 WebGL 四种路径均可正常进入 OS。
- Cover 加载失败不会导致白屏，也不会阻断 App 数据加载。
- 在桌面和主流手机上验证帧率、内存释放、触控和键盘操作。
- 连续进入 500 次仍可通过设置跳过，不强迫日常用户观看重复动画。

## 跨阶段工程工作

### 当前 v0.1 加固

- 移除生产环境的演示数据静默回退，改为显式 Preview Mode 或服务不可用状态。
- 为 Admin CRUD 补齐完整编辑、排序、删除确认、错误恢复与 Markdown 预览。
- 将 Profile、Preferences 与 GitHub Snapshot 完整接入数据库和后台。
- 为 Window Manager 增加边界约束、真正的边缘 Snap、触控策略和 Session 恢复。
- 增加 CSP、Trusted Origin、请求体上限、结构化日志和健康检查接口。

### 质量与交付

- 单元测试覆盖 reducer、parser、ranking、VFS、权限与告警状态机。
- 集成测试使用独立测试数据库验证草稿隔离、Owner 权限、迁移和外部服务降级。
- Playwright 覆盖 Cover → Desktop、窗口生命周期、深链、Mobile Shell、Admin 和 Vault 锁定。
- CI 顺序固定为类型检查、测试、生产构建、迁移检查和容器构建。
- 每个版本记录数据库迁移、环境变量变化、回滚方法和部署后检查清单。

## 推荐里程碑

1. **v0.1.1 — Foundation Hardening**：完成现有实现加固、Admin 完整 CRUD、生产安全基线。
2. **v0.2.0 — Daily Driver**：交付统一 Search、Quick Web、Tools 和深链恢复。
3. **v0.3.0 — Infrastructure**：交付 Server Agent、Servers、System Monitor 和 Notifications。
4. **v0.4.0 — Private Workspace**：交付 Passkey 二次验证、Vault、审计与加密备份。
5. **v1.0.0 — Personal Web OS**：交付正式数字艺术 Cover、完整可访问性与性能验收。

每个里程碑只有在生产构建、迁移、测试、备份/回滚说明和对应阶段验收项全部通过后才能发布。
