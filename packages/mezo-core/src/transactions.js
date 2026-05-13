"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mezoStakingActions = exports.MEZO_STAKING_ADDR = void 0;
var viem_1 = require("viem");
var abis_1 = require("./abis");
exports.MEZO_STAKING_ADDR = '0xAB13B8eecf5AA2460841d75da5d5D861fD5B8A39';
exports.mezoStakingActions = {
    prepareStake: function (amount, decimals) {
        if (decimals === void 0) { decimals = 18; }
        return ({
            address: exports.MEZO_STAKING_ADDR,
            abi: abis_1.MEZO_PORTAL_ABI, // Added ABI here
            functionName: 'deposit', // Updated to match standard Portal naming
            args: [(0, viem_1.parseUnits)(amount, decimals)],
        });
    },
    prepareWithdraw: function (amount, decimals) {
        if (decimals === void 0) { decimals = 18; }
        return ({
            address: exports.MEZO_STAKING_ADDR,
            abi: abis_1.MEZO_PORTAL_ABI, // Added ABI here
            functionName: 'withdraw',
            args: [(0, viem_1.parseUnits)(amount, decimals)],
        });
    },
};
