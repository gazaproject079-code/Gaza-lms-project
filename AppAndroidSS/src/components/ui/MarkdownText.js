import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const MarkdownText = ({ children, style, textColor = '#000' }) => {
  if (!children) return null;

  const parseMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLang = '';
    let inTable = false;
    let tableRows = [];

    const flushTable = (keyPrefix) => {
      if (tableRows.length > 0) {
        elements.push(renderTable(tableRows, keyPrefix, textColor));
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, lineIndex) => {
      // Code block start/end
      if (line.startsWith('```')) {
        flushTable(`table-before-code-${lineIndex}`);
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <View key={`code-${lineIndex}`} style={styles.codeBlock}>
              {codeBlockLang && (
                <Text style={styles.codeLanguage}>{codeBlockLang}</Text>
              )}
              <Text style={styles.codeText}>{codeBlockContent.join('\n')}</Text>
            </View>
          );
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Check for table row (starts with |)
      if (line.trim().startsWith('|')) {
        // Check if it's a separator row (|---|---|---| or | --- | --- |)
        // Only contains |, -, :, and spaces
        if (line.match(/^[\|\s\-:]+$/) && line.includes('-')) {
          // Skip separator row but mark we're in a table
          inTable = true;
          return;
        }
        inTable = true;
        tableRows.push(line);
        return;
      }

      // If we were in a table but this line isn't a table row, flush the table
      if (inTable) {
        flushTable(`table-${lineIndex}`);
      }

      // Empty line
      if (line.trim() === '') {
        elements.push(<View key={`space-${lineIndex}`} style={styles.spacer} />);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <Text key={`h3-${lineIndex}`} style={[styles.h3, { color: textColor }]}>
            {parseInlineMarkdown(line.slice(4), textColor)}
          </Text>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <Text key={`h2-${lineIndex}`} style={[styles.h2, { color: textColor }]}>
            {parseInlineMarkdown(line.slice(3), textColor)}
          </Text>
        );
        return;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <Text key={`h1-${lineIndex}`} style={[styles.h1, { color: textColor }]}>
            {parseInlineMarkdown(line.slice(2), textColor)}
          </Text>
        );
        return;
      }

      // Bullet points
      if (line.match(/^[\*\-]\s/)) {
        elements.push(
          <View key={`bullet-${lineIndex}`} style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: textColor }]}>{'\u2022'}</Text>
            <Text style={[styles.bulletText, { color: textColor }]}>
              {parseInlineMarkdown(line.slice(2), textColor)}
            </Text>
          </View>
        );
        return;
      }

      // Numbered list
      const numberedMatch = line.match(/^(\d+)\.\s/);
      if (numberedMatch) {
        elements.push(
          <View key={`num-${lineIndex}`} style={styles.bulletRow}>
            <Text style={[styles.number, { color: textColor }]}>{numberedMatch[1]}.</Text>
            <Text style={[styles.bulletText, { color: textColor }]}>
              {parseInlineMarkdown(line.slice(numberedMatch[0].length), textColor)}
            </Text>
          </View>
        );
        return;
      }

      // Regular paragraph
      elements.push(
        <Text key={`p-${lineIndex}`} style={[styles.paragraph, { color: textColor }]}>
          {parseInlineMarkdown(line, textColor)}
        </Text>
      );
    });

    // Flush any remaining table
    flushTable('table-end');

    return elements;
  };

  const renderTable = (rows, keyPrefix, textColor) => {
    const parsedRows = rows.map(row => {
      // Split by | and filter empty strings
      const cells = row.split('|').filter(cell => cell.trim() !== '');
      return cells.map(cell => cell.trim());
    });

    if (parsedRows.length === 0) return null;

    const isHeader = (index) => index === 0;

    return (
      <ScrollView
        key={keyPrefix}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tableScrollView}
      >
        <View style={styles.table}>
          {parsedRows.map((row, rowIndex) => (
            <View
              key={`${keyPrefix}-row-${rowIndex}`}
              style={[
                styles.tableRow,
                isHeader(rowIndex) && styles.tableHeaderRow,
              ]}
            >
              {row.map((cell, cellIndex) => (
                <View
                  key={`${keyPrefix}-cell-${rowIndex}-${cellIndex}`}
                  style={[
                    styles.tableCell,
                    isHeader(rowIndex) && styles.tableHeaderCell,
                    cellIndex === 0 && styles.tableCellFirst,
                  ]}
                >
                  <Text
                    style={[
                      styles.tableCellText,
                      isHeader(rowIndex) && styles.tableHeaderText,
                      { color: textColor },
                    ]}
                  >
                    {parseInlineMarkdown(cell, textColor)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const parseInlineMarkdown = (text, textColor) => {
    const parts = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
      // Bold text **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Inline code `code`
      const codeMatch = remaining.match(/`([^`]+)`/);

      let firstMatch = null;
      let matchType = null;

      if (boldMatch && (!codeMatch || boldMatch.index < codeMatch.index)) {
        firstMatch = boldMatch;
        matchType = 'bold';
      } else if (codeMatch) {
        firstMatch = codeMatch;
        matchType = 'code';
      }

      if (firstMatch) {
        // Add text before match
        if (firstMatch.index > 0) {
          parts.push(
            <Text key={`text-${keyIndex++}`} style={{ color: textColor }}>
              {remaining.slice(0, firstMatch.index)}
            </Text>
          );
        }

        // Add matched element
        if (matchType === 'bold') {
          parts.push(
            <Text key={`bold-${keyIndex++}`} style={[styles.bold, { color: textColor }]}>
              {firstMatch[1]}
            </Text>
          );
        } else if (matchType === 'code') {
          parts.push(
            <Text key={`icode-${keyIndex++}`} style={styles.inlineCode}>
              {firstMatch[1]}
            </Text>
          );
        }

        remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
      } else {
        // No more matches, add remaining text
        parts.push(
          <Text key={`text-${keyIndex++}`} style={{ color: textColor }}>
            {remaining}
          </Text>
        );
        break;
      }
    }

    return parts.length > 0 ? parts : text;
  };

  return <View style={style}>{parseMarkdown(children)}</View>;
};

const styles = StyleSheet.create({
  h1: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    marginRight: 8,
  },
  number: {
    fontSize: 14,
    lineHeight: 22,
    marginRight: 8,
    minWidth: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  codeBlock: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  codeLanguage: {
    color: '#888',
    fontSize: 11,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  codeText: {
    color: '#d4d4d4',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  inlineCode: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    color: '#e91e63',
    fontFamily: 'monospace',
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  spacer: {
    height: 8,
  },
  // Table styles
  tableScrollView: {
    marginVertical: 8,
  },
  table: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  tableHeaderRow: {
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 100,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(128, 128, 128, 0.2)',
  },
  tableCellFirst: {
    borderLeftWidth: 0,
  },
  tableHeaderCell: {
    paddingVertical: 12,
  },
  tableCellText: {
    fontSize: 13,
    lineHeight: 18,
  },
  tableHeaderText: {
    fontWeight: '600',
  },
});

export default MarkdownText;
