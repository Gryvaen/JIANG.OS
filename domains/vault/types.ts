export interface VaultRecordSummary { id:string; alias:string; provider:string; tags:string[]; archivedAt:string|null; updatedAt:string }
export interface VaultRecordRevealed extends VaultRecordSummary { redactedAddress:string; username:string; port:number|null; notes:string; managerRef:string; sshCommandTemplate:string }
export interface VaultRecordInput { alias:string; provider:string; tags:string[]; redactedAddress:string; username:string; port:number|null; notes:string; managerRef:string; sshCommandTemplate:string }
