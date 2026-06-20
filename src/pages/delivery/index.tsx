import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import DeliveryCard from '@/components/DeliveryCard';
import StatCard from '@/components/StatCard';
import { lensTypeLabels } from '@/data/lens';
import type { DeliveryStatus } from '@/types/delivery';
import type { LensBatch } from '@/types/lens';
import { getTodayDate } from '@/utils';

const DeliveryPage: React.FC = () => {
  const { deliveries, lensBatches, optometrists, createDeliveryWithStock, previewDeliveryWithStock } = useAppStore();
  const [activeTab, setActiveTab] = useState<DeliveryStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    optometristId: '',
    leftSphere: '',
    leftCylinder: '',
    leftAxis: '',
    rightSphere: '',
    rightCylinder: '',
    rightAxis: '',
    pd: '',
    pdLeft: '',
    pdRight: '',
    selectedItems: [] as Array<{ batchId: string; quantity: number; eye: 'left' | 'right' | 'both' }>
  });

  const totalDeliveries = deliveries.length;
  const completedCount = deliveries.filter((d) => d.status === 'completed').length;
  const processingCount = deliveries.filter((d) => d.status === 'processing').length;
  const todayDeliveries = deliveries.filter((d) => d.deliveryDate === getTodayDate()).length;
  const totalRevenue = deliveries
    .filter((d) => d.status === 'completed')
    .reduce((sum, d) => sum + d.totalAmount, 0);

  const inStockBatches = useMemo(() => {
    return lensBatches.filter((b) => b.status !== 'out-of-stock' && b.remainingQuantity > 0);
  }, [lensBatches]);

  const filteredDeliveries = useMemo(() => {
    return deliveries
      .filter((d) => (activeTab === 'all' ? true : d.status === activeTab))
      .sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate));
  }, [deliveries, activeTab]);

  // 计算去向分布
  const distributionStats = useMemo(() => {
    const brandCount: Record<string, number> = {};
    const typeCount: Record<string, number> = {};
    let totalPieces = 0;

    deliveries.forEach((d) => {
      d.items.forEach((item) => {
        brandCount[item.brand] = (brandCount[item.brand] || 0) + item.quantity;
        typeCount[item.lensType] = (typeCount[item.lensType] || 0) + item.quantity;
        totalPieces += item.quantity;
      });
    });

    const brandDistribution = Object.entries(brandCount)
      .map(([brand, count]) => ({
        brand,
        count,
        percentage: totalPieces > 0 ? Math.round((count / totalPieces) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const typeDistribution = Object.entries(typeCount)
      .map(([type, count]) => ({
        type: lensTypeLabels[type] || type,
        count,
        percentage: totalPieces > 0 ? Math.round((count / totalPieces) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return { brandDistribution, typeDistribution, totalPieces };
  }, [deliveries]);

  const tabs = [
    { key: 'all' as const, label: '全部' },
    { key: 'pending' as const, label: '待处理' },
    { key: 'processing' as const, label: '加工中' },
    { key: 'completed' as const, label: '已完成' }
  ];

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    if (inStockBatches.length === 0) {
      Taro.showToast({ title: '无可用镜片批次', icon: 'none' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      selectedItems: [...prev.selectedItems, { batchId: inStockBatches[0].id, quantity: 1, eye: 'both' }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const items = [...prev.selectedItems];
      let finalValue = value;

      // 数量输入校验：必须是正整数（>= 1）
      if (field === 'quantity') {
        const parsed = parseInt(String(value), 10);
        // 空值、NaN、0、负数 → 自动恢复为 1
        if (!value || isNaN(parsed) || parsed <= 0) {
          finalValue = 1;
          Taro.showToast({ title: '数量至少为1', icon: 'none' });
        } else {
          finalValue = parsed;
        }
      }

      items[index] = { ...items[index], [field]: finalValue };
      return { ...prev, selectedItems: items };
    });
  };

  const handleConfirmCreate = () => {
    if (!formData.customerName || !formData.customerPhone) {
      Taro.showToast({ title: '请填写顾客信息', icon: 'none' });
      return;
    }
    if (formData.selectedItems.length === 0) {
      Taro.showToast({ title: '请添加镜片', icon: 'none' });
      return;
    }
    if (!formData.pd) {
      Taro.showToast({ title: '请填写瞳距', icon: 'none' });
      return;
    }

    const previewResult = previewDeliveryWithStock({
      items: formData.selectedItems
    });

    if (!previewResult.success) {
      Taro.showModal({
        title: '出库校验失败',
        content: previewResult.message || '请检查库存后重试',
        showCancel: false
      });
      return;
    }

    setPreviewData(previewResult.preview);
    setShowPreviewModal(true);
  };

  const handleConfirmWithPreview = () => {
    const optometrist = optometrists.find((o) => o.id === formData.optometristId);

    const result = createDeliveryWithStock({
      delivery: {
        deliveryNo: `DL${Date.now().toString().slice(-8)}`,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        deliveryDate: getTodayDate(),
        status: 'pending',
        optometristName: optometrist?.name,
        prescription: {
          leftEye: {
            sphere: formData.leftSphere || 'PL',
            cylinder: formData.leftCylinder || undefined,
            axis: formData.leftAxis || undefined
          },
          rightEye: {
            sphere: formData.rightSphere || 'PL',
            cylinder: formData.rightCylinder || undefined,
            axis: formData.rightAxis || undefined
          },
          pd: parseFloat(formData.pd),
          pdLeft: formData.pdLeft ? parseFloat(formData.pdLeft) : undefined,
          pdRight: formData.pdRight ? parseFloat(formData.pdRight) : undefined
        },
        paymentMethod: '待支付'
      },
      items: formData.selectedItems
    });

    if (!result.success) {
      Taro.showModal({
        title: '出库失败',
        content: result.message || '请检查库存后重试',
        showCancel: false
      });
      return;
    }

    Taro.showToast({ title: '创建成功', icon: 'success' });
    setShowCreateModal(false);
    setShowPreviewModal(false);
    setPreviewData(null);
    setFormData({
      customerName: '',
      customerPhone: '',
      optometristId: '',
      leftSphere: '',
      leftCylinder: '',
      leftAxis: '',
      rightSphere: '',
      rightCylinder: '',
      rightAxis: '',
      pd: '',
      pdLeft: '',
      pdRight: '',
      selectedItems: []
    });
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewData(null);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>拆分出库</Text>
        <Text className={styles.headerSub}>批次拆分·去向追踪</Text>
      </View>

      <ScrollView scrollX className={styles.statsScroll}>
        <View className={styles.statsRow}>
          <StatCard title='今日出库' value={todayDeliveries} unit='单' iconText='📦' />
          <StatCard title='累计出库' value={totalDeliveries} unit='单' iconText='📋' />
          <StatCard title='加工中' value={processingCount} unit='单' iconText='⚙️' />
          <StatCard
            title='已完成营收'
            value={totalRevenue >= 10000 ? (totalRevenue / 10000).toFixed(1) + '万' : totalRevenue}
            unit='元'
            iconText='💰'
            trendColor='success'
          />
        </View>
      </ScrollView>

      {/* 去向分布 */}
      <View className={styles.distributionCard}>
        <Text className={styles.sectionTitleInline}>镜片去向分布</Text>
        <View className={styles.distributionSection}>
          <Text className={styles.distributionLabel}>品牌分布（共{distributionStats.totalPieces}片）</Text>
          {distributionStats.brandDistribution.map((item) => (
            <View key={item.brand} className={styles.distributionRow}>
              <View className={styles.distributionInfo}>
                <Text className={styles.distributionName}>{item.brand}</Text>
                <Text className={styles.distributionCount}>{item.count}片</Text>
              </View>
              <View className={styles.distributionBar}>
                <View
                  className={styles.distributionFill}
                  style={{ width: `${item.percentage}%` }}
                />
                <Text className={styles.distributionPct}>{item.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>

        <View className={styles.distributionSection}>
          <Text className={styles.distributionLabel}>类型分布</Text>
          <View className={styles.typeTags}>
            {distributionStats.typeDistribution.map((item) => (
              <View key={item.type} className={styles.typeTag}>
                <Text className={styles.typeTagName}>{item.type}</Text>
                <Text className={styles.typeTagCount}>{item.count}片 · {item.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.actionRow}>
        <Button className={styles.createBtn} onClick={() => setShowCreateModal(true)}>
          + 新建出库单
        </Button>
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
        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map((d) => <DeliveryCard key={d.id} data={d} />)
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无出库记录</Text>
          </View>
        )}
      </View>

      {showCreateModal && (
        <View className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <ScrollView className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>新建出库单</Text>

            <Text className={styles.formSectionTitle}>顾客信息</Text>
            <View className={styles.formRow}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>姓名</Text>
                <Input
                  className={styles.formInput}
                  placeholder='顾客姓名'
                  value={formData.customerName}
                  onInput={(e) => updateField('customerName', e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>电话</Text>
                <Input
                  className={styles.formInput}
                  type='number'
                  placeholder='联系电话'
                  value={formData.customerPhone}
                  onInput={(e) => updateField('customerPhone', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>验光师</Text>
              <Picker
                mode='selector'
                range={optometrists.map((o) => o.name)}
                onChange={(e) => updateField('optometristId', optometrists[e.detail.value].id)}
              >
                <View className={styles.formPicker}>
                  {formData.optometristId
                    ? optometrists.find((o) => o.id === formData.optometristId)?.name
                    : '请选择验光师'}
                </View>
              </Picker>
            </View>

            <Text className={styles.formSectionTitle}>验光参数（瞳距留档）</Text>
            <View className={styles.eyeSection}>
              <View className={styles.eyeColumn}>
                <Text className={styles.eyeTitle}>左眼 OS</Text>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>球镜 SPH</Text>
                  <Input
                    className={styles.formInput}
                    placeholder='如: -2.00'
                    value={formData.leftSphere}
                    onInput={(e) => updateField('leftSphere', e.detail.value)}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>柱镜 CYL</Text>
                  <Input
                    className={styles.formInput}
                    placeholder='如: -0.50'
                    value={formData.leftCylinder}
                    onInput={(e) => updateField('leftCylinder', e.detail.value)}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>轴位 AX</Text>
                  <Input
                    className={styles.formInput}
                    placeholder='如: 180'
                    value={formData.leftAxis}
                    onInput={(e) => updateField('leftAxis', e.detail.value)}
                  />
                </View>
              </View>
              <View className={styles.eyeDivider} />
              <View className={styles.eyeColumn}>
                <Text className={styles.eyeTitle}>右眼 OD</Text>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>球镜 SPH</Text>
                  <Input
                    className={styles.formInput}
                    placeholder='如: -1.75'
                    value={formData.rightSphere}
                    onInput={(e) => updateField('rightSphere', e.detail.value)}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>柱镜 CYL</Text>
                  <Input
                    className={styles.formInput}
                    placeholder='如: -0.50'
                    value={formData.rightCylinder}
                    onInput={(e) => updateField('rightCylinder', e.detail.value)}
                  />
                </View>
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>轴位 AX</Text>
                  <Input
                    className={styles.formInput}
                    placeholder='如: 90'
                    value={formData.rightAxis}
                    onInput={(e) => updateField('rightAxis', e.detail.value)}
                  />
                </View>
              </View>
            </View>

            <View className={styles.formRow}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>瞳距 PD(mm)</Text>
                <Input
                  className={styles.formInput}
                  type='digit'
                  placeholder='如: 62'
                  value={formData.pd}
                  onInput={(e) => updateField('pd', e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>左瞳距</Text>
                <Input
                  className={styles.formInput}
                  type='digit'
                  placeholder='选填'
                  value={formData.pdLeft}
                  onInput={(e) => updateField('pdLeft', e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>右瞳距</Text>
                <Input
                  className={styles.formInput}
                  type='digit'
                  placeholder='选填'
                  value={formData.pdRight}
                  onInput={(e) => updateField('pdRight', e.detail.value)}
                />
              </View>
            </View>

            <Text className={styles.formSectionTitle}>镜片选择（多批次拆分）</Text>
            {formData.selectedItems.map((item, idx) => {
              const batch = lensBatches.find((b) => b.id === item.batchId);
              return (
                <View key={idx} className={styles.itemCard}>
                  <View className={styles.itemHeader}>
                    <Text className={styles.itemTitle}>镜片 {idx + 1}</Text>
                    <Text className={styles.itemRemove} onClick={() => handleRemoveItem(idx)}>
                      删除
                    </Text>
                  </View>
                  <View className={styles.formItem}>
                    <Text className={styles.formLabel}>选择批次</Text>
                    <Picker
                      mode='selector'
                      range={inStockBatches.map((b) => `${b.brand} ${b.model} (${b.batchNo}) 剩${b.remainingQuantity}片`)}
                      onChange={(e) => handleUpdateItem(idx, 'batchId', inStockBatches[e.detail.value].id)}
                    >
                      <View className={styles.formPicker}>
                        {batch ? `${batch.brand} ${batch.model}` : '请选择批次'}
                      </View>
                    </Picker>
                  </View>
                  <View className={styles.formRow}>
                    <View className={styles.formItem}>
                      <Text className={styles.formLabel}>数量</Text>
                      <Input
                        className={styles.formInput}
                        type='number'
                        placeholder='1'
                        value={String(item.quantity)}
                        onInput={(e) => handleUpdateItem(idx, 'quantity', parseInt(e.detail.value) || 1)}
                      />
                    </View>
                    <View className={styles.formItem}>
                      <Text className={styles.formLabel}>适用眼</Text>
                      <Picker
                        mode='selector'
                        range={['双眼', '左眼', '右眼']}
                        rangeKey=''
                        onChange={(e) => {
                          const eyes: Array<'both' | 'left' | 'right'> = ['both', 'left', 'right'];
                          handleUpdateItem(idx, 'eye', eyes[e.detail.value]);
                        }}
                      >
                        <View className={styles.formPicker}>
                          {item.eye === 'both' ? '双眼' : item.eye === 'left' ? '左眼' : '右眼'}
                        </View>
                      </Picker>
                    </View>
                  </View>
                </View>
              );
            })}
            <Button className={styles.addItemBtn} onClick={handleAddItem}>
              + 添加镜片
            </Button>

            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>
                取消
              </Button>
              <Button className={styles.confirmBtn} onClick={handleConfirmCreate}>
                预览汇总
              </Button>
            </View>
          </ScrollView>
        </View>
      )}

      {showPreviewModal && previewData && (
        <View className={styles.modalOverlay} onClick={handleClosePreview}>
          <ScrollView className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>出库汇总预览</Text>

            <View className={styles.previewSummary}>
              <View className={styles.previewSummaryItem}>
                <Text className={styles.previewSummaryLabel}>出库镜片</Text>
                <Text className={styles.previewSummaryValue}>{previewData.items.length} 个批次</Text>
              </View>
              <View className={styles.previewSummaryItem}>
                <Text className={styles.previewSummaryLabel}>总片数</Text>
                <Text className={styles.previewSummaryValue}>{Number(previewData.totalPieces)} 片</Text>
              </View>
              <View className={styles.previewSummaryItem}>
                <Text className={styles.previewSummaryLabel}>总金额</Text>
                <Text className={styles.previewSummaryPrice}>¥ {Number(previewData.totalAmount).toFixed(2)}</Text>
              </View>
            </View>

            <Text className={styles.previewSectionTitle}>扣减明细</Text>

            {previewData.items.map((item: any, idx: number) => (
              <View key={idx} className={styles.previewItemCard}>
                <View className={styles.previewItemHeader}>
                  <Text className={styles.previewItemName}>
                    {item.brand} {item.model}
                    {item.rowCount > 1 && (
                      <Text className={styles.previewItemMulti}>（{item.rowCount}行合并）</Text>
                    )}
                  </Text>
                  <Text className={styles.previewItemType}>
                    {lensTypeLabels[item.lensType] || item.lensType}
                  </Text>
                </View>

                <View className={styles.previewItemRow}>
                  <View className={styles.previewItemCell}>
                    <Text className={styles.previewItemCellLabel}>规格</Text>
                    <Text className={styles.previewItemCellValue}>
                      {item.eyeDesc}
                    </Text>
                  </View>
                  <View className={styles.previewItemCell}>
                    <Text className={styles.previewItemCellLabel}>总片数</Text>
                    <Text className={styles.previewItemCellValue}>
                      {item.totalActualQty} 片
                    </Text>
                  </View>
                  <View className={styles.previewItemCell}>
                    <Text className={styles.previewItemCellLabel}>销售单价</Text>
                    <Text className={styles.previewItemCellValue}>¥ {Number(item.unitPrice).toFixed(2)}</Text>
                  </View>
                </View>

                <View className={styles.previewItemRow}>
                  <View className={styles.previewItemCell}>
                    <Text className={styles.previewItemCellLabel}>原库存</Text>
                    <Text className={styles.previewItemCellValue}>{Number(item.remainingBefore)} 片</Text>
                  </View>
                  <View className={styles.previewItemCell}>
                    <Text className={styles.previewItemCellLabel}>本次扣减</Text>
                    <Text className={styles.previewItemCellValueBad}>-{Number(item.totalActualQty)} 片</Text>
                  </View>
                  <View className={styles.previewItemCell}>
                    <Text className={styles.previewItemCellLabel}>扣减后</Text>
                    <Text className={classnames(styles.previewItemCellValue, {
                      [styles.previewStockLow]: Number(item.remainingAfter) <= 5 && Number(item.remainingAfter) > 0,
                      [styles.previewStockOut]: Number(item.remainingAfter) === 0
                    })}>
                      {Number(item.remainingAfter)} 片
                      {Number(item.remainingAfter) === 0 ? ' (缺货)' : Number(item.remainingAfter) <= 5 ? ' (库存低)' : ''}
                    </Text>
                  </View>
                </View>

                <View className={styles.previewItemFooter}>
                  <Text className={styles.previewItemSubtotalLabel}>小计</Text>
                  <Text className={styles.previewItemSubtotal}>¥ {Number(item.subtotal).toFixed(2)}</Text>
                </View>
              </View>
            ))}

            <View className={styles.previewTotal}>
              <Text className={styles.previewTotalLabel}>应付金额</Text>
              <Text className={styles.previewTotalPrice}>¥ {Number(previewData.totalAmount).toFixed(2)}</Text>
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={handleClosePreview}>
                返回修改
              </Button>
              <Button className={styles.confirmBtn} onClick={handleConfirmWithPreview}>
                确认出库
              </Button>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default DeliveryPage;
