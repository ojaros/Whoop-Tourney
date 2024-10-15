'use client';

import React, { useState, useEffect } from 'react';

import { useAppKitAccount } from "@reown/appkit/react";
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { transformForOnchain, Proof, verifyProof } from '@reclaimprotocol/js-sdk';

import {
  AppBar, Toolbar, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar,
  LinearProgress, Box, Container, Grid, Paper, Chip,
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
import { parseEther } from 'viem'

import contractABI from './contractABI';
import ReclaimProof from './components/connectButton';

const contractAddress = "0x627aD108f1C876F94eCaF01280c93a8e03F055C3"


interface User {
  id: number;
  name: string;
  recoveryScore: number;
  entered: boolean;
  avatar: string;
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
  const [users, setUsers] = useState<User[]>([]);
  const [proofObject, setProofObject] = useState<Proof | null>(null);
  const [parsedProofs, setParsedProofs] = useState<ParsedProofs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prizePool, setPrizePool] = useState(0);

  const { address, isConnected } = useAppKitAccount();
  const { data: hash, isPending, writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  
  console.log(isConfirmed)
  // Derived state
  const walletConnected = isConnected;
  const whoopConnected = proofObject !== null;
  const canJoinTournament = whoopConnected && walletConnected;

  useEffect(() => {
    setPrizePool(users.filter((u) => u.entered).length * 5);
  }, [users]);

  function WalletButton() {
    return <w3m-button></w3m-button>;
  }

  const handleProofs = (proof: Proof) => {
    setProofObject(proof);

    try {
      // Optionally verify the proof off-chain
      verifyProof(proof);

      // Parse parameters from the proof
      const parameters = JSON.parse(proof.claimData.parameters);
      const paramValues = parameters.paramValues;

      const { hrv, recovery_score, sleep_score, user_id } = paramValues;

      const newParsedProofs: ParsedProofs = {
        hrv,
        recovery_score,
        sleep_score,
        user_id,
      };

      setParsedProofs(newParsedProofs);

      // Create or update the user
      const updatedUser = {
        id: users.length + 1,
        name: address || 'Unknown',
        recoveryScore: Number(newParsedProofs.recovery_score),
        entered: true,
        avatar: '/your-avatar-placeholder.svg', // Replace with actual avatar link
      };

      setUsers((prevUsers) => {
        const existingUser = prevUsers.find((user) => user.name === updatedUser.name);
        if (existingUser) {
          return prevUsers.map((user) => (user.name === updatedUser.name ? updatedUser : user));
        }
        return [...prevUsers, updatedUser];
      });
    } catch (error) {
      console.error('Error parsing proof:', error);
      setError('An error occurred while processing the proof.');
      // if (onError) onError(error);
    }
  };

  const handleProofsError = (error: Error) => {
    console.error('Error in ReclaimProof:', error);
    setError('An error occurred during verification. Please try again.');
  };

  async function verifyAndJoinTournament() {
    if (!proofObject || !parsedProofs) return;

    try {
      // Transform the proof for on-chain use
      const proofData = transformForOnchain(proofObject);
  
      // Extract the recovery score from parsedProofs
      const recoveryScore = Number(parsedProofs.recovery_score);

      // Call writeContract with the transformed proofData
      const data = await writeContractAsync({
        address: contractAddress,
        abi: contractABI,
        functionName: 'verifyProof',
        args: [proofData, recoveryScore],
        value: parseEther('0.01')
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
            {address &&
              <ReclaimProof
                onProofs={handleProofs}
                onError={handleProofsError}
                userAddress={address}
              />
            }

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
                    ${prizePool}
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
                    Entry fee: 0.003 ETH (approx. $5)
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
                disabled={!canJoinTournament || isPending || isConfirming}
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
                {users.sort((a, b) => b.recoveryScore - a.recoveryScore).map((user, index) => (
                  <TableRow key={user.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar src={user.avatar} alt={user.name} sx={{ mr: 2 }} />
                        {user.name}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{user.recoveryScore}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={user.entered ? 'Entered' : 'Not Entered'}
                        color={user.entered ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
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
