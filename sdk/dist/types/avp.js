/**
 * AVP Types - Agent Value Protocol
 */
// ============================================================================
// ENUMS
// ============================================================================
/** Agent type */
export var AgentType;
(function (AgentType) {
    AgentType[AgentType["Personal"] = 0] = "Personal";
    AgentType[AgentType["Service"] = 1] = "Service";
})(AgentType || (AgentType = {}));
/** Agent status */
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus[AgentStatus["Active"] = 0] = "Active";
    AgentStatus[AgentStatus["Suspended"] = 1] = "Suspended";
    AgentStatus[AgentStatus["Revoked"] = 2] = "Revoked";
})(AgentStatus || (AgentStatus = {}));
