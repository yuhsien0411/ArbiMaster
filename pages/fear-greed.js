import React from 'react';
//123
import Head from 'next/head';
import { Container, Typography } from '@mui/material';

export default function FearGreed() {
  return (
    <>
      <Head>
        <title>貪婪恐懼指數 - 加密貨幣數據中心</title>
        <meta name="description" content="查看比特幣市場情緒指標及歷史走勢" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          貪婪恐懼指數
        </Typography>
      </Container>
    </>
  );
} 