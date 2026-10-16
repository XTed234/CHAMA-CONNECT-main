import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="members">
        <Icon sf="person.2.fill" />
        <Label>Members</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="contributions">
        <Icon sf="creditcard.fill" />
        <Label>Contribute</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="payout">
        <Icon sf="arrow.clockwise" />
        <Label>Payout</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf="gearshape.fill" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
