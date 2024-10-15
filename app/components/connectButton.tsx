// components/ReclaimProof.tsx or ReclaimProof.jsx

import React, { useState } from 'react';
import { ReclaimProofRequest, Proof } from '@reclaimprotocol/js-sdk';
import QRCode from "react-qr-code";
import { Modal, Box, Button, Typography, CircularProgress } from '@mui/material';
import { FitnessCenter as ActivityIcon } from '@mui/icons-material';

function ReclaimProof({
  onProofs,
  onError,
  userAddress,
}: {
  onProofs: (proof: Proof) => void;
  onError: (error: Error) => void;
  userAddress: string;
}) {
  const [requestUrl, setRequestUrl] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  async function initializeReclaim() {
    const APP_ID = '0xbcfC9279d4A3aDaf56892E8566242acF9052297f';
    const APP_SECRET = '0x0cb3499abcaf7a38288fa74ae1af145c70dbea7d748cf091841ca55f4c6128e5';
    // const PROVIDER_ID = 'fd857881-2bcd-4dd2-84d6-5caba6e6bd71';
    const PROVIDER_ID = '81c8337c-2367-4820-bda0-61efaf9cc0e9';

    setLoading(true);
    setLocalError(null);

    try {
      const reclaimProofRequest = await ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID);

      if (userAddress) {
        reclaimProofRequest.addContext(userAddress, 'User Ethereum address')
      } else {
        console.error('User address is not available.');
        setLocalError('Please connect your wallet before proceeding.');
        if (onError) onError(new Error('User address is not available.'));
        return;
      }

      const url = await reclaimProofRequest.getRequestUrl();
      setRequestUrl(url);

      await reclaimProofRequest.startSession({
        onSuccess: (proof: Proof) => { // Use Proof type as per SDK

          console.log('Verification success', proof);

          onProofs(proof);
          handleClose();
        },
        onError: (error: Error) => {
          console.error('Verification failed', error);
          setLocalError('Verification failed. Please try again.');
          if (onError) onError(error);
        }
      });

      // Open the modal after setting the URL
      handleOpen();
    } catch (error) {
      console.error('Initialization failed', error);
      setLocalError('Initialization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Style for the modal content
  const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 300,
    bgcolor: 'background.paper',
    borderRadius: '8px',
    boxShadow: 24,
    p: 4,
    textAlign: 'center',
  };

  return (
    <div>
      {!requestUrl && (
        <Button
          variant="contained"
          color="primary"
          onClick={initializeReclaim}
          startIcon={<ActivityIcon />}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Connect Whoop'}
        </Button>
      )}
      {/* MUI Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="qr-code-modal-title"
        aria-describedby="qr-code-modal-description"
      >
        <Box sx={style}>
          <Typography id="qr-code-modal-title" variant="h6" component="h2" gutterBottom>
            {loading ? 'Generating QR Code...' : 'Scan this QR Code'}
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            requestUrl && <QRCode value={requestUrl} />
          )}
          {!loading && (
            <Button onClick={handleClose} sx={{ mt: 2 }} variant="outlined">
              Close
            </Button>
          )}
          {localError && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {localError}
            </Typography>
          )}
        </Box>
      </Modal>
    </div>
  );
}

export default ReclaimProof;