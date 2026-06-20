import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button, Input, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppStore } from '@/store';
import OptometristCard from '@/components/OptometristCard';
import StatCard from '@/components/StatCard';
import { getWeekDates, generateTimeSlots } from '@/utils';
import { optometristStatusLabels } from '@/data/optometrist';
import { appointmentTypeLabels, appointmentStatusLabels } from '@/data/appointment';
import assignmentService from '@/services/assignment';
import type { Optometrist, OptometristStatus } from '@/types/optometrist';
import type { CandidateResult } from '@/services/assignment';

const SchedulePage: React.FC = () => {
  const {
    optometrists,
    appointments,
    selectedDate,
    selectedTimeSlot,
    setSelectedDate,
    setSelectedTimeSlot,
    addAppointment,
    addOptometrist,
    updateOptometrist
  } = useAppStore();

  const [weekDates] = useState(getWeekDates());
  const [timeSlots] = useState(generateTimeSlots(9, 18, 30));
  const [showBookModal, setShowBookModal] = useState(false);
  const [showOptModal, setShowOptModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingOpt, setEditingOpt] = useState<Optometrist | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [appointmentType, setAppointmentType] = useState<string>('comprehensive');
  const [assignedOptometrist, setAssignedOptometrist] = useState<any>(null);
  const [candidateList, setCandidateList] = useState<CandidateResult[]>([]);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState(0);

  const [optForm, setOptForm] = useState({
    name: '',
    title: '',
    experience: '3',
    specialty: '',
    workStartTime: '09:00',
    workEndTime: '18:00',
    status: 'available' as OptometristStatus
  });

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

    const candidates = assignmentService.getCandidateList(
      optometrists,
      appointments,
      selectedDate,
      selectedTimeSlot.startTime,
      selectedTimeSlot.endTime
    );

    if (candidates.length === 0) {
      Taro.showToast({
        title: '该时段暂无可用验光师',
        icon: 'none'
      });
      return;
    }

    setCandidateList(candidates);
    setSelectedCandidateIdx(0);
    setAssignedOptometrist(candidates[0]);
    setShowBookModal(true);
  };

  const handleSelectCandidate = (idx: number) => {
    setSelectedCandidateIdx(idx);
    setAssignedOptometrist(candidateList[idx]);
  };

  const handleViewAppointmentDetail = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
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
    setCandidateList([]);
  };

  const handleOpenAddOptometrist = () => {
    setEditingOpt(null);
    setOptForm({
      name: '',
      title: '验光技师',
      experience: '3',
      specialty: '',
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'available'
    });
    setShowOptModal(true);
  };

  const handleOpenEditOptometrist = (opt: Optometrist) => {
    setEditingOpt(opt);
    setOptForm({
      name: opt.name,
      title: opt.title,
      experience: String(opt.experience),
      specialty: opt.specialty.join('、'),
      workStartTime: opt.workStartTime,
      workEndTime: opt.workEndTime,
      status: opt.status
    });
    setShowOptModal(true);
  };

  const handleSaveOptometrist = () => {
    if (!optForm.name.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!optForm.title.trim()) {
      Taro.showToast({ title: '请输入职称', icon: 'none' });
      return;
    }

    const specialtyList = optForm.specialty
      .split(/[、,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const optData = {
      name: optForm.name.trim(),
      title: optForm.title.trim(),
      experience: parseInt(optForm.experience, 10) || 0,
      specialty: specialtyList.length > 0 ? specialtyList : ['常规验光'],
      workStartTime: optForm.workStartTime,
      workEndTime: optForm.workEndTime,
      status: optForm.status,
      avatar: editingOpt?.avatar || `https://picsum.photos/id/${64 + Math.floor(Math.random() * 50)}/200/200`,
      rating: editingOpt?.rating ?? 4.5,
      todayAppointments: editingOpt?.todayAppointments ?? 0
    };

    if (editingOpt) {
      updateOptometrist(editingOpt.id, optData);
      Taro.showToast({ title: '保存成功', icon: 'success' });
    } else {
      addOptometrist(optData);
      Taro.showToast({ title: '新增成功', icon: 'success' });
    }

    setShowOptModal(false);
    setEditingOpt(null);
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
          const slotAvailability = assignmentService.getSlotAvailability(
            optometrists,
            appointments,
            selectedDate,
            slot.startTime,
            slot.endTime
          );
          const isSelected = selectedTimeSlot?.startTime === slot.startTime;
          const bookedCount = slotAvailability.totalOnDuty - slotAvailability.availableCount;
          const isDisabled = slotAvailability.isFullyBooked || slotAvailability.totalOnDuty === 0;

          return (
            <View
              key={slot.id}
              className={classnames(styles.timeSlot, {
                [styles.selected]: isSelected,
                [styles.disabled]: isDisabled,
                [styles.partial]: !isDisabled && bookedCount > 0
              })}
              onClick={() => !isDisabled && handleSelectSlot(slot)}
            >
              <Text className={styles.timeText}>{slot.startTime}</Text>
              {isDisabled ? (
                <Text className={styles.timeTagFull}>已满</Text>
              ) : bookedCount > 0 ? (
                <Text className={styles.timeTagPartial}>
                  {slotAvailability.availableCount}人可约
                </Text>
              ) : (
                <Text className={styles.timeTagFree}>可约</Text>
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

      <Text className={styles.sectionTitle}>当日预约看板</Text>
      <View className={styles.kanban}>
        {timeSlots.map((slot) => {
          const slotAvailability = assignmentService.getSlotAvailability(
            optometrists,
            appointments,
            selectedDate,
            slot.startTime,
            slot.endTime
          );
          const slotAppointments = appointments.filter(
            (a) =>
              a.date === selectedDate &&
              a.startTime === slot.startTime &&
              a.status !== 'cancelled'
          );
          const bookedCount = slotAppointments.length;
          const isDisabled = slotAvailability.isFullyBooked || slotAvailability.totalOnDuty === 0;

          return (
            <View key={slot.id} className={styles.kanbanSlot}>
              <View className={styles.kanbanTime}>
                <Text className={styles.kanbanTimeText}>{slot.startTime}</Text>
                <Text
                  className={classnames(styles.kanbanStatus, {
                    [styles.kanbanStatusFull]: isDisabled,
                    [styles.kanbanStatusPartial]: !isDisabled && bookedCount > 0
                  })}
                >
                  {isDisabled
                    ? '已满'
                    : slotAvailability.availableCount > 0
                      ? `剩${slotAvailability.availableCount}人`
                      : '可约'}
                </Text>
              </View>
              <View className={styles.kanbanAppointments}>
                {slotAppointments.length === 0 ? (
                  <View className={styles.kanbanEmpty}>
                    <Text className={styles.kanbanEmptyText}>暂无预约</Text>
                  </View>
                ) : (
                  slotAppointments.map((apt) => (
                    <View
                      key={apt.id}
                      className={styles.kanbanApptCard}
                      onClick={() => handleViewAppointmentDetail(apt)}
                    >
                      <View className={styles.kanbanApptAvatar}>
                        {apt.optometristName?.charAt(0) || '验'}
                      </View>
                      <View className={styles.kanbanApptInfo}>
                        <Text className={styles.kanbanApptName}>{apt.customerName}</Text>
                        <Text className={styles.kanbanApptOpt}>
                          {apt.optometristName} · {appointmentTypeLabels[apt.type] || '常规验光'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>验光师团队</Text>
        <Button className={styles.addOptBtn} onClick={handleOpenAddOptometrist}>
          + 新增
        </Button>
      </View>
      <View>
        {optometrists.map((opt) => (
          <View key={opt.id} className={styles.optCardWrapper}>
            <OptometristCard data={opt} showWorkload workloadMax={18} onClick={() => {}} />
            <View className={styles.optActions}>
              <Text
                className={styles.optEditBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditOptometrist(opt);
                }}
              >
                ✏️ 编辑
              </Text>
            </View>
          </View>
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
                  <Text className={styles.assignedLabel}>已选验光师（可切换）</Text>
                  <View className={styles.assignedScore}>
                    排名 {selectedCandidateIdx + 1}/{candidateList.length} · 总分 {assignedOptometrist.score.toFixed(1)}
                  </View>
                </View>
                <View className={styles.assignedInfo}>
                  <Text className={styles.assignedName}>{assignedOptometrist.optometrist.name}</Text>
                  <Text className={styles.assignedTitle}>{assignedOptometrist.optometrist.title}</Text>
                </View>

                <View className={styles.scoreDetail}>
                  <View className={styles.scoreItem}>
                    <Text className={styles.scoreItemLabel}>负载分</Text>
                    <Text className={styles.scoreItemValue}>
                      +{assignedOptometrist.details.loadScore.toFixed(1)}
                    </Text>
                    <Text className={styles.scoreItemReason}>
                      {assignedOptometrist.details.loadReason}
                    </Text>
                  </View>
                  <View className={styles.scoreItem}>
                    <Text className={styles.scoreItemLabel}>填补空档</Text>
                    <Text className={styles.scoreItemValue}>
                      +{assignedOptometrist.details.fragmentScore.toFixed(1)}
                    </Text>
                    <Text className={styles.scoreItemReason}>
                      {assignedOptometrist.details.fragmentReason}
                    </Text>
                  </View>
                  <View className={styles.scoreItem}>
                    <Text className={styles.scoreItemLabel}>工作时间</Text>
                    <Text
                      className={classnames(styles.scoreItemValue, {
                        [styles.scoreValueBad]: !assignedOptometrist.details.workTimeMatch
                      })}
                    >
                      {assignedOptometrist.details.workTimeMatch ? '✓ 匹配' : '✗ 不匹配'}
                    </Text>
                    <Text className={styles.scoreItemReason}>
                      {assignedOptometrist.details.workTimeReason}
                    </Text>
                  </View>
                  <View className={styles.scoreItem}>
                    <Text className={styles.scoreItemLabel}>好评/经验</Text>
                    <Text className={styles.scoreItemValue}>
                      +{(assignedOptometrist.details.ratingScore + assignedOptometrist.details.expScore).toFixed(1)}
                    </Text>
                    <Text className={styles.scoreItemReason}>
                      评分 {assignedOptometrist.optometrist.rating} · 经验 {assignedOptometrist.optometrist.experience}年
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {candidateList.length > 0 && (
              <View className={styles.candidateSection}>
                <Text className={styles.candidateTitle}>候选验光师排名</Text>
                {candidateList.map((c, idx) => (
                  <View
                    key={c.optometrist.id}
                    className={classnames(styles.candidateItem, {
                      [styles.candidateActive]: idx === selectedCandidateIdx
                    })}
                    onClick={() => handleSelectCandidate(idx)}
                  >
                    <View className={styles.candidateRank}>{idx + 1}</View>
                    <View className={styles.candidateInfo}>
                      <Text className={styles.candidateName}>
                        {c.optometrist.name}
                      </Text>
                      <Text className={styles.candidateReason}>{c.reason}</Text>
                    </View>
                    <View className={styles.candidateScore}>{c.score.toFixed(1)}分</View>
                  </View>
                ))}
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

      {showDetailModal && selectedAppointment && (
        <View className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>预约详情</Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>预约时间</Text>
              <Text className={styles.formValue}>
                {selectedAppointment.date} {selectedAppointment.startTime} - {selectedAppointment.endTime}
              </Text>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>顾客姓名</Text>
              <Text className={styles.formValue}>{selectedAppointment.customerName}</Text>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>联系电话</Text>
              <Text className={styles.formValue}>{selectedAppointment.customerPhone}</Text>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>验光类型</Text>
              <Text className={styles.formValue}>
                {appointmentTypeLabels[selectedAppointment.type] || '常规验光'}
              </Text>
            </View>

            <View className={styles.assignedCard}>
              <View className={styles.assignedHeader}>
                <Text className={styles.assignedLabel}>验光师</Text>
                <View
                  className={classnames(styles.statusBadge, {
                    [styles.statusConfirmed]: selectedAppointment.status === 'confirmed',
                    [styles.statusPending]: selectedAppointment.status === 'pending',
                    [styles.statusCompleted]: selectedAppointment.status === 'completed',
                    [styles.statusCancelled]: selectedAppointment.status === 'cancelled',
                    [styles.statusInProgress]: selectedAppointment.status === 'in-progress'
                  })}
                >
                  {appointmentStatusLabels[selectedAppointment.status]?.label || '未知'}
                </View>
              </View>
              <View className={styles.assignedInfo}>
                <Text className={styles.assignedName}>{selectedAppointment.optometristName}</Text>
              </View>
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
            </View>
          </View>
        </View>
      )}

      {showOptModal && (
        <View className={styles.modalOverlay} onClick={() => setShowOptModal(false)}>
          <ScrollView className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>
              {editingOpt ? '编辑验光师' : '新增验光师'}
            </Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>姓名 *</Text>
              <Input
                className={styles.formInput}
                placeholder='请输入姓名'
                value={optForm.name}
                onInput={(e) => setOptForm({ ...optForm, name: e.detail.value })}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>职称 *</Text>
              <Input
                className={styles.formInput}
                placeholder='如：高级验光师、主任验光师'
                value={optForm.title}
                onInput={(e) => setOptForm({ ...optForm, title: e.detail.value })}
              />
            </View>

            <View className={styles.formRow}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>从业年限</Text>
                <Input
                  className={styles.formInput}
                  type='number'
                  placeholder='年'
                  value={optForm.experience}
                  onInput={(e) => setOptForm({ ...optForm, experience: e.detail.value })}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>状态</Text>
                <Picker
                  mode='selector'
                  range={['空闲', '忙碌', '离线']}
                  rangeKey=''
                  onChange={(e) => {
                    const statuses: OptometristStatus[] = ['available', 'busy', 'offline'];
                    setOptForm({ ...optForm, status: statuses[e.detail.value] });
                  }}
                >
                  <View className={styles.formPicker}>
                    {optometristStatusLabels[optForm.status]?.label || '空闲'}
                  </View>
                </Picker>
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>专长领域（用顿号、逗号或空格分隔）</Text>
              <Input
                className={styles.formInput}
                placeholder='如：综合验光、近视防控、角膜塑形镜'
                value={optForm.specialty}
                onInput={(e) => setOptForm({ ...optForm, specialty: e.detail.value })}
              />
            </View>

            <View className={styles.formRow}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>上班时间</Text>
                <Picker
                  mode='selector'
                  range={['08:00', '08:30', '09:00', '09:30', '10:00']}
                  rangeKey=''
                  onChange={(e) => {
                    const times = ['08:00', '08:30', '09:00', '09:30', '10:00'];
                    setOptForm({ ...optForm, workStartTime: times[e.detail.value] });
                  }}
                >
                  <View className={styles.formPicker}>{optForm.workStartTime}</View>
                </Picker>
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>下班时间</Text>
                <Picker
                  mode='selector'
                  range={['17:00', '17:30', '18:00', '18:30', '19:00']}
                  rangeKey=''
                  onChange={(e) => {
                    const times = ['17:00', '17:30', '18:00', '18:30', '19:00'];
                    setOptForm({ ...optForm, workEndTime: times[e.detail.value] });
                  }}
                >
                  <View className={styles.formPicker}>{optForm.workEndTime}</View>
                </Picker>
              </View>
            </View>

            <View className={styles.formHint}>
              工作时段：{optForm.workStartTime} - {optForm.workEndTime}（共
              {parseInt(optForm.workEndTime.split(':')[0], 10) -
                parseInt(optForm.workStartTime.split(':')[0], 10)}
              小时）
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={() => setShowOptModal(false)}>
                取消
              </Button>
              <Button className={styles.confirmBtn} onClick={handleSaveOptometrist}>
                {editingOpt ? '保存修改' : '确认新增'}
              </Button>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default SchedulePage;
