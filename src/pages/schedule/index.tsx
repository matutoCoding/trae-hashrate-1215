import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import OptometristCard from '@/components/OptometristCard';
import StatCard from '@/components/StatCard';
import { getWeekDates, generateTimeSlots } from '@/utils';
import { optometristStatusLabels } from '@/data/optometrist';
import { appointmentTypeLabels } from '@/data/appointment';
import assignmentService from '@/services/assignment';

const SchedulePage: React.FC = () => {
  const {
    optometrists,
    appointments,
    selectedDate,
    selectedTimeSlot,
    setSelectedDate,
    setSelectedTimeSlot,
    addAppointment
  } = useAppStore();

  const [weekDates] = useState(getWeekDates());
  const [timeSlots] = useState(generateTimeSlots(9, 18, 30));
  const [showBookModal, setShowBookModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [appointmentType, setAppointmentType] = useState<string>('comprehensive');
  const [assignedOptometrist, setAssignedOptometrist] = useState<any>(null);

  useEffect(() => {
    useAppStore.getState().initData();
  }, []);

  const todayAppointments = appointments.filter((a) => a.date === selectedDate && a.status !== 'cancelled');
  const availableCount = optometrists.filter((o) => o.status === 'available').length;
  const busyCount = optometrists.filter((o) => o.status === 'busy').length;

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleSelectSlot = (slot: any) => {
    if (selectedTimeSlot?.startTime === slot.startTime) {
      setSelectedTimeSlot(null);
    } else {
      setSelectedTimeSlot({ startTime: slot.startTime, endTime: slot.endTime });
    }
  };

  const openBookModal = () => {
    if (!selectedTimeSlot) {
      Taro.showModal({
        title: '提示',
        content: '请先选择预约时间段',
        showCancel: false
      });
      return;
    }

    const assignmentResult = assignmentService.findBestOptometrist(
      optometrists,
      appointments,
      selectedDate,
      selectedTimeSlot.startTime,
      selectedTimeSlot.endTime
    );

    if (!assignmentResult) {
      Taro.showToast({
        title: '该时段暂无可用验光师',
        icon: 'none'
      });
      return;
    }

    setAssignedOptometrist(assignmentResult);
    setShowBookModal(true);
  };

  const handleConfirmBooking = () => {
    if (!customerName || !customerPhone) {
      Taro.showToast({
        title: '请填写顾客信息',
        icon: 'none'
      });
      return;
    }

    addAppointment({
      customerName,
      customerPhone,
      date: selectedDate,
      startTime: selectedTimeSlot!.startTime,
      endTime: selectedTimeSlot!.endTime,
      optometristId: assignedOptometrist.optometrist.id,
      optometristName: assignedOptometrist.optometrist.name,
      status: 'confirmed',
      type: appointmentType as any
    });

    Taro.showToast({
      title: '预约成功',
      icon: 'success'
    });

    setShowBookModal(false);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedTimeSlot(null);
    setAssignedOptometrist(null);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>验光排期</Text>
        <Text className={styles.headerSub}>智能分配·避免碎片</Text>
      </View>

      <ScrollView scrollX className={styles.statsScroll}>
        <View className={styles.statsRow}>
          <StatCard
            title='今日预约'
            value={todayAppointments.length}
            unit='单'
            iconText='📋'
            trend='较昨日 +2'
            trendColor='success'
          />
          <StatCard
            title='空闲验光师'
            value={availableCount}
            unit='人'
            iconText='👁️'
          />
          <StatCard
            title='忙碌中'
            value={busyCount}
            unit='人'
            iconText='⏰'
            trend='负载均衡中'
            trendColor='info'
          />
        </View>
      </ScrollView>

      <Text className={styles.sectionTitle}>选择日期</Text>
      <ScrollView scrollX className={styles.dateScroll}>
        <View className={styles.dateRow}>
          {weekDates.map((d) => (
            <View
              key={d.date}
              className={classnames(styles.dateItem, {
                [styles.active]: d.date === selectedDate
              })}
              onClick={() => handleSelectDate(d.date)}
            >
              <Text className={styles.dateWeekday}>周{d.weekday}</Text>
              <Text className={styles.dateDay}>{d.day}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Text className={styles.sectionTitle}>选择时间段</Text>
      <View className={styles.timeGrid}>
        {timeSlots.map((slot) => {
          const hasAppointment = appointments.some(
            (a) =>
              a.date === selectedDate &&
              a.startTime === slot.startTime && a.status !== 'cancelled'
          );
          const isSelected = selectedTimeSlot?.startTime === slot.startTime;

          return (
            <View
              key={slot.id}
              className={classnames(styles.timeSlot, {
                [styles.selected]: isSelected,
                [styles.disabled]: hasAppointment
              })}
              onClick={() => !hasAppointment && handleSelectSlot(slot)}
            >
              <Text className={styles.timeText}>{slot.startTime}</Text>
              {hasAppointment && (
                <Text className={styles.timeTag}>已约</Text>
              )}
            </View>
          );
        })}
      </View>

      {selectedTimeSlot && (
        <View className={styles.selectedInfo}>
          <View className={styles.selectedInfoHeader}>
            <Text className={styles.selectedLabel}>已选时段</Text>
            <Text className={styles.selectedTime}>
              {selectedDate} {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
            </Text>
          </View>
          <Button className={styles.bookButton} onClick={openBookModal}>
            立即预约
          </Button>
        </View>
      )}

      <Text className={styles.sectionTitle}>验光师团队</Text>
      <View>
        {optometrists.map((opt) => (
        <OptometristCard key={opt.id} data={opt} showWorkload workloadMax={18} />
      ))}
      </View>

      {showBookModal && (
        <View className={styles.modalOverlay} onClick={() => setShowBookModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>确认预约</Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>预约时间</Text>
              <Text className={styles.formValue}>
                {selectedDate} {selectedTimeSlot?.startTime} - {selectedTimeSlot?.endTime}
              </Text>
            </View>

            {assignedOptometrist && (
              <View className={styles.assignedCard}>
                <View className={styles.assignedHeader}>
                  <Text className={styles.assignedLabel}>系统推荐验光师</Text>
                  <View className={styles.assignedScore}>评分 {assignedOptometrist.score.toFixed(1)}</View>
                </View>
                <View className={styles.assignedInfo}>
                  <Text className={styles.assignedName}>{assignedOptometrist.optometrist.name}</Text>
                  <Text className={styles.assignedTitle}>{assignedOptometrist.optometrist.title}</Text>
                </View>
                <Text className={styles.assignedReason}>推荐理由：{assignedOptometrist.reason}</Text>
              </View>
            )}

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>顾客姓名</Text>
              <Input
                className={styles.formInput}
                placeholder='请输入姓名'
                value={customerName}
                onInput={(e) => setCustomerName(e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>联系电话</Text>
              <Input
                className={styles.formInput}
                type='number'
                placeholder='请输入手机号'
                value={customerPhone}
                onInput={(e) => setCustomerPhone(e.detail.value)}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>验光类型</Text>
              <View className={styles.typeRow}>
                {Object.entries(appointmentTypeLabels).map(([key, label]) => (
                  <View
                    key={key}
                    className={classnames(styles.typeTag, {
                      [styles.typeActive]: appointmentType === key
                    })}
                    onClick={() => setAppointmentType(key)}
                  >
                    {label}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={() => setShowBookModal(false)}>
                取消
              </Button>
              <Button className={styles.confirmBtn} onClick={handleConfirmBooking}>
                确认预约
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default SchedulePage;
