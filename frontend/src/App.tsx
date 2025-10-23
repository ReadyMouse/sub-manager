import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './lib/wagmi';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { CreateSubscription } from './pages/CreateSubscription';
import { MySubscriptions } from './pages/MySubscriptions';
import { Settings } from './pages/Settings';
import { EnvioAdmin } from './pages/EnvioAdmin';
import { ForResidents } from './pages/ForResidents';
import { ForPropertyOwners } from './pages/ForPropertyOwners';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/for-residents" element={<ForResidents />} />
                <Route path="/for-property-owners" element={<ForPropertyOwners />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                {/* Read-only public pages */}
                <Route path="/create" element={<CreateSubscription />} />
                <Route path="/subscriptions" element={<MySubscriptions />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/envio-admin" element={<EnvioAdmin />} />
                
                {/* Legacy redirect - /profile now goes to /settings */}
                <Route path="/profile" element={<Settings />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
