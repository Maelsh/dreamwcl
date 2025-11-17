import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import AuthProvider from './contexts/AuthContext';
import SocketProvider from './contexts/SocketContext';
import App from './App';
import './i18n';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { applyDirection } from './utils/rtl';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const RootComponent = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    applyDirection(i18n.language);
  }, [i18n.language]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <App />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={i18n.language === 'ar'}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);