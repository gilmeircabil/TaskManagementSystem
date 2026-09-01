import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            background: '#153F33',
            color: '#F6F5F0',
            fontSize: '13.5px',
            borderRadius: '8px',
          },
          success: { iconTheme: { primary: '#E8C468', secondary: '#153F33' } },
          error: { iconTheme: { primary: '#C4593A', secondary: '#F6F5F0' } },
        }}
      />
      <AppRoutes />
    </>
  );
}
