const contractABI = [
	{
		"inputs": [],
		"name": "determineWinner",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_reclaimAddress",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "recoveryScore",
				"type": "uint256"
			}
		],
		"name": "ProofVerified",
		"type": "event"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"components": [
							{
								"internalType": "string",
								"name": "provider",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "parameters",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "context",
								"type": "string"
							}
						],
						"internalType": "struct Claims.ClaimInfo",
						"name": "claimInfo",
						"type": "tuple"
					},
					{
						"components": [
							{
								"components": [
									{
										"internalType": "bytes32",
										"name": "identifier",
										"type": "bytes32"
									},
									{
										"internalType": "address",
										"name": "owner",
										"type": "address"
									},
									{
										"internalType": "uint32",
										"name": "timestampS",
										"type": "uint32"
									},
									{
										"internalType": "uint32",
										"name": "epoch",
										"type": "uint32"
									}
								],
								"internalType": "struct Claims.CompleteClaimData",
								"name": "claim",
								"type": "tuple"
							},
							{
								"internalType": "bytes[]",
								"name": "signatures",
								"type": "bytes[]"
							}
						],
						"internalType": "struct Claims.SignedClaim",
						"name": "signedClaim",
						"type": "tuple"
					}
				],
				"internalType": "struct Reclaim.Proof",
				"name": "proof",
				"type": "tuple"
			},
			{
				"internalType": "uint256",
				"name": "recoveryScore",
				"type": "uint256"
			}
		],
		"name": "verifyProof",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "prizeAmount",
				"type": "uint256"
			}
		],
		"name": "WinnerDeclared",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "entryFee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getParticipants",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "participants",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "reclaimAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "recoveryScores",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

export default contractABI