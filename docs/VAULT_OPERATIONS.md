# Vault 备份与密钥轮换运维手册

本手册覆盖 Phase 5（v0.4.0）引入的 Vault 加密数据的备份、恢复与主密钥轮换流程。这些流程当前均为手动操作，未构建自动化系统。

## 1. 密钥与备份分离原则

- `VAULT_MASTER_KEY`（Vault 主密钥）与 PostgreSQL 备份文件必须分开保管，存放在不同的密钥管理位置（例如密码管理器 vs. 云存储加密网盘）。
- 任何单一位置泄露都不应同时暴露密文数据库备份和解密密钥。
- `STEPUP_SESSION_SECRET` 与 `AUTH_SECRET` 无需纳入备份流程（丢失只影响会话，不影响静态数据），但应与其他部署 Secret 一样通过密码管理器保存，不进入版本控制。

## 2. 每日加密备份

使用 `pg_dump` 导出后通过 GPG 对称加密，密码与 `VAULT_MASTER_KEY` 完全独立：

```bash
pg_dump "$DATABASE_URL" -F c | gpg --symmetric --cipher-algo AES256 -o "jiang-os-$(date +%F).dump.gpg"
```

- 通过 cron 或 docker-compose 中的定时任务每日执行。
- 备份文件上传至独立于应用部署环境的存储（如对象存储 + 生命周期策略）。
- GPG 口令保存在密码管理器中，且与保存 `VAULT_MASTER_KEY` 的条目不同。

## 3. 恢复演练（手动，未自动化）

```bash
gpg -d "jiang-os-2026-09-25.dump.gpg" | pg_restore -d "$DATABASE_URL" --clean --if-exists
```

- 建议每季度在隔离的临时数据库上执行一次恢复演练，确认备份文件可用、`VAULT_MASTER_KEY` 与恢复出的密文匹配（可通过 Vault App 的 Reveal 操作验证解密成功）。
- 恢复演练不应在生产数据库上直接执行。

## 4. 密钥轮换流程

`vault_records.key_version` 字段为将来的主密钥轮换预留。当前仅实现 `keyVersion = 1`；轮换尚未自动化，执行步骤如下：

1. 生成新主密钥：`openssl rand -base64 32`，记为 `VAULT_MASTER_KEY_NEW`。
2. 编写一次性脚本：对 `vault_records` 表中每一行，使用旧密钥（`decryptVaultFields`，`keyVersion=1`）解密 `encrypted_fields`，再用新密钥重新加密（`encryptVaultFields` 逻辑，但改用新密钥），写回 `encrypted_fields`、`encryption_nonce`，并将 `key_version` 更新为新版本号（如 `2`）。
3. 该脚本必须在维护窗口内以事务方式逐行处理，避免旧/新密钥并存期间的部分失败状态。
4. 脚本执行成功后，将部署环境的 `VAULT_MASTER_KEY` 切换为新值,并提升 `domains/vault/crypto.ts` 中的 `KEY_VERSION` 常量以拒绝旧版本的新写入。
5. 确认所有行的 `key_version` 均已更新后,安全销毁旧密钥。

## 5. 数据导出边界

后台数据导出功能（如后续构建）不得导出以下内容：

- OAuth Client Secret（`AUTH_GITHUB_SECRET`）
- Server Agent Token（`server_agents.token_hash`/原始 Token）
- 部署环境的 `VAULT_MASTER_KEY`、`STEPUP_SESSION_SECRET`、`AUTH_SECRET`

Vault 记录本身如需导出，应始终为脱敏摘要（`alias`/`provider`/`tags`/时间戳），不包含解密后的字段。
