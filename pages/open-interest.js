import React from 'react';
import Head from 'next/head';
import { Container, Typography } from '@mui/material';

export default function OpenInterest() {
  return (
    <>
      <Head>
        <title>未平倉合約 - 加密貨幣數據中心</title>
        <meta name="description" content="查看合約未平倉量數據" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          未平倉合約
        </Typography>
      </Container>
    </>
  );
} 