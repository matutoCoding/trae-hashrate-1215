import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: string;
  trendColor?: 'success' | 'warning' | 'error' | 'info';
  iconBg?: string;
  iconColor?: string;
  iconText?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  trend,
  trendColor = 'info',
  iconBg = '#E0F2FE',
  iconColor = '#0EA5E9',
  iconText
}) => {
  return (
    <View className={styles.card}>
      <View className={styles.cardHeader}>
        <Text className={styles.title}>{title}</Text>
        {iconText && (
          <View
            className={styles.iconBadge}
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            {iconText}
          </View>
        )}
      </View>
      <View className={styles.cardBody}>
        <Text className={styles.value}>{value}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
      {trend && (
        <View className={classnames(styles.trend, styles[`trend${trendColor}`])}>
          {trend}
        </View>
      )}
    </View>
  );
};

export default StatCard;
