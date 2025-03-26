import React from 'react';
//123
import Head from 'next/head';
import { Container, Typography, Box } from '@mui/material';
import { useRouter } from 'next/router';

export default function FearGreed() {
  const router = useRouter();
  
  return (
    <>
      <Head>
        <title>貪婪恐懼指數 - 加密貨幣數據中心</title>
        <meta name="description" content="查看比特幣市場情緒指標及歷史走勢" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            貪婪恐懼指數
          </Typography>
          <button 
            onClick={() => router.push('/')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            返回主頁
          </button>
        </Box>
      </Container>
    </>
  );
} 