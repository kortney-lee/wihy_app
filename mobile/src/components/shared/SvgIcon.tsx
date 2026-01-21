import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface SvgIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Map custom icon names to valid Ionicons names
const iconMap: Record<string, string> = {
  // Navigation
  'arrow-back': 'arrow-back',
  'chevron-forward': 'chevron-forward',
  'chevron-back': 'chevron-back',
  'close': 'close',
  
  // Actions
  'checkmark': 'checkmark',
  'checkmark-circle': 'checkmark-circle',
  'add': 'add',
  'add-circle': 'add-circle',
  'remove': 'remove',
  'trash': 'trash',
  'download': 'download',
  'share': 'share',
  'refresh': 'refresh',
  
  // Dashboard icons
  'analytics': 'analytics',
  'nutrition': 'nutrition',
  'trending-up': 'trending-up',
  'restaurant': 'restaurant',
  'library': 'library',
  'fitness': 'fitness',
  'people': 'people',
  'people-circle': 'people-circle',
  'heart': 'heart',
  'briefcase': 'briefcase',
  'compass': 'compass',
  
  // Health/Body icons
  'resize': 'resize',
  'scale': 'speedometer',
  'flame': 'flame',
  'body': 'body',
  'pulse': 'pulse',
  'medkit': 'medkit',
  'thermometer': 'thermometer',
  'bandage': 'bandage',
  
  // Communication
  'chatbubble': 'chatbubble',
  'chatbubbles': 'chatbubbles',
  'mail': 'mail',
  'mail-outline': 'mail-outline',
  'notifications': 'notifications',
  
  // User
  'person': 'person',
  'person-outline': 'person-outline',
  'person-add': 'person-add',
  'person-circle': 'person-circle',
  
  // Security
  'lock-closed': 'lock-closed',
  'lock-open': 'lock-open',
  'key': 'key',
  'shield': 'shield',
  'shield-checkmark': 'shield-checkmark',
  
  // Status
  'alert-circle': 'alert-circle',
  'information-circle': 'information-circle',
  'warning': 'warning',
  'help-circle': 'help-circle',
  
  // Media
  'camera': 'camera',
  'image': 'image',
  'play': 'play',
  'pause': 'pause',
  
  // Misc
  'calendar': 'calendar',
  'time': 'time',
  'star': 'star',
  'rocket': 'rocket',
  'settings': 'settings',
  'options': 'options',
  'barcode': 'barcode',
  'scan': 'scan',
  'qr-code': 'qr-code',
  'search': 'search',
  'filter': 'filter',
  'menu': 'menu',
  'ellipsis-horizontal': 'ellipsis-horizontal',
  'ellipsis-vertical': 'ellipsis-vertical',
  'home': 'home',
  'globe': 'globe',
  'location': 'location',
  'map': 'map',
  'wallet': 'wallet',
  'card': 'card',
  'cash': 'cash',
  'pricetag': 'pricetag',
  'gift': 'gift',
  'trophy': 'trophy',
  'medal': 'medal',
  'ribbon': 'ribbon',
  'flash': 'flash',
  'bulb': 'bulb',
  'sunny': 'sunny',
  'moon': 'moon',
  'water': 'water',
  'leaf': 'leaf',
  'walk': 'walk',
  'bicycle': 'bicycle',
  'car': 'car',
  'airplane': 'airplane',
  'bed': 'bed',
  'wifi': 'wifi',
  'bluetooth': 'bluetooth',
  'battery-full': 'battery-full',
  'document': 'document',
  'folder': 'folder',
  'clipboard': 'clipboard',
  'create': 'create',
  'pencil': 'pencil',
  'build': 'build',
  'hammer': 'hammer',
  'code': 'code',
  'terminal': 'terminal',
  'logo-apple': 'logo-apple',
  'logo-google': 'logo-google',
  'logo-facebook': 'logo-facebook',
  'logo-twitter': 'logo-twitter',
  
  // Eye icons
  'eye': 'eye',
  'eye-off': 'eye-off',
  
  // Arrows
  'arrow-up': 'arrow-up',
  'arrow-down': 'arrow-down',
  'arrow-forward': 'arrow-forward',
  'caret-up': 'caret-up',
  'caret-down': 'caret-down',
  
  // Thumbs
  'thumbs-up': 'thumbs-up',
  'thumbs-down': 'thumbs-down',
  
  // Expand/Collapse
  'expand': 'expand',
  'contract': 'contract',
  
  // Log out
  'log-out': 'log-out',
  'log-in': 'log-in',
  'exit': 'exit',
};

/**
 * SvgIcon component - uses Ionicons which work on both native and web
 * 
 * Ionicons (@expo/vector-icons) has full web support and renders correctly 
 * in both development and production builds.
 */
const SvgIcon: React.FC<SvgIconProps> = ({ name, size = 24, color = '#000', style }) => {
  // Try to find the icon in our map, or use the name directly
  // Also try with -outline suffix as fallback
  const iconName = iconMap[name] || iconMap[`${name}-outline`] || name;
  
  return <Ionicons name={iconName as any} size={size} color={color} style={style} />;
};

export default SvgIcon;
