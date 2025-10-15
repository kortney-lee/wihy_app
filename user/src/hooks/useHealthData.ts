import { useEffect, useState } from 'react';
import { fetchHealthData } from '../services/api';
import { HealthData } from '../types';

const useHealthData = () => {
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getData = async () => {
            try {
                // Pass a default userId or get it from context/props
                const result = await fetchHealthData('default-user-id');
                setData(result as HealthData);
            } catch (err) {
                setError('Failed to fetch health data');
            } finally {
                setLoading(false);
            }
        };

        getData();
    }, []);

    return { data, loading, error };
};

export default useHealthData;