/**
 * Vault Types
 */
// ============================================================================
// ENUMS
// ============================================================================
/** Type of value capture */
export var CaptureType;
(function (CaptureType) {
    CaptureType[CaptureType["Shopping"] = 0] = "Shopping";
    CaptureType[CaptureType["Data"] = 1] = "Data";
    CaptureType[CaptureType["Presence"] = 2] = "Presence";
    CaptureType[CaptureType["Attention"] = 3] = "Attention";
    CaptureType[CaptureType["Referral"] = 4] = "Referral";
})(CaptureType || (CaptureType = {}));
/** Agent permission levels for vault access */
export var PermissionLevel;
(function (PermissionLevel) {
    PermissionLevel[PermissionLevel["None"] = 0] = "None";
    PermissionLevel[PermissionLevel["Read"] = 1] = "Read";
    PermissionLevel[PermissionLevel["Capture"] = 2] = "Capture";
    PermissionLevel[PermissionLevel["Guided"] = 3] = "Guided";
    PermissionLevel[PermissionLevel["Autonomous"] = 4] = "Autonomous";
})(PermissionLevel || (PermissionLevel = {}));
