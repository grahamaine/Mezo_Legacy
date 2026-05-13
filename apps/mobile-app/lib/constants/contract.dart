const String vaultAddress = '0x30F40bf7e6ddEA5021Fd6BA4F2D665433d9734F7';

const List<Map<String, dynamic>> vaultAbi = [
  { 'name': 'stake', 'type': 'function', 'stateMutability': 'payable', 'inputs': [], 'outputs': [] },
  { 'name': 'withdraw', 'type': 'function', 'stateMutability': 'nonpayable', 'inputs': [{'name': 'amount', 'type': 'uint256'}], 'outputs': [] },
  { 'name': 'transfer', 'type': 'function', 'stateMutability': 'nonpayable', 'inputs': [{'name': 'to', 'type': 'address'}, {'name': 'amount', 'type': 'uint256'}], 'outputs': [] },
  { 'name': 'getStakedBalance', 'type': 'function', 'stateMutability': 'view', 'inputs': [{'name': 'user', 'type': 'address'}], 'outputs': [{'name': '', 'type': 'uint256'}] },
  { 'name': 'totalAssets', 'type': 'function', 'stateMutability': 'view', 'inputs': [], 'outputs': [{'name': '', 'type': 'uint256'}] },
  { 'name': 'balanceOf', 'type': 'function', 'stateMutability': 'view', 'inputs': [{'name': 'account', 'type': 'address'}], 'outputs': [{'name': '', 'type': 'uint256'}] },
];
