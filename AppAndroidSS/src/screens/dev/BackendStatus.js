import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import apiClient from '../../services/apiClient';

const BackendStatus = ({ navigation }) => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const check = async () => {
    try {
      setError(null);
      const res = await apiClient.health();
      setStatus(res);
    } catch (err) {
      setError(err.message || 'Error');
      setStatus(null);
    }
  };

  useEffect(() => {
    check();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Status</Text>
      {status ? (
        <Text style={styles.ok}>Status: {JSON.stringify(status)}</Text>
      ) : (
        <Text style={styles.err}>Error: {error || 'No response'}</Text>
      )}
      <View style={{ marginTop: 16 }}>
        <Button title="Recheck" onPress={check} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  ok: { color: 'green' },
  err: { color: 'red' },
});

export default BackendStatus;
