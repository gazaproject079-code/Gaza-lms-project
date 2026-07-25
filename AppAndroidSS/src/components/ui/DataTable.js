import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import AppCard from './AppCard';

// Section 15 - Tables
// Section 15.1 - Desktop Tables (1024px+)
// Section 15.2 - Mobile Adaptations (768px-)

const ORANGE = '#FF8C42';

const DataTable = ({
  columns = [],
  data = [],
  onRowPress,
  onSort,
  sortColumn,
  sortDirection,
  emptyMessage = 'No data available',
  style,
  headerStyle,
  rowStyle,
  cellStyle,
}) => {
  const { theme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  const styles = getStyles(theme, isDark, isWeb, onRowPress);

  const handleSort = (column) => {
    if (column.sortable && onSort) {
      const newDirection = sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(column.key, newDirection);
    }
  };

  if (data.length === 0) {
    return (
      <AppCard style={[styles.emptyContainer, style]}>
        <Icon name="document-outline" size={48} color={theme.colors.textTertiary} />
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {emptyMessage}
        </Text>
      </AppCard>
    );
  }

  return (
    <AppCard style={[styles.container, style]}>
      <ScrollView horizontal={!isWeb} showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.headerRow, headerStyle]}>
            {columns.map((column) => (
              <TouchableOpacity
                key={column.key}
                style={[
                  styles.headerCell,
                  { width: column.width || 'auto', flex: column.flex || 1 },
                ]}
                onPress={() => handleSort(column)}
                disabled={!column.sortable}
                activeOpacity={column.sortable ? 0.7 : 1}
              >
                <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
                  {column.title}
                </Text>
                {column.sortable && sortColumn === column.key && (
                  <Icon
                    name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                    size={14}
                    color={ORANGE}
                    style={styles.sortIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Data Rows */}
          {data.map((row, rowIndex) => (
            <TouchableOpacity
              key={row.id || rowIndex}
              style={[
                styles.dataRow,
                rowIndex < data.length - 1 && {
                  borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.06)',
                  borderBottomWidth: 1,
                },
                rowStyle,
              ]}
              onPress={() => onRowPress?.(row)}
              activeOpacity={onRowPress ? 0.7 : 1}
              disabled={!onRowPress}
            >
              {columns.map((column) => (
                <View
                  key={column.key}
                  style={[
                    styles.dataCell,
                    { width: column.width || 'auto', flex: column.flex || 1 },
                    cellStyle,
                  ]}
                >
                  {column.render ? (
                    column.render(row[column.key], row)
                  ) : (
                    <Text
                      style={[styles.cellText, { color: theme.colors.textPrimary }]}
                      numberOfLines={column.numberOfLines || 1}
                    >
                      {row[column.key]}
                    </Text>
                  )}
                </View>
              ))}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </AppCard>
  );
};

// Table Pagination Component
export const TablePagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 10,
  totalItems = 0,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const { theme, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';
  const styles = getStyles(theme, isDark, isWeb, null);

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <View style={[styles.paginationContainer, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)' }]}>
      <Text style={[styles.paginationInfo, { color: theme.colors.textSecondary }]}>
        Showing {startItem}-{endItem} of {totalItems}
      </Text>

      <View style={styles.paginationControls}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.paginationButtonDisabled,
          ]}
          onPress={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Icon
            name="chevron-back"
            size={18}
            color={currentPage === 1 ? theme.colors.textTertiary : theme.colors.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.pageNumbers}>
          {[...Array(Math.min(5, totalPages))].map((_, index) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = index + 1;
            } else if (currentPage <= 3) {
              pageNum = index + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + index;
            } else {
              pageNum = currentPage - 2 + index;
            }

            return (
              <TouchableOpacity
                key={pageNum}
                style={[
                  styles.pageNumber,
                  currentPage === pageNum && {
                    backgroundColor: ORANGE,
                  },
                ]}
                onPress={() => onPageChange?.(pageNum)}
              >
                <Text
                  style={[
                    styles.pageNumberText,
                    {
                      color: currentPage === pageNum ? '#FFFFFF' : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {pageNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.paginationButtonDisabled,
          ]}
          onPress={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Icon
            name="chevron-forward"
            size={18}
            color={currentPage === totalPages ? theme.colors.textTertiary : theme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (theme, isDark, isWeb, onRowPress) =>
  StyleSheet.create({
    container: {
      padding: 0,
      overflow: 'hidden',
    },
    table: {
      minWidth: '100%',
    },
    headerRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.08)',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(26,26,46,0.03)',
    },
    headerCell: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    headerText: {
      fontSize: 12, // Section 15.1: Header row 12px uppercase
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sortIcon: {
      marginLeft: 4,
    },
    dataRow: {
      flexDirection: 'row',
      paddingVertical: 14, // Section 15.1: Rows 48-56px height
      paddingHorizontal: 16,
      alignItems: 'center',
      ...(isWeb ? { transition: 'background-color 0.15s ease', cursor: onRowPress ? 'pointer' : 'default' } : {}),
    },
    dataCell: {
      paddingHorizontal: 8,
    },
    cellText: {
      fontSize: 14,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 14,
    },

    // Pagination
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
    },
    paginationInfo: {
      fontSize: 13,
    },
    paginationControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    paginationButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,46,0.05)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,46,0.08)',
    },
    paginationButtonDisabled: {
      opacity: 0.5,
    },
    pageNumbers: {
      flexDirection: 'row',
      gap: 4,
    },
    pageNumber: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pageNumberText: {
      fontSize: 13,
      fontWeight: '500',
    },
  });

export default DataTable;
