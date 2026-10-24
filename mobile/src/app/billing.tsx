import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, radius, space } from '../theme/tokens';
import { useT } from '../i18n';
import { useStore } from '../data/store';
import { childById, childInvoices, courseById, outstandingFor } from '../data/selectors';
import { fmtMoney, fmtRelDay, monthName } from '../lib/dates';
import { Btn, Card, Icon, Notice, Row, Screen, Section, Sheet, Tag, Txt, type IconName, type Tone } from '../components/ui';
import { ApiError, apiEnabled, isOnlineMethod } from '../data/api';
import { followPayment, payOnline, type CheckoutResult } from '../data/checkout';
import type { Invoice, PayMethod } from '../data/types';
import type { StringKey } from '../i18n/strings';

// Card, wallet and kiosk go through Paymob; cash is collected at the centre and recorded by the instructor.
const METHODS: { id: PayMethod; label: StringKey; icon: IconName }[] = [
  { id: 'card', label: 'methodCard', icon: 'card' },
  { id: 'wallet', label: 'methodWallet', icon: 'phone-portrait' },
  { id: 'kiosk', label: 'methodKiosk', icon: 'storefront' },
  { id: 'cash', label: 'methodCash', icon: 'cash' },
];

const METHOD_LABEL: Record<PayMethod, StringKey> = {
  card: 'methodCard',
  wallet: 'methodWallet',
  kiosk: 'methodKiosk',
  cash: 'methodCash',
  instapay: 'methodInstapay', // older payments
};

type Result = { text: string; tone?: Tone; icon?: IconName };

export default function Billing() {
  const { t, L, lang } = useT();
  const s = useStore();
  const child = childById(s.childId);
  const invoices = childInvoices(s, s.childId);
  const open = invoices.filter((i) => i.status !== 'paid').sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const paid = invoices.filter((i) => i.status === 'paid');
  const money = outstandingFor(s, s.childId);
  const isParent = s.role === 'parent';
  const params = useLocalSearchParams<{ payment?: string }>();

  const [paying, setPaying] = useState<Invoice | null>(null);
  const [method, setMethod] = useState<PayMethod>('card');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [done, setDone] = useState<Result | null>(null);

  const title = (i: Invoice) => t('invoiceFor', { course: L(courseById(i.courseId).title), month: monthName(i.month, lang) });

  const settle = ({ payment: p, returned }: CheckoutResult) => {
    if (p.status === 'paid') {
      s.payInvoice(p.invoiceId, p.method);
      setDone({ text: t('paymentDone') });
    } else if (p.status === 'failed') {
      setDone({ text: t('paymentFailed'), tone: 'bad', icon: 'alert-circle' });
    } else if (p.status === 'pending' && p.method === 'kiosk') {
      setDone({ text: p.billReference ? t('kioskReference', { code: p.billReference }) : t('kioskPending'), tone: 'sun', icon: 'time' });
    } else if (returned || p.status === 'pending') {
      setDone({ text: t('paymentWaiting'), tone: 'info', icon: 'time' });
    }
    // Still "created" after the parent closed checkout: they backed out, nothing to say.
  };

  const fail = (err: unknown) => {
    const code = err instanceof ApiError ? err.code : '';
    if (code === 'already_paid') {
      void s.syncInvoices();
      setDone({ text: t('alreadyPaid'), tone: 'info', icon: 'information-circle' });
    } else {
      setDone({ text: t(code === 'method_unavailable' ? 'methodUnavailable' : 'paymentError'), tone: 'bad', icon: 'alert-circle' });
    }
  };

  // Checkout came back after the app had restarted (see payment-return.tsx).
  useEffect(() => {
    if (!params.payment || !apiEnabled) return;
    followPayment(params.payment).then((payment) => settle({ payment, returned: true }), fail);
  }, [params.payment]);

  const confirm = async () => {
    if (!paying) return;
    const invoice = paying;
    if (method === 'cash') {
      setDone({ text: t('cashNote') });
      setPaying(null);
      return;
    }
    if (!apiEnabled || !isOnlineMethod(method)) {
      // Demo mode, no backend configured: mark it paid locally.
      s.payInvoice(invoice.id, method);
      setDone({ text: t('paymentDone') });
      setPaying(null);
      return;
    }
    setBusyId(invoice.id);
    try {
      settle(await payOnline(invoice.id, method, () => setPaying(null)));
    } catch (err) {
      fail(err);
    } finally {
      setBusyId(null);
      setPaying(null);
    }
  };

  return (
    <Screen back title={t('billingTitle')} subtitle={L(child.name)}>
      <Card tone={money.overdue.length ? 'card' : 'tint'} style={money.overdue.length ? { borderColor: colors.badTint } : undefined}>
        <Txt size="small" color={colors.inkSoft}>
          {t('outstanding')}
        </Txt>
        <Row gap={6} align="flex-end">
          <Txt w="b" size="display" color={money.overdue.length ? colors.bad : colors.ink}>
            {fmtMoney(money.total)}
          </Txt>
          <Txt w="m" color={colors.inkSoft} style={{ marginBottom: 6 }}>
            {t('egp')}
          </Txt>
        </Row>
        {!money.total ? (
          <Txt size="small" color={colors.good} w="m">
            {t('billingClear')}
          </Txt>
        ) : null}
      </Card>

      {done ? (
        <View style={{ marginTop: space.l }}>
          <Notice text={done.text} tone={done.tone} icon={done.icon} />
        </View>
      ) : null}
      {!isParent ? (
        <View style={{ marginTop: space.l }}>
          <Notice text={t('billingParentOnly')} tone="info" icon="information-circle" />
        </View>
      ) : null}

      {open.length ? (
        <Section title={t('due')}>
          {open.map((i) => (
            <Card key={i.id}>
              <Row justify="space-between" align="flex-start" gap={space.m}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt w="s">{title(i)}</Txt>
                  <Row gap={space.s}>
                    <Tag label={i.status === 'overdue' ? t('overdue') : t('due')} tone={i.status === 'overdue' ? 'bad' : 'sun'} />
                    <Txt size="small" color={colors.inkSoft}>
                      {t('dueOn', { when: fmtRelDay(i.dueDate, lang) })}
                    </Txt>
                  </Row>
                </View>
                <Txt w="b" size="heading">
                  {fmtMoney(i.amount)} {t('egp')}
                </Txt>
              </Row>
              {isParent ? (
                <Btn
                  label={t('payAmount', { amount: fmtMoney(i.amount) })}
                  variant={i.status === 'overdue' ? 'primary' : 'outline'}
                  full
                  loading={busyId === i.id}
                  disabled={!!busyId && busyId !== i.id}
                  style={{ marginTop: space.m }}
                  onPress={() => {
                    setDone(null);
                    setMethod('card');
                    setPaying(i);
                  }}
                />
              ) : null}
            </Card>
          ))}
        </Section>
      ) : null}

      <Section title={t('payHistory')}>
        <Card style={{ paddingVertical: space.xs }}>
          {paid.map((i, idx) => (
            <Row key={i.id} gap={space.m} style={[{ paddingVertical: space.m }, idx ? styles.sep : null]}>
              <View style={styles.ok}>
                <Icon name="checkmark" size={16} color={colors.good} flip={false} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt w="m">{title(i)}</Txt>
                <Txt size="small" color={colors.inkSoft}>
                  {t('paidVia', { method: t(METHOD_LABEL[i.paidVia ?? 'cash']) })}
                </Txt>
              </View>
              <Txt w="s">{fmtMoney(i.amount)}</Txt>
            </Row>
          ))}
        </Card>
      </Section>

      <Sheet visible={!!paying} onClose={() => !busyId && setPaying(null)} title={t('chooseMethod')}>
        <View style={{ gap: space.s }}>
          {METHODS.map((m) => {
            const on = method === m.id;
            return (
              <Pressable key={m.id} onPress={() => setMethod(m.id)} accessibilityRole="radio" accessibilityState={{ checked: on }} style={[styles.method, on && { borderColor: colors.blue, backgroundColor: colors.blueTint }]}>
                <Row gap={space.m}>
                  <Icon name={m.icon} size={20} color={on ? colors.blue : colors.inkSoft} flip={false} />
                  <Txt w={on ? 's' : 'r'} style={{ flex: 1 }}>
                    {t(m.label)}
                  </Txt>
                  <View style={[styles.radio, on && { borderColor: colors.blue }]}>{on ? <View style={styles.radioDot} /> : null}</View>
                </Row>
              </Pressable>
            );
          })}
        </View>
        {apiEnabled && isOnlineMethod(method) ? (
          <Row gap={space.s} style={{ marginTop: space.m }}>
            <Icon name="lock-closed" size={14} color={colors.inkSoft} flip={false} />
            <Txt size="small" color={colors.inkSoft} style={{ flex: 1 }}>
              {t('paySecure')}
            </Txt>
          </Row>
        ) : null}
        <Btn
          label={paying ? t('payAmount', { amount: fmtMoney(paying.amount) }) : t('confirmPay')}
          full
          loading={!!busyId}
          style={{ marginTop: space.l }}
          onPress={confirm}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  ok: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.goodTint, alignItems: 'center', justifyContent: 'center' },
  method: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.control, padding: space.m + 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
});
