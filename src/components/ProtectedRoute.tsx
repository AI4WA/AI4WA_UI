'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { jwtDecode } from 'jwt-decode';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

interface DecodedToken {
    exp: number;
    // Add other token fields you expect
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            try {
                const token = localStorage.getItem('accessToken');

                if (!token) {
                    router.push('/login');
                    return;
                }

                // Decode and verify token
                const decoded = jwtDecode(token) as DecodedToken;
                const currentTime = Date.now() / 1000;

                if (decoded.exp < currentTime) {
                    // Token expired
                    localStorage.removeItem('accessToken');
                    router.push('/login');
                    return;
                }

                setIsAuthenticated(true);
            } catch (error) {
                console.error('Auth check error:', error);
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    width: '100vw',
                    bgcolor: 'background.paper',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 9999
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    // Render children only when authenticated and not loading
    if (!isAuthenticated) {
        return null;
    }
    return <>{children}</>
}