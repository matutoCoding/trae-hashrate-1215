import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { DeliveryRecord } from '@/types/delivery';
import { deliveryStatusLabels } from '@/data/delivery';

interface DeliveryCardProps {
  data: DeliveryRecord;
  onClick?: () => void;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({ data, onClick }) => {
  const statusInfo = deliveryStatusLabels[data.status];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({ url: `/pages/delivery-detail/index?id=${data.id}` });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.headerLeft}>
          <Text className={styles.deliveryNo}>{data.deliveryNo}</Text>
          <Text className={styles.date}>{data.deliveryDate}</Text>
        </View>
        <View
          className={styles.statusBadge}
          style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
        >
          {statusInfo.label}
        </View>
      </View>

      <View className={styles.customerInfo}>
        <Text className={styles.customerName}>{data.customerName}</Text>
        <Text className={styles.customerPhone}>{data.customerPhone}</Text>
      </View>

      <View className={styles.itemsList}>
        {data.items.map((item) => (
          <View key={item.id} className={styles.itemRow}>
            <View className={styles.itemInfo}>
            <Text className={styles.itemBrand}>{item.brand}</Text>
            <Text className={styles.itemModel}>{item.model}</Text>
          </View>
          <View className={styles.itemRight}>
            <Text className={styles.itemQty}>x{item.quantity}片</Text>
            <Text className={styles.itemPrice}>¥{item.unitPrice}/片</Text>
          </View>
        </View>
        ))}
      </View>

      <View className={styles.paramsRow}>
        <View className={styles.param}>
          <Text className={styles.paramLabel}>瞳距 PD</Text>
          <Text className={styles.paramValue}>{data.prescription.pd}mm</Text>
        </View>
        <View className={styles.param}>
          <Text className={styles.paramLabel}>左眼</Text>
          <Text className={styles.paramValue}>{data.prescription.leftEye.sphere}</Text>
        </View>
        <View className={styles.param}>
          <Text className={styles.paramLabel}>右眼</Text>
          <Text className={styles.paramValue}>{data.prescription.rightEye.sphere}</Text>
        </View>
      </View>

      <View className={styles.footer}>
        <Text className={styles.optometrist}>验光师: {data.optometristName || '-'}</Text>
        <Text className={styles.total}>合计: <Text className={styles.totalAmount}>¥{data.totalAmount}</Text></Text>
      </View>
    </View>
  );
};

export default DeliveryCard;
