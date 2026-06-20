import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Optometrist } from '@/types/optometrist';
import { optometristStatusLabels } from '@/data/optometrist';

interface OptometristCardProps {
  data: Optometrist;
  showWorkload?: boolean;
  workloadCurrent?: number;
  workloadMax?: number;
  onClick?: () => void;
}

const OptometristCard: React.FC<OptometristCardProps> = ({
  data,
  showWorkload = false,
  workloadCurrent,
  workloadMax,
  onClick
}) => {
  const statusInfo = optometristStatusLabels[data.status];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({ url: `/pages/optometrist-detail/index?id=${data.id}` });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <Image className={styles.avatar} src={data.avatar} mode='aspectFill' />
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{data.name}</Text>
            <View
              className={classnames(styles.statusBadge)}
              style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
            >
              {statusInfo.label}
            </View>
          </View>
          <Text className={styles.title}>{data.title}</Text>
          <Text className={styles.meta}>
            从业 {data.experience} 年 · 评分 {data.rating}
          </Text>
        </View>
      </View>

      <View className={styles.specialties}>
        {data.specialty.slice(0, 3).map((s, i) => (
          <Text key={i} className={styles.specialtyTag}>
            {s}
          </Text>
        ))}
      </View>

      {showWorkload && workloadMax !== undefined && (
        <View className={styles.workload}>
          <View className={styles.workloadHeader}>
            <Text className={styles.workloadLabel}>今日负载</Text>
            <Text className={styles.workloadValue}>
              {workloadCurrent ?? data.todayAppointments} / {workloadMax} 单
            </Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{
                width: `${Math.min(
                  ((workloadCurrent ?? data.todayAppointments) / workloadMax) * 100,
                  100
                )}%`
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default OptometristCard;
