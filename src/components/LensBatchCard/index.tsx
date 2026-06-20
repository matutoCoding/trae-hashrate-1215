import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { LensBatch } from '@/types/lens';
import { lensStatusLabels, lensTypeLabels } from '@/data/lens';
import classnames from 'classnames';

interface LensBatchCardProps {
  data: LensBatch;
  onClick?: () => void;
}

const LensBatchCard: React.FC<LensBatchCardProps> = ({ data, onClick }) => {
  const statusInfo = lensStatusLabels[data.status];
  const percentage =
    data.totalQuantity > 0 ? (data.remainingQuantity / data.totalQuantity) * 100 : 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({ url: `/pages/lens-detail/index?id=${data.id}` });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.batchInfo}>
          <Text className={styles.batchNo}>{data.batchNo}</Text>
        </View>
        <View
          className={styles.statusBadge}
          style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
        >
          {statusInfo.label}
        </View>
      </View>

      <View className={styles.productInfo}>
        <Text className={styles.brand}>{data.brand}</Text>
        <Text className={styles.model}>{data.model}</Text>
      </View>

      <View className={styles.params}>
        <View className={styles.paramItem}>
          <Text className={styles.paramLabel}>类型</Text>
          <Text className={styles.paramValue}>{lensTypeLabels[data.lensType]}</Text>
        </View>
        <View className={styles.paramItem}>
          <Text className={styles.paramLabel}>光度</Text>
          <Text className={styles.paramValue}>
            {data.sphere}
            {data.cylinder ? ` / ${data.cylinder}` : ''}
          </Text>
        </View>
        <View className={styles.paramItem}>
          <Text className={styles.paramLabel}>位置</Text>
          <Text className={styles.paramValue}>{data.location}</Text>
        </View>
      </View>

      <View className={styles.stockSection}>
        <View className={styles.stockHeader}>
          <Text className={styles.stockLabel}>库存</Text>
          <Text className={styles.stockValue}>
            <Text className={classnames(styles.remaining)}>{data.remainingQuantity}</Text>
            <Text className={styles.total}> / {data.totalQuantity} {data.unit}</Text>
          </Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={classnames(styles.progressFill, styles[data.status])}
            style={{ width: `${percentage}%` }}
          />
        </View>
      </View>

      <View className={styles.footer}>
        <Text className={styles.price}>¥{data.retailPrice}/{data.unit}</Text>
        <Text className={styles.date}>到期: {data.expiryDate}</Text>
      </View>
    </View>
  );
};

export default LensBatchCard;
