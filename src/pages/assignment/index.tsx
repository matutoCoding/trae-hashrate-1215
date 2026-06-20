import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import OptometristCard from '@/components/OptometristCard';
import StatCard from '@/components/StatCard';
import assignmentService from '@/services/assignment';
import { getWeekDates, generateTimeSlots } from '@/utils';

const AssignmentPage: React.FC = () => {
  const { optometrists, appointments, selectedDate } = useAppStore();

  const weekDates = useMemo(() => getWeekDates(), []);
  const timeSlots = useMemo(() => generateTimeSlots(9, 18, 30), []);

  const workloadStats = useMemo(() => {
    return assignmentService.getWorkloadStats(optometrists, appointments, selectedDate);
  }, [optometrists, appointments, selectedDate]);

  const availableOptometrists = optometrists.filter((o) => o.status === 'available');
  const busyOptometrists = optometrists.filter((o) => o.status === 'busy');
  const avgUtilization =
    workloadStats.length > 0
      ? Math.round(workloadStats.reduce((sum, s) => sum + s.utilization, 0) / workloadStats.length)
      : 0;
  const todayAppointments = appointments.filter((a) => a.date === selectedDate && a.status !== 'cancelled').length;

  const fragmentationAnalysis = useMemo(() => {
    const data = workloadStats.map((stats) => {
      const freeSlots = assignmentService.getOptometristFreeSlots(
        stats.optometrist,
        appointments,
        selectedDate,
        timeSlots
      );

      const freeCount = freeSlots.filter((s) => s.available).length;
      let fragments = 0;
      let inFragment = false;

      for (let i = 0; i < freeSlots.length; i++) {
        if (freeSlots[i].available) {
          if (!inFragment) {
            inFragment = true;
            let len = 1;
            for (let j = i + 1; j < freeSlots.length && freeSlots[j].available; j++) {
              len++;
            }
            if (len === 1) fragments++;
          }
        } else {
          inFragment = false;
        }
      }

      return {
        ...stats,
        freeSlots: freeCount,
        fragments
      };
    });

    const totalFragments = data.reduce((sum, d) => sum + d.fragments, 0);
    const totalFree = data.reduce((sum, d) => sum + d.freeSlots, 0);

    return {
      data,
      totalFragments,
      totalFree,
      fragmentationRate: totalFree > 0 ? Math.round((totalFragments / totalFree) * 100) : 0
    };
  }, [workloadStats, appointments, selectedDate, timeSlots]);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>自动分配</Text>
        <Text className={styles.headerSub}>智能调度·负载均衡</Text>
      </View>

      <ScrollView scrollX className={styles.statsScroll}>
        <View className={styles.statsRow}>
          <StatCard
            title='空闲验光师'
            value={availableOptometrists.length}
            unit='人'
            iconText='✅'
            trend='可立即分配'
            trendColor='success'
          />
          <StatCard
            title='忙碌中'
            value={busyOptometrists.length}
            unit='人'
            iconText='⏳'
          />
          <StatCard
            title='平均利用率'
            value={avgUtilization}
            unit='%'
            iconText='📊'
            trend={avgUtilization < 50 ? '资源充足' : avgUtilization < 80 ? '负载适中' : '负载较高'}
            trendColor={avgUtilization < 50 ? 'success' : avgUtilization < 80 ? 'info' : 'warning'}
          />
          <StatCard
            title='碎片时段'
            value={fragmentationAnalysis.totalFragments}
            unit='个'
            iconText='🧩'
            trend={`碎片率 ${fragmentationAnalysis.fragmentationRate}%`}
            trendColor={fragmentationAnalysis.fragmentationRate < 15 ? 'success' : 'warning'}
          />
        </View>
      </ScrollView>

      <Text className={styles.sectionTitle}>负载均衡概览</Text>
      <View className={styles.workloadContainer}>
        {fragmentationAnalysis.data.map((item) => (
          <View key={item.optometrist.id} className={styles.workloadItem}>
            <View className={styles.workloadHeader}>
              <Text className={styles.workloadName}>{item.optometrist.name}</Text>
              <View className={styles.workloadBadges}>
                {item.fragments > 0 && (
                  <View className={styles.fragmentBadge}>
                    <Text>{item.fragments}个碎片</Text>
                  </View>
                )}
                <View
                  className={classnames(
                    styles.utilizationBadge,
                    item.utilization >= 80 ? styles.highLoad : item.utilization >= 50 ? styles.midLoad : styles.lowLoad
                  )}
                >
                  <Text>{item.utilization}%</Text>
                </View>
              </View>
            </View>
            <View className={styles.workloadBar}>
              <View
                className={classnames(
                  styles.workloadFill,
                  item.utilization >= 80 ? styles.highLoad : item.utilization >= 50 ? styles.midLoad : styles.lowLoad
                )}
                style={{ width: `${Math.min(item.utilization, 100)}%` }}
              />
            </View>
            <View className={styles.workloadFooter}>
              <Text className={styles.workloadText}>
                已排 {item.current} / {item.max} 单
              </Text>
              <Text className={styles.workloadText}>空闲 {item.freeSlots} 个时段</Text>
            </View>
          </View>
        ))}
      </View>

      <Text className={styles.sectionTitle}>空闲验光师池</Text>
      <View>
        {availableOptometrists.length > 0 ? (
          availableOptometrists.map((opt) => {
            const stats = workloadStats.find((s) => s.optometrist.id === opt.id);
            return (
              <OptometristCard
                key={opt.id}
                data={opt}
                showWorkload
                workloadCurrent={stats?.current}
                workloadMax={stats?.max}
              />
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无空闲验光师</Text>
          </View>
        )}
      </View>

      {busyOptometrists.length > 0 && (
        <>
          <Text className={styles.sectionTitle}>忙碌中</Text>
          <View>
            {busyOptometrists.map((opt) => {
              const stats = workloadStats.find((s) => s.optometrist.id === opt.id);
              return (
                <OptometristCard
                  key={opt.id}
                  data={opt}
                  showWorkload
                  workloadCurrent={stats?.current}
                  workloadMax={stats?.max}
                />
              );
            })}
          </View>
        </>
      )}

      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>💡 智能分配规则</Text>
        <View className={styles.tipList}>
          <Text className={styles.tipItem}>• 优先选择负载较轻的验光师</Text>
          <Text className={styles.tipItem}>• 自动填补时间碎片，提升利用率</Text>
          <Text className={styles.tipItem}>• 综合考虑评分、经验等因素</Text>
          <Text className={styles.tipItem}>• 确保验光师工作时段内分配</Text>
        </View>
      </View>
    </View>
  );
};

export default AssignmentPage;
