import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { Card, Icon, Row, Screen, Txt, type IconName } from '../../components/ui';
import { goHome } from '../../components/LangToggle';
import type { Role } from '../../data/types';

export default function RolePick() {
  const { t } = useT();
  const { setRole } = useStore();
  const items: { role: Role; icon: IconName; title: string; desc: string }[] = [
    { role: 'student', icon: 'school', title: t('roleStudent'), desc: t('roleStudentDesc') },
    { role: 'parent', icon: 'people', title: t('roleParent'), desc: t('roleParentDesc') },
    { role: 'instructor', icon: 'easel', title: t('roleInstructor'), desc: t('roleInstructorDesc') },
  ];
  return (
    <Screen title={t('whoAreYou')} subtitle={t('whoAreYouBody')}>
      <View style={{ gap: space.s }}>
        {items.map((i) => (
          <Card
            key={i.role}
            onPress={() => {
              setRole(i.role);
              goHome(i.role);
            }}
          >
            <Row gap={space.m}>
              <View style={styles.icon}>
                <Icon name={i.icon} size={22} color={colors.blue} flip={false} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt w="s">{i.title}</Txt>
                <Txt size="small" color={colors.inkSoft}>
                  {i.desc}
                </Txt>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.inkMute} />
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
});
