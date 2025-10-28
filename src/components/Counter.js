import React, { useRef } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const Counter = () => {
  const counterRef = useRef(null);
  const valueRef = useRef(0);

  const updateValue = (newValue) => {
    valueRef.current = newValue;
    if (counterRef.current) {
      counterRef.current.setNativeProps({ text: String(newValue) });
    }
  };

  const increment = () => updateValue(valueRef.current + 1);
  const decrement = () => {
    if (valueRef.current > 0) updateValue(valueRef.current - 1);
  };

  return (
    <View style={styles.container}>
      <Button title="-" onPress={decrement} />
      <TextInput
        ref={counterRef}
        style={styles.input}
        defaultValue="0"
        editable={false}
      />
      <Button title="+" onPress={increment} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    textAlign: 'center',
    width: 60,
    height: 40,
    marginHorizontal: 10,
    fontSize: 18,
  },
});

export default Counter;
