// Main.tsx (or your component file)
'use client';

import React, { useState, useEffect } from 'react';

import { useAppKitAccount } from "@reown/appkit/react";
import { useWaitForTransactionReceipt, useWriteContract, useReadContract, useReadContracts, useBalance } from 'wagmi';
import { transformForOnchain, Proof, verifyProof } from '@reclaimprotocol/js-sdk';
import { parseEther } from 'viem';

import {
  AppBar, Toolbar, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar,
  LinearProgress, Box, Container, Grid, Paper, Chip, CircularProgress,
  ThemeProvider, createTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  EmojiEvents as TrophyIcon,
  Person as UserIcon,
  Leaderboard as LeaderboardIcon,
  Add as AddIcon
} from '@mui/icons-material';
import './page.css';

import { ParsedProofs } from './Interfaces';
import contractABI from './contractABI';
import ReclaimProof from './components/connectButton';

import type { Abi } from 'abitype'; // Correct import from 'abitype'

const contractAddress: `0x${string}` = "0x627aD108f1C876F94eCaF01280c93a8e03F055C3"; // Ensure address matches the template

// Define Participant interface matching the on-chain data
interface Participant {
  address: string;
  recoveryScore: number;
  entered: boolean;
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#BB86FC',
    },
    secondary: {
      main: '#03DAC6',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

const StyledCard = styled(Card)(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}));

export default function Main() {
  const [proofObject, setProofObject] = useState<Proof | null>(null);
  const [parsedProofs, setParsedProofs] = useState<ParsedProofs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prizePool, setPrizePool] = useState(0);
  const [participantsData, setParticipantsData] = useState<Participant[]>([]);

  const { address, isConnected } = useAppKitAccount();
  const { data: hash, isPending, writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const { data: contractBalance, isError: isBalanceError, isLoading: isBalanceLoading } = useBalance({
    address: contractAddress,
  });

  useEffect(() => {
    if (contractBalance) {
      // Convert balance from wei to ETH
      const balanceInEth = parseFloat(contractBalance.formatted);
      setPrizePool(balanceInEth);
      console.log('Contract Balance (ETH):', balanceInEth);
    }
  }, [contractBalance]);

  // Fetch participant addresses using typed ABI
  const {
    data: participantAddresses,
    isError: isParticipantsError,
    isLoading: isParticipantsLoading,
  } = useReadContract({
    address: contractAddress,
    abi: contractABI as Abi, // Type assertion to ensure Abi type
    functionName: 'getParticipants',
  });

  useEffect(() => {
    console.log('Participant Addresses:', participantAddresses);
  }, [participantAddresses]);

  // Fetch recovery scores for each participant
  const {
    data: recoveryScoresData,
    isError: isRecoveryScoresError,
    isLoading: isRecoveryScoresLoading,
  } = useReadContracts({
    contracts: Array.isArray(participantAddresses)
      ? participantAddresses.map((participantAddress: string) => ({
        address: contractAddress,
        abi: contractABI as Abi, // Type assertion to ensure Abi type
        functionName: 'recoveryScores',
        args: [participantAddress],
      }))
      : [],
  });

  useEffect(() => {
    console.log('Recovery Scores Data:', recoveryScoresData);
  }, [recoveryScoresData]);

  // Combine participant addresses and recovery scores
  useEffect(() => {
    if (
      Array.isArray(participantAddresses) &&
      Array.isArray(recoveryScoresData) &&
      participantAddresses.length === recoveryScoresData.length
    ) {
      const participants: Participant[] = participantAddresses.map((participantAddress: string, index: number) => {
        const scoreData = recoveryScoresData[index];
        let recoveryScore = 0;

        if (scoreData && scoreData.status === 'success') {
          // Convert BigInt to Number
          recoveryScore = Number(scoreData.result);

          // Optional: Check for NaN after conversion
          if (isNaN(recoveryScore)) {
            console.warn(`Invalid recovery score for address ${participantAddress}:`, scoreData.result);
            recoveryScore = 0; // Assign a default value or handle as needed
          }
        } else {
          console.warn(`Failed to fetch recovery score for address ${participantAddress}:`, scoreData);
        }

        return {
          address: participantAddress,
          recoveryScore: recoveryScore,
          entered: true,
        };
      });

      setParticipantsData(participants);

      console.log('Mapped Participants Data:', participants);

      // Update prize pool based on number of participants
      setPrizePool(participants.length * 1); // Adjust based on your entry fee logic
    }
  }, [participantAddresses, recoveryScoresData]);

  // Derived state
  const walletConnected = isConnected;
  const whoopConnected = proofObject !== null;
  const canJoinTournament = whoopConnected && walletConnected;

  function WalletButton() {
    return <w3m-button></w3m-button>;
  }

  // Handle proofs from ReclaimProof component
  const handleProofs = (proof: Proof) => {
    setProofObject(proof);

    try {
      // Optionally verify the proof off-chain
      verifyProof(proof);

      // Parse parameters from the proof
      const parameters = JSON.parse(proof.claimData.parameters);
      const paramValues = parameters.paramValues;

      console.log("param values: ", paramValues)

      const { hrv, recovery_score, sleep_score, user_id } = paramValues;

      const newParsedProofs: ParsedProofs = {
        hrv,
        recovery_score,
        sleep_score,
        user_id,
      };

      setParsedProofs(newParsedProofs);

      console.log('Parsed Proofs:', newParsedProofs);
    } catch (error) {
      console.error('Error parsing proof:', error);
      setError('An error occurred while processing the proof.');
    }
  };

  const handleProofsError = (error: Error) => {
    console.error('Error in ReclaimProof:', error);
    setError('An error occurred during verification. Please try again.');
  };

  // Function to join the tournament by verifying the proof and sending the entry fee
  async function verifyAndJoinTournament() {
    if (!proofObject || !parsedProofs) return;

    try {
      const proofData = transformForOnchain(proofObject);
      const recoveryScore = Number(parsedProofs.recovery_score);

      const data = await writeContractAsync({
        address: contractAddress,
        abi: contractABI as Abi, // Type assertion to ensure Abi type
        functionName: 'verifyProof',
        args: [proofData, recoveryScore],
        value: parseEther('0.0006'), // Correct entry fee in ETH
      });

      console.log('Transaction submitted:', data);
      alert(`User entered the tournament!`);
    } catch (error) {
      console.error('Verification failed:', error);
      setError('Failed to join the tournament. Please try again.');
    }
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Whoop Tourney
            </Typography>

            <WalletButton />

            {/* ReclaimProof component */}
            {address && (
              <ReclaimProof
                onProofs={handleProofs}
                onError={handleProofsError}
                userAddress={address}
              />
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4 }}>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <TrophyIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography variant="h6">This Weeks Tournament</Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom color="primary">
                      {isBalanceLoading ? (
                        <CircularProgress size={24} />
                      ) : isBalanceError ? (
                        'Error fetching balance'
                      ) : (
                        `${contractBalance?.formatted} ETH`
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Prize Pool
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={prizePool}
                      sx={{ mt: 2, mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Entry fee: 0.0006 ETH (approx. $1)
                    </Typography>
                  </CardContent>
                </StyledCard>
              </Grid>

            <Grid item xs={12} md={6}>
              <StyledCard>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <UserIcon sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="h6">Your Stats</Typography>
                  </Box>

                  {whoopConnected && parsedProofs !== null ? (
                    <Box>
                      {/* Display extracted proofs data */}
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Recovery Score
                      </Typography>
                      <Typography variant="h4" gutterBottom color="secondary">
                        {`${parsedProofs.recovery_score}%`}
                      </Typography>
                      <Chip
                        label={`HRV: ${Number(parsedProofs.hrv) * 1000}`}
                        color="primary"
                        size="small"
                        sx={{ mr: 1, mt: 1 }}
                      />
                      <Chip
                        label={`Sleep Score: ${parsedProofs.sleep_score}%`}
                        color="secondary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  ) : (
                    <Typography color="text.secondary">Connect your Whoop account to see your stats</Typography>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>

          <Paper sx={{ mt: 4, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                <LeaderboardIcon sx={{ mr: 1 }} />
                Leaderboard
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                disabled={!canJoinTournament || isPending || isConfirming || isParticipantsLoading || isRecoveryScoresLoading}
                onClick={verifyAndJoinTournament}
              >
                {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Join Tournament'}
              </Button>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Recovery Score</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isParticipantsLoading || isRecoveryScoresLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : isParticipantsError || isRecoveryScoresError ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="error">Failed to load leaderboard data.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  participantsData
                    .sort((a, b) => b.recoveryScore - a.recoveryScore)
                    .map((participant, index) => (
                      <TableRow key={participant.address} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell component="th" scope="row">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar src="/your-avatar-placeholder.svg" alt={participant.address} sx={{ mr: 2 }} />
                            {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{participant.recoveryScore}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label="Entered"
                            color="success"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Container>

        {/* Display Error Message */}
        {error && (
          <Box sx={{ position: 'fixed', top: 16, right: 16, bgcolor: 'error.main', p: 2, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="body2" color="white">
              {error}
            </Typography>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}
