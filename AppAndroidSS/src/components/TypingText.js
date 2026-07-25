import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

const TypingText = ({ text, style, delay = 0, speed = 100 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Wait for initial delay
    const delayTimeout = setTimeout(() => {
      if (currentIndex < text.length) {
        const typingTimeout = setTimeout(() => {
          setDisplayedText((prev) => prev + text[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        }, speed);
        return () => clearTimeout(typingTimeout);
      }
    }, delay);

    return () => clearTimeout(delayTimeout);
  }, [currentIndex, text, delay, speed]);

  return <Text style={style}>{displayedText}</Text>;
};

export default TypingText;
