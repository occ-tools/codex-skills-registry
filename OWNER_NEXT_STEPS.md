# 后续执行清单

这份清单只记录仓库内部无法单方面完成、但仍然值得继续推进的事项。

## 1. 做一次真实外部 fork PR 验证

目标：确认 fork 场景下 `pull_request` 验证、`pull_request_target` 评论、权限边界和 PR comment 更新都符合预期。

执行：

1. 用另一个 GitHub 账号或组织 fork `wangjiehu/codex-skills-registry-demo`。
2. 在 fork 里改动 Skill、MCP 或 workflow 文件。
3. 向 demo 仓库打开 PR。
4. 确认普通验证 workflow 使用受限 token，fork-comment workflow 只发布或更新一条 registry summary。
5. 确认 workflow 没有执行 fork 内容里的项目脚本、依赖安装或 shell 插值。

验收：PR 检查结果、PR comment 链接和 workflow run 链接都可公开引用。

## 2. 完成 npm 账号级安全确认

目标：确保发布链路不依赖长期 token。

执行：

1. 在 npm 账号中确认 `@wangjiehu/codex-skills-registry` 使用 Trusted Publishing。
2. 确认账号启用 2FA。
3. 检查是否还有长期 npm token；如果没有明确用途，删除。
4. 保留 GitHub release workflow 的 OIDC 发布路径。

验收：下一次 tag release 能继续通过 npm Trusted Publishing 发布。

## 3. 补公开展示素材

目标：让用户不用跑代码也能理解结果形态。

只值得补这些素材：

- 风险 PR 的 GitHub annotation 截图。
- Code Scanning/SARIF 页面截图。
- PR comment 示例截图。
- Pages Rules 搜索页截图。

不建议把截图放进 npm 包。更适合放在 GitHub Release、README 外链、launch article 或 issue/discussion 中。

## 4. 找 3 个真实仓库试用

目标：用真实误报和采用阻力决定下一步，而不是继续内部猜测。

优先选择：

- 已经有 `.github/workflows` 的开源仓库。
- 使用 MCP 或 Codex Skills 的仓库。
- 有安全审查意识但不想引入重型平台的维护者工具仓库。

记录：

- 初次接入耗时。
- 发现数量和误报数量。
- 是否需要 baseline。
- PR comment 是否太吵。
- 哪条 remediation 最不清楚。

## 5. 决定是否进入 1.0.0

只有满足这些条件再推进 1.0.0：

- 至少一个真实外部 fork PR 验证完成。
- 至少 3 个真实仓库跑过 doctor 或 audit。
- SDK 推荐导出没有收到破坏性修改需求。
- PR comment、SARIF、Pages 三条公开展示路径都能稳定演示。

不建议现在为了版本号直接做 1.0.0。当前更有价值的是拿真实使用反馈。
