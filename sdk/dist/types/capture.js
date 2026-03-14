/**
 * Capture Module Types
 *
 * Types for all value capture modules:
 * - Referral
 * - Attention
 * - Data
 * - Compute
 * - Network
 * - Skill
 * - Liquidity
 * - Energy
 * - Social
 * - Insurance
 */
/** Task status enum */
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["Pending"] = 0] = "Pending";
    TaskStatus[TaskStatus["Completed"] = 1] = "Completed";
    TaskStatus[TaskStatus["Failed"] = 2] = "Failed";
    TaskStatus[TaskStatus["Disputed"] = 3] = "Disputed";
})(TaskStatus || (TaskStatus = {}));
// ============================================================================
// NETWORK CAPTURE
// ============================================================================
/** Node type enum */
export var NodeType;
(function (NodeType) {
    NodeType[NodeType["Validator"] = 0] = "Validator";
    NodeType[NodeType["Relay"] = 1] = "Relay";
    NodeType[NodeType["Oracle"] = 2] = "Oracle";
    NodeType[NodeType["Storage"] = 3] = "Storage";
    NodeType[NodeType["Compute"] = 4] = "Compute";
})(NodeType || (NodeType = {}));
/** Attestation type enum */
export var AttestationType;
(function (AttestationType) {
    AttestationType[AttestationType["DataIntegrity"] = 0] = "DataIntegrity";
    AttestationType[AttestationType["PriceOracle"] = 1] = "PriceOracle";
    AttestationType[AttestationType["IdentityVerification"] = 2] = "IdentityVerification";
    AttestationType[AttestationType["EventWitness"] = 3] = "EventWitness";
})(AttestationType || (AttestationType = {}));
// ============================================================================
// SKILL CAPTURE
// ============================================================================
/** Skill type enum */
export var SkillType;
(function (SkillType) {
    SkillType[SkillType["Trading"] = 0] = "Trading";
    SkillType[SkillType["ContentCreation"] = 1] = "ContentCreation";
    SkillType[SkillType["DataAnalysis"] = 2] = "DataAnalysis";
    SkillType[SkillType["CustomerService"] = 3] = "CustomerService";
    SkillType[SkillType["CodeGeneration"] = 4] = "CodeGeneration";
    SkillType[SkillType["LanguageTranslation"] = 5] = "LanguageTranslation";
    SkillType[SkillType["ImageRecognition"] = 6] = "ImageRecognition";
    SkillType[SkillType["Custom"] = 7] = "Custom";
})(SkillType || (SkillType = {}));
/** Anonymization level for behavior models */
export var AnonymizationLevel;
(function (AnonymizationLevel) {
    AnonymizationLevel[AnonymizationLevel["None"] = 0] = "None";
    AnonymizationLevel[AnonymizationLevel["Basic"] = 1] = "Basic";
    AnonymizationLevel[AnonymizationLevel["Differential"] = 2] = "Differential";
    AnonymizationLevel[AnonymizationLevel["Federated"] = 3] = "Federated";
})(AnonymizationLevel || (AnonymizationLevel = {}));
// ============================================================================
// LIQUIDITY CAPTURE
// ============================================================================
/** Strategy type for liquidity deployment */
export var LiquidityStrategy;
(function (LiquidityStrategy) {
    LiquidityStrategy[LiquidityStrategy["Conservative"] = 0] = "Conservative";
    LiquidityStrategy[LiquidityStrategy["Balanced"] = 1] = "Balanced";
    LiquidityStrategy[LiquidityStrategy["Aggressive"] = 2] = "Aggressive";
    LiquidityStrategy[LiquidityStrategy["Custom"] = 3] = "Custom";
})(LiquidityStrategy || (LiquidityStrategy = {}));
/** Risk tolerance level */
export var RiskTolerance;
(function (RiskTolerance) {
    RiskTolerance[RiskTolerance["Low"] = 0] = "Low";
    RiskTolerance[RiskTolerance["Medium"] = 1] = "Medium";
    RiskTolerance[RiskTolerance["High"] = 2] = "High";
})(RiskTolerance || (RiskTolerance = {}));
/** Position status */
export var PositionStatus;
(function (PositionStatus) {
    PositionStatus[PositionStatus["Active"] = 0] = "Active";
    PositionStatus[PositionStatus["Rebalancing"] = 1] = "Rebalancing";
    PositionStatus[PositionStatus["Withdrawing"] = 2] = "Withdrawing";
    PositionStatus[PositionStatus["Closed"] = 3] = "Closed";
})(PositionStatus || (PositionStatus = {}));
// ============================================================================
// ENERGY CAPTURE
// ============================================================================
/** Type of energy device */
export var DeviceType;
(function (DeviceType) {
    DeviceType[DeviceType["SolarPanel"] = 0] = "SolarPanel";
    DeviceType[DeviceType["Battery"] = 1] = "Battery";
    DeviceType[DeviceType["EVCharger"] = 2] = "EVCharger";
    DeviceType[DeviceType["SmartThermostat"] = 3] = "SmartThermostat";
    DeviceType[DeviceType["SmartMeter"] = 4] = "SmartMeter";
    DeviceType[DeviceType["HeatPump"] = 5] = "HeatPump";
})(DeviceType || (DeviceType = {}));
/** Energy arbitrage action */
export var ArbitrageAction;
(function (ArbitrageAction) {
    ArbitrageAction[ArbitrageAction["Store"] = 0] = "Store";
    ArbitrageAction[ArbitrageAction["Discharge"] = 1] = "Discharge";
    ArbitrageAction[ArbitrageAction["ShiftLoad"] = 2] = "ShiftLoad";
    ArbitrageAction[ArbitrageAction["SellToGrid"] = 3] = "SellToGrid";
})(ArbitrageAction || (ArbitrageAction = {}));
/** Introduction outcome */
export var IntroOutcome;
(function (IntroOutcome) {
    IntroOutcome[IntroOutcome["Connected"] = 0] = "Connected";
    IntroOutcome[IntroOutcome["DealClosed"] = 1] = "DealClosed";
    IntroOutcome[IntroOutcome["Declined"] = 2] = "Declined";
    IntroOutcome[IntroOutcome["Expired"] = 3] = "Expired";
})(IntroOutcome || (IntroOutcome = {}));
// ============================================================================
// INSURANCE CAPTURE
// ============================================================================
/** Claim type categories */
export var ClaimType;
(function (ClaimType) {
    ClaimType[ClaimType["SmartContractFailure"] = 0] = "SmartContractFailure";
    ClaimType[ClaimType["StablecoinDepeg"] = 1] = "StablecoinDepeg";
    ClaimType[ClaimType["ProtocolInsolvency"] = 2] = "ProtocolInsolvency";
    ClaimType[ClaimType["OracleManipulation"] = 3] = "OracleManipulation";
    ClaimType[ClaimType["GovernanceAttack"] = 4] = "GovernanceAttack";
})(ClaimType || (ClaimType = {}));
/** Vote on a claim */
export var ClaimVoteType;
(function (ClaimVoteType) {
    ClaimVoteType[ClaimVoteType["Approve"] = 0] = "Approve";
    ClaimVoteType[ClaimVoteType["Reject"] = 1] = "Reject";
    ClaimVoteType[ClaimVoteType["Abstain"] = 2] = "Abstain";
})(ClaimVoteType || (ClaimVoteType = {}));
/** Claim status */
export var ClaimStatus;
(function (ClaimStatus) {
    ClaimStatus[ClaimStatus["Pending"] = 0] = "Pending";
    ClaimStatus[ClaimStatus["Voting"] = 1] = "Voting";
    ClaimStatus[ClaimStatus["Approved"] = 2] = "Approved";
    ClaimStatus[ClaimStatus["Rejected"] = 3] = "Rejected";
    ClaimStatus[ClaimStatus["PaidOut"] = 4] = "PaidOut";
})(ClaimStatus || (ClaimStatus = {}));
