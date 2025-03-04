import React from 'react';
import Head from 'next/head';
import { Container, Typography } from '@mui/material';

export default function Volume() {
  return (
    <>
      <Head>
        <title>交易量 - 加密貨幣數據中心</title>
        <meta name="description" content="查看24小時交易量統計" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          交易量
        </Typography>
      </Container>
    </>
  );
} 