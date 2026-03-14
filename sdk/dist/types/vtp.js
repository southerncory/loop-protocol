/**
 * VTP Types - Value Transfer Protocol
 */
// ============================================================================
// ENUMS
// ============================================================================
/** Escrow status */
export var EscrowStatus;
(function (EscrowStatus) {
    EscrowStatus[EscrowStatus["Active"] = 0] = "Active";
    EscrowStatus[EscrowStatus["Released"] = 1] = "Released";
    EscrowStatus[EscrowStatus["Cancelled"] = 2] = "Cancelled";
    EscrowStatus[EscrowStatus["Disputed"] = 3] = "Disputed";
})(EscrowStatus || (EscrowStatus = {}));
