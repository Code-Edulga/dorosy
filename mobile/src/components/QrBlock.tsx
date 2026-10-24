// Visual stand-in for the check-in QR code. In production this renders a signed, rotating token
// (session id + 30-second window) with a QR library; the layout and size stay the same.

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../theme/tokens';

const N = 21;

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function finder(r: number, c: number) {
  const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
  const ring = (r0: number, c0: number) => {
    const rr = r - r0;
    const cc = c - c0;
    return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
  };
  if (inBox(0, 0)) return ring(0, 0) ? 1 : 0;
  if (inBox(0, N - 7)) return ring(0, N - 7) ? 1 : 0;
  if (inBox(N - 7, 0)) return ring(N - 7, 0) ? 1 : 0;
  return -1;
}

export function QrBlock({ seed, size = 168 }: { seed: string; size?: number }) {
  const [slot, setSlot] = useState(() => Math.floor(Date.now() / 30_000));
  useEffect(() => {
    const id = setInterval(() => setSlot(Math.floor(Date.now() / 30_000)), 5_000);
    return () => clearInterval(id);
  }, []);
  const cell = size / N;
  const rows = [];
  for (let r = 0; r < N; r++) {
    const cells = [];
    for (let c = 0; c < N; c++) {
      const f = finder(r, c);
      const on = f === -1 ? hash(`${seed}:${slot}:${r}:${c}`) % 100 < 46 : f === 1;
      cells.push(<View key={c} style={{ width: cell, height: cell, backgroundColor: on ? colors.ink : 'transparent' }} />);
    }
    rows.push(
      <View key={r} style={{ flexDirection: 'row' }}>
        {cells}
      </View>,
    );
  }
  return (
    <View accessibilityRole="image" accessibilityLabel="QR" style={{ padding: 12, backgroundColor: '#fff', borderRadius: 16 }}>
      {rows}
    </View>
  );
}
