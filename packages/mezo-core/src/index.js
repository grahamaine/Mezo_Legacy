"use strict";
/**
 * Mezo Core - Shared Business Logic
 * Internal exports for the Mezo Monorepo
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTRACT_ADDRESSES = void 0;
// 1. Export all types and interfaces
__exportStar(require("./types"), exports);
// 2. Export transaction logic and constants
__exportStar(require("./transactions"), exports);
// 3. (Optional) Export constants directly for easy access
var transactions_1 = require("./transactions");
exports.CONTRACT_ADDRESSES = {
    STAKING: transactions_1.MEZO_STAKING_ADDR,
};
// 4. (Optional) Re-export common utilities if needed
// export * from './utils/formatters';
