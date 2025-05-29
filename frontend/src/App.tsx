import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Stacks from './pages/Stacks';
import StackDetail from './pages/StackDetail';
import Networks from './pages/Networks';
import CreateService from './pages/CreateService';
import CreateStack from './pages/CreateStack';
import CreateNetwork from './pages/CreateNetwork';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/create" element={<CreateService />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/stacks" element={<Stacks />} />
              <Route path="/stacks/create" element={<CreateStack />} />
              <Route path="/stacks/:name" element={<StackDetail />} />
              <Route path="/networks" element={<Networks />} />
              <Route path="/networks/create" element={<CreateNetwork />} />
            </Routes>
          </Layout>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
