'use client';

import { gql, useSubscription, useMutation } from '@apollo/client';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';

// GraphQL Types
interface ImageData {
    id: string | number;
    image: string;
    updated_at: string;
    created_at: string;
}

interface PatientTrackingItem {
    id: string | number;
    description: string;
    count: number;
    created_at: string;
    updated_at: string;
    dashboard_imagedata?: ImageData[];
}

interface SubscriptionData {
    dashboard_patienttracking: PatientTrackingItem[];
}

interface MutationResponse {
    insert_dashboard_patienttracking: {
        returning: Array<{ id: string | number }>;
        affected_rows: number;
    };
}

interface FormData {
    description: string;
    count: string;
}

interface MutationVariables {
    description: string;
    count: number;
}

const SUB_DASHBOARD_PATIENTTRACKING = gql`
    subscription GET_DASHBOARD_PATIENTTRACKING {
        dashboard_patienttracking {
            id
            updated_at
            description
            count
            created_at
            dashboard_imagedata {
                id
                image
                updated_at
                created_at
            }
        }
    }
`;

const ADD_PATIENT_TRACKING = gql`
    mutation ADD_PATIENT_TRACKING($description: String!, $count: Int!) {
        insert_dashboard_patienttracking(
            objects: { description: $description, count: $count, created_at: "now()", updated_at: "now()" }
        ) {
            returning {
                id
            }
            affected_rows
        }
    }
`;

export default function ExamplePage(): JSX.Element {
    const [open, setOpen] = useState<boolean>(false);
    const [formData, setFormData] = useState<FormData>({
        description: '',
        count: ''
    });

    const { loading, error, data } = useSubscription<SubscriptionData>(SUB_DASHBOARD_PATIENTTRACKING);
    const [addPatientTracking, { loading: addLoading }] = useMutation<MutationResponse, MutationVariables>(
        ADD_PATIENT_TRACKING
    );

    const handleClickOpen = (): void => {
        setOpen(true);
    };

    const handleClose = (): void => {
        setOpen(false);
        setFormData({ description: '', count: '' });
    };

    const handleSubmit = async (): Promise<void> => {
        try {
            await addPatientTracking({
                variables: {
                    description: formData.description,
                    count: parseInt(formData.count, 10)
                }
            });
            handleClose();
        } catch (err) {
            console.error('Error adding record:', err);
        }
    };

    const formatDate = (dateString: string | Date): string => {
        const date = dateString instanceof Date ? dateString : new Date(dateString);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <CircularProgress />
            </div>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ margin: '2rem' }}>
                Error: {error.message}
            </Alert>
        );
    }

    return (
        <ProtectedRoute>
            <Card sx={{ margin: '2rem' }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5" component="h1">
                            Patient Tracking Dashboard
                        </Typography>
                        <Fab
                            color="primary"
                            aria-label="add"
                            onClick={handleClickOpen}
                            size="medium"
                        >
                            <AddIcon />
                        </Fab>
                    </Box>

                    <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                        <Table stickyHeader aria-label="patient tracking table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Count</TableCell>
                                    <TableCell>Created At</TableCell>
                                    <TableCell>Updated At</TableCell>
                                    <TableCell>Image Data</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data?.dashboard_patienttracking.map((item: PatientTrackingItem) => (
                                    <TableRow
                                        key={item.id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        hover
                                    >
                                        <TableCell>{item.id}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>{item.count}</TableCell>
                                        <TableCell>{formatDate(item.created_at)}</TableCell>
                                        <TableCell>{formatDate(item.updated_at)}</TableCell>
                                        <TableCell>
                                            {item.dashboard_imagedata && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {item.dashboard_imagedata.map((imgData: ImageData) => (
                                                        <div
                                                            key={imgData.id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            <Typography variant="caption">
                                                                ID: {imgData.id}
                                                            </Typography>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Add New Patient Tracking Record</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Description"
                        type="text"
                        fullWidth
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Count"
                        type="number"
                        fullWidth
                        value={formData.count}
                        onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.description || !formData.count || addLoading}
                    >
                        {addLoading ? 'Adding...' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </ProtectedRoute>
    );
}