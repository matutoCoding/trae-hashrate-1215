import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import LensBatchCard from '@/components/LensBatchCard';
import StatCard from '@/components/StatCard';
import { lensStatusLabels, lensTypeLabels } from '@/data/lens';
import type { LensType, LensStatus } from '@/types/lens';

const LensPage: React.FC = () => {
  const { lensBatches, splitRecords } = useAppStore();

  const [activeTab, setActiveTab] = useState<LensStatus | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [splitQuantity, setSplitQuantity] = useState('');
  const [splitRemark, setSplitRemark] = useState('');
  const [showBatchSplits, setShowBatchSplits] = useState<string | null>(null);

  const totalBatches = lensBatches.length;
  const totalStock = lensBatches.reduce((sum, b) => sum + b.remainingQuantity, 0);
  const lowStockCount = lensBatches.filter((b) => b.status === 'low-stock').length;
  const outOfStockCount = lensBatches.filter((b) => b.status === 'out-of-stock').length;

  const filteredBatches = useMemo(() => {
    return lensBatches.filter((b) => {
      if (activeTab !== 'all' && b.status !== activeTab) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        return (
          b.brand.toLowerCase().includes(kw) ||
          b.model.toLowerCase().includes(kw) ||
          b.batchNo.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [lensBatches, activeTab, searchKeyword]);

  const batchSplitRecords = useMemo(() => {
    if (!showBatchSplits) return [];
    return splitRecords
      .filter((r) => r.batchId === showBatchSplits)
      .sort((a, b) => b.splitDate.localeCompare(a.splitDate));
  }, [showBatchSplits, splitRecords]);

  const handleOpenSplit = (batch: any) => {
    if (batch.remainingQuantity === 0) {
      Taro.showToast({ title: '库存不足', icon: 'none' });
      return;
    }
    setSelectedBatch(batch);
    setSplitQuantity('');
    setSplitRemark('');
    setShowSplitModal(true);
  };

  const handleConfirmSplit = () => {
    const qty = parseInt(splitQuantity, 10);
    if (!qty || qty <= 0) {
      Taro.showToast({ title: '请输入有效数量', icon: 'none' });
      return;
    }
    if (qty > selectedBatch.remainingQuantity) {
      Taro.showToast({ title: '数量超过库存', icon: 'none' });
      return;
    }

    const success = useAppStore.getState().splitLensBatch(
      selectedBatch.id,
      qty,
      '管理员',
      splitRemark || undefined
    );

    if (success) {
      Taro.showToast({ title: '拆分成功', icon: 'success' });
      setShowSplitModal(false);
    } else {
      Taro.showToast({ title: '拆分失败', icon: 'none' });
    }
  };

  const tabs: { key: LensStatus | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'in-stock', label: '充足' },
    { key: 'low-stock', label: '库存低' },
    { key: 'out-of-stock', label: '缺货' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>镜片批次</Text>
        <Text className={styles.headerSub}>批次管理·库存追踪</Text>
      </View>

      <ScrollView scrollX className={styles.statsScroll}>
        <View className={styles.statsRow}>
          <StatCard title='批次总数' value={totalBatches} unit='个' iconText='📦' />
          <StatCard
            title='库存总量'
            value={totalStock}
            unit='片'
            iconText='🔍'
            trend='实时追踪'
            trendColor='info'
          />
          <StatCard
            title='库存预警'
            value={lowStockCount}
            unit='个'
            iconText='⚠️'
            trend='需及时补货'
            trendColor={lowStockCount > 0 ? 'warning' : 'success'}
          />
          <StatCard
            title='缺货批次'
            value={outOfStockCount}
            unit='个'
            iconText='❌'
            trendColor={outOfStockCount > 0 ? 'error' : 'success'}
          />
        </View>
      </ScrollView>

      <View className={styles.searchRow}>
        <Input
          className={styles.searchInput}
          placeholder='搜索品牌/型号/批次号'
          value={searchKeyword}
          onInput={(e) => setSearchKeyword(e.detail.value)}
        />
      </View>

      <ScrollView scrollX className={styles.tabScroll}>
        <View className={styles.tabRow}>
          {tabs.map((tab) => (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, {
                [styles.tabActive]: activeTab === tab.key
              })}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </View>
          ))}
        </View>
      </ScrollView>

      <View className={styles.listContainer}>
        {filteredBatches.length > 0 ? (
          filteredBatches.map((batch) => (
            <View key={batch.id}>
              <LensBatchCard
                data={batch}
                onClick={() => setShowBatchSplits(showBatchSplits === batch.id ? null : batch.id)}
              />
              {showBatchSplits === batch.id && batchSplitRecords.length > 0 && (
                <View className={styles.splitHistory}>
                  <Text className={styles.splitHistoryTitle}>拆分记录</Text>
                  {batchSplitRecords.map((record) => (
                    <View key={record.id} className={styles.splitItem}>
                      <View className={styles.splitItemLeft}>
                        <Text className={styles.splitDate}>{record.splitDate}</Text>
                        <Text className={styles.splitOperator}>操作人: {record.operator}</Text>
                      </View>
                      <View className={styles.splitItemRight}>
                        <Text className={styles.splitQty}>-{record.splitQuantity}片</Text>
                        <Text className={styles.splitRemaining}>剩{record.remainingAfterSplit}片</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {batch.status !== 'out-of-stock' && (
                <Button
                  className={styles.splitButton}
                  onClick={() => handleOpenSplit(batch)}
                >
                  拆分出库
                </Button>
              )}
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🔍</Text>
            <Text className={styles.emptyText}>暂无匹配的批次</Text>
          </View>
        )}
      </View>

      {showSplitModal && selectedBatch && (
        <View className={styles.modalOverlay} onClick={() => setShowSplitModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>拆分出库</Text>

            <View className={styles.batchInfoCard}>
              <Text className={styles.batchName}>{selectedBatch.brand} {selectedBatch.model}</Text>
              <Text className={styles.batchNo}>{selectedBatch.batchNo}</Text>
              <Text className={styles.batchStock}>
                当前库存: <Text className={styles.stockHighlight}>{selectedBatch.remainingQuantity}</Text> 片
              </Text>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>拆分数量</Text>
              <Input
                className={styles.formInput}
                type='number'
                placeholder='请输入数量'
                value={splitQuantity}
                onInput={(e) => setSplitQuantity(e.detail.value)}
              />
              <Text className={styles.formHint}>最多可拆分 {selectedBatch.remainingQuantity} 片</Text>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>备注</Text>
              <Input
                className={styles.formInput}
                placeholder='选填，如：配镜订单号等'
                value={splitRemark}
                onInput={(e) => setSplitRemark(e.detail.value)}
              />
            </View>

            <View className={styles.quickQty}>
              <Text className={styles.quickLabel}>快捷选择:</Text>
              {[1, 2, 5, 10].map((n) => (
                <View
                  key={n}
                  className={classnames(styles.quickBtn, {
                    [styles.quickActive]: parseInt(splitQuantity, 10) === n
                  })}
                  onClick={() => n <= selectedBatch.remainingQuantity && setSplitQuantity(String(n))}
                >
                  {n}片
                </View>
              ))}
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={() => setShowSplitModal(false)}>
                取消
              </Button>
              <Button className={styles.confirmBtn} onClick={handleConfirmSplit}>
                确认拆分
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default LensPage;
