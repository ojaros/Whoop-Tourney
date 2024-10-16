// Main.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { useAppKitAccount } from "@reown/appkit/react";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
  useReadContracts,
  useBalance,
} from 'wagmi';
import { transformForOnchain, Proof, verifyProof } from '@reclaimprotocol/js-sdk';
import { parseEther } from 'viem';

import {
  AppBar, Toolbar, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar,
  LinearProgress, Box, Container, Grid, Paper, Chip, CircularProgress,
  ThemeProvider, createTheme, Snackbar, Alert
} from '@mui/material';
import { SnackbarCloseReason } from '@mui/material/Snackbar';
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

import type { Abi } from 'abitype';

const contractAddress: `0x${string}` = "0x873ECE7d8A1df2c6Fb3867bc8c4aCA9d8462baE8";

// Define Participant interface matching the on-chain data
interface Participant {
  address: string;
  averageScore: number;
  dailyScores: number[]; // Array to store daily scores
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
  const [prizePool, setPrizePool] = useState<number>(0);
  const [participantsData, setParticipantsData] = useState<Participant[]>([]);

  const { address, isConnected, caipAddress, status } = useAppKitAccount();

  // Initialize useWriteContract without parameters; pass them dynamically in writeContractAsync
  const { data: hash, isPending, writeContractAsync } = useWriteContract();

  // Fetch participant addresses using typed ABI
  const {
    data: participantAddresses,
    isError: isParticipantsError,
    isLoading: isParticipantsLoading,
    refetch: refetchParticipantAddresses, // Extract refetch
  } = useReadContract({
    address: contractAddress,
    abi: contractABI as Abi, // Type assertion to ensure Abi type
    functionName: 'getParticipants',
  });

  // Batch fetch average scores and daily scores using useReadContracts
  const {
    data: contractReadsData,
    isError: isContractReadsError,
    isLoading: isContractReadsLoading,
    refetch: refetchContractReads, // Extract refetch
  } = useReadContracts({
    contracts: Array.isArray(participantAddresses)
      ? participantAddresses.flatMap((participantAddress: string) => [
        {
          address: contractAddress,
          abi: contractABI as Abi,
          functionName: 'getAverageScore',
          args: [participantAddress],
        },
        {
          address: contractAddress,
          abi: contractABI as Abi,
          functionName: 'getDailyScores',
          args: [participantAddress],
        },
      ])
      : [],
  });

  const { isLoading: isConfirming, data: receipt, isError: isReceiptError, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });

  // useEffect to handle receipt updates
  useEffect(() => {
    if (receipt) {
      // Transaction is confirmed; refetch data
      refetchParticipantAddresses();
      refetchContractReads();
    }

    if (isReceiptError && receiptError) {
      // Handle receipt fetching errors
      console.error('Transaction receipt error:', receiptError);
      setError('An error occurred while confirming the transaction.');
    }
  }, [receipt, isReceiptError, receiptError, refetchParticipantAddresses, refetchContractReads]);

  const { data: contractBalance, isError: isBalanceError, isLoading: isBalanceLoading } = useBalance({
    address: contractAddress,
  });

  console.log("Address: ", caipAddress);
  console.log("Status: ", status);

  useEffect(() => {
    if (contractBalance) {
      // Convert balance from wei to ETH
      const balanceInEth = parseFloat(contractBalance.formatted);
      setPrizePool(balanceInEth);
      console.log('Contract Balance (ETH):', balanceInEth);
    }
  }, [contractBalance]);

  useEffect(() => {
    console.log('Participant Addresses:', participantAddresses);
  }, [participantAddresses]);

  useEffect(() => {
    console.log('Contract Reads Data:', contractReadsData);
  }, [contractReadsData]);

  // Combine participant addresses and contract reads data
  useEffect(() => {
    const fetchParticipantsData = () => {
      if (
        Array.isArray(participantAddresses) &&
        participantAddresses.length > 0 &&
        Array.isArray(contractReadsData) &&
        contractReadsData.length === participantAddresses.length * 2 // Each participant has two reads
      ) {
        const updatedParticipants: Participant[] = participantAddresses.map((participantAddress: string, index: number) => {
          const avgScoreData = contractReadsData[index * 2];
          const dailyScoresData = contractReadsData[index * 2 + 1];

          const averageScore = avgScoreData?.result ? Number(avgScoreData.result) : 0;
          const dailyScores = dailyScoresData?.result
            ? (dailyScoresData.result as bigint[]).map(score => Number(score))
            : [];

          return {
            address: participantAddress.toLowerCase(), // Normalize address to lowercase
            averageScore: averageScore,
            dailyScores: dailyScores,
            entered: true,
          };
        });

        setParticipantsData(updatedParticipants);
        console.log('Mapped Participants Data with Averages and Daily Scores:', updatedParticipants);
      }
    };

    fetchParticipantsData();
  }, [participantAddresses, contractReadsData]);

  // Derived state
  const walletConnected = isConnected && address !== undefined;
  const whoopConnected = proofObject !== null && address !== undefined;
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

      console.log("param values: ", paramValues);

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

      if (isNaN(recoveryScore)) {
        console.error('Cannot send NaN as recoveryScore');
        setError('Invalid recovery score. Please verify your data.');
        return;
      }

      const tx = await writeContractAsync({
        address: contractAddress,
        abi: contractABI as Abi, // Type assertion to ensure Abi type
        functionName: 'verifyProof',
        args: [proofData, recoveryScore],
        value: parseEther('0.0006'), // Value as bigint is correct per wagmi documentation
      });

      console.log('Transaction submitted:', tx);
      alert(`You have successfully entered the tournament!`);
    } catch (error: unknown) {
      console.error('Verification failed:', error);
      if (error instanceof Error) {
        setError(error.message || 'Failed to join the tournament. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  }

  // Memoize sorted participants to optimize rendering
  const sortedParticipants = useMemo(() => {
    return [...participantsData].sort((a, b) => b.averageScore - a.averageScore);
  }, [participantsData]);

  // Snackbar state for error messages
  const [openError, setOpenError] = useState(false);

  useEffect(() => {
    if (error) {
      setOpenError(true);
    }
  }, [error]);

  const handleCloseSnackbar = (
    event: Event | React.SyntheticEvent<Element, Event>,
    reason: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenError(false);
  };

  const handleCloseAlert = (
    event?: React.SyntheticEvent,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenError(false);
  };
  

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
            {/* Tournament Details */}
            <Grid item xs={12} md={4}>
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
                    value={prizePool > 10 ? 100 : (prizePool / 10) * 100} // Assuming targetPrizePool is 10 ETH
                    sx={{ mt: 2, mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Prize Pool Progress: {prizePool > 10 ? '100%' : `${((prizePool / 10) * 100).toFixed(2)}%`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Entry fee: 0.0006 ETH (approx. $1)
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Today's Whoop Info and Join Tournament */}
            <Grid item xs={12} md={4}>
              <StyledCard>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <UserIcon sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="h6">Todays Whoop Info</Typography>
                  </Box>

                  {whoopConnected && parsedProofs !== null ? (
                    <Box>
                      {/* Box 1: Display extracted proofs data */}
                      <Box sx={{ mb: 3 }}>
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

                      {/* Box 2: Join Tournament Button */}
                      <Box sx={{ mb: 3 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          disabled={!canJoinTournament || isPending || isConfirming || isParticipantsLoading || isContractReadsLoading}
                          onClick={verifyAndJoinTournament}
                          fullWidth
                        >
                          {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Join Tournament'}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">Connect your Whoop account to see your stats</Typography>
                  )}

                </CardContent>
              </StyledCard>
            </Grid>

            {/* Your Stats */}
            <Grid item xs={12} md={4}>
              <StyledCard>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <UserIcon sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="h6">Your Stats</Typography>
                  </Box>

                  {walletConnected ? (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Weekly Recovery Scores
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Day</TableCell>
                            <TableCell align="right">Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {participantsData
                            .filter(participant => participant.address === address.toLowerCase())
                            .flatMap(participant =>
                              participant.dailyScores.map((score, index) => (
                                <TableRow key={index}>
                                  <TableCell>{`Day ${index + 1}`}</TableCell>
                                  <TableCell align="right">{score}</TableCell>
                                </TableRow>
                              ))
                            )
                          }
                        </TableBody>
                      </Table>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">Connect your wallet to see your stats</Typography>
                  )}

                </CardContent>
              </StyledCard>
            </Grid>

          </Grid>

          {/* Leaderboard */}
          <Paper sx={{ mt: 4, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                <LeaderboardIcon sx={{ mr: 1 }} />
                Leaderboard
              </Typography>
              {/* Removed the Join Tournament Button from Leaderboard */}
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Average Recovery Score</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isParticipantsLoading || isContractReadsLoading || isBalanceLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : isParticipantsError || isContractReadsError || isBalanceError ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="error">Failed to load leaderboard data.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedParticipants.map((participant, index) => (
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
                      <TableCell align="right">{participant.averageScore}</TableCell>
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

        {/* Snackbar for Error Messages */}
        <Snackbar open={openError} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider >
  );
}
