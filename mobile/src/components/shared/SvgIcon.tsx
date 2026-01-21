import React from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, Polyline, Line, Polygon } from 'react-native-svg';

interface SvgIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

/**
 * SvgIcon component that renders SVG on web and Ionicons on native
 * This solves the issue where Ionicons don't render properly on web
 */
const SvgIcon: React.FC<SvgIconProps> = ({ name, size = 24, color = '#000', style }) => {
  // On native platforms, use Ionicons
  if (Platform.OS !== 'web') {
    return <Ionicons name={name as any} size={size} color={color} style={style} />;
  }

  // On web, render SVG paths
  const getSvgPath = (iconName: string) => {
    switch (iconName) {
      case 'home':
      case 'home-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M261.56 101.28a8 8 0 00-11.06 0L66.4 277.15a8 8 0 00-2.47 5.79L63.9 448a32 32 0 0032 32H192a16 16 0 0016-16V328a8 8 0 018-8h80a8 8 0 018 8v136a16 16 0 0016 16h96.06a32 32 0 0032-32V282.94a8 8 0 00-2.47-5.79z" />
            <Path d="M490.91 244.15l-74.8-71.56V64a16 16 0 00-16-16h-48a16 16 0 00-16 16v32l-57.92-55.38C272.77 35.14 264.71 32 256 32c-8.68 0-16.72 3.14-22.14 8.63l-212.7 203.5c-6.22 6-7 15.87-1.34 22.37A16 16 0 0043 267.56L250.5 69.28a8 8 0 0111.06 0l207.52 198.28a16 16 0 0022.59-.44c6.14-6.36 5.63-16.86-.76-22.97z" />
          </Svg>
        );

      case 'scan':
      case 'scan-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M336 448h56a56 56 0 0056-56v-56M448 176v-56a56 56 0 00-56-56h-56M176 448h-56a56 56 0 01-56-56v-56M64 176v-56a56 56 0 0156-56h56" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'chatbubble':
      case 'chatbubble-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={iconName === 'chatbubble' ? color : 'none'} stroke={iconName === 'chatbubble-outline' ? color : 'none'} strokeWidth="32">
            <Path d="M87.49 380c1.19-4.38-1.44-10.47-3.95-14.86a44.86 44.86 0 00-2.54-3.8 199.81 199.81 0 01-33-110C47.65 139.09 140.73 48 255.83 48 356.21 48 440 117.54 459.58 209.85a199 199 0 014.42 41.64c0 112.41-89.49 204.93-204.59 204.93-18.31 0-43-4.6-56.47-8.37s-26.92-8.77-30.39-10.11a31.09 31.09 0 00-11.12-2.07 30.71 30.71 0 00-12.09 2.43l-67.83 24.48a16 16 0 01-4.67 1.22 9.6 9.6 0 01-9.57-9.74 15.85 15.85 0 01.6-3.29z" strokeLinecap="round" strokeMiterlimit="10" />
          </Svg>
        );

      case 'fitness':
      case 'fitness-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M48 256h48M416 256h48M192 256l32-80 32 80 32-80 32 80M112 192h32v128h-32zM368 192h32v128h-32z" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'nutrition':
      case 'nutrition-outline':
        // Apple icon for nutrition
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M256 80c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm0 64c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16z" />
            <Path d="M420.69 193.77a115.25 115.25 0 00-44.43-32.59A95.57 95.57 0 00344 152.77V128a88 88 0 00-176 0v24.77a95.57 95.57 0 00-32.26 8.41 115.25 115.25 0 00-44.43 32.59C67.47 220.59 48 259.77 48 304c0 102.79 83.89 176 208 176s208-73.21 208-176c0-44.23-19.47-83.41-43.31-110.23zM200 128a56 56 0 01112 0v8.47a143.57 143.57 0 00-56-11.47 143.57 143.57 0 00-56 11.47z" />
          </Svg>
        );

      case 'trending-up':
      case 'trending-up-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Polyline points="352 144 464 144 464 256" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M48 368l144-144 96 96 160-160" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'restaurant':
      case 'restaurant-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M357.57 223.94a79.48 79.48 0 0056.58-23.44l77-76.95c6.09-6.09 6.65-16 .85-22.39a16 16 0 00-23.17-.56l-68.63 68.58a12.29 12.29 0 01-17.37 0c-4.79-4.78-4.53-12.86.25-17.64l68.33-68.33a16 16 0 00-.56-23.16A15.62 15.62 0 00440.27 56a16.71 16.71 0 00-11.81 4.9l-68.27 68.26a12.29 12.29 0 01-17.37 0c-4.78-4.78-4.53-12.86.25-17.64l68.33-68.31a16 16 0 00-.56-23.16A15.62 15.62 0 00400.26 16a16.73 16.73 0 00-11.81 4.9L311.5 97.85a79.49 79.49 0 00-23.44 56.59v8.23a16 16 0 01-4.69 11.33l-35.61 35.62a4 4 0 01-5.66 0L68.82 36.35a16 16 0 00-22.17-.56c-6.54 6.09-6.75 16.23-.76 22.62l183.56 183.55a4 4 0 010 5.66l-35.62 35.61a16 16 0 01-11.31 4.69h-8.24a79.49 79.49 0 00-56.58 23.44L40.74 388.32c-6.09 6.09-6.65 16-.85 22.38a16 16 0 0023.16.56l68.63-68.58a12.29 12.29 0 0117.37 0c4.79 4.78 4.53 12.86-.25 17.64l-68.32 68.32a16 16 0 00.56 23.16 15.62 15.62 0 0010.58 4.1 16.71 16.71 0 0011.81-4.9l68.27-68.26a12.29 12.29 0 0117.37 0c4.78 4.78 4.53 12.86-.25 17.64l-68.33 68.31a16 16 0 00.56 23.16 15.62 15.62 0 0010.58 4.1 16.73 16.73 0 0011.81-4.9l76.95-76.95a79.48 79.48 0 0023.44-56.58v-8.23a16 16 0 014.69-11.33l35.61-35.62a4 4 0 015.66 0l183.56 183.55c6.4 6.54 16.53 6.33 22.63-.75a16 16 0 00-.56-22.17L275.28 241.64a4 4 0 010-5.66l35.61-35.61a16 16 0 0111.31-4.69h8.23z" />
          </Svg>
        );

      case 'library':
      case 'library-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M64 480H48a32 32 0 01-32-32V112a32 32 0 0132-32h16a32 32 0 0132 32v336a32 32 0 01-32 32zM240 176a32 32 0 00-32-32h-64a32 32 0 00-32 32v28a4 4 0 004 4h120a4 4 0 004-4zM112 448a32 32 0 0032 32h64a32 32 0 0032-32v-30a2 2 0 00-2-2H114a2 2 0 00-2 2zM114 240h124v192H114zM420 80H300a32 32 0 00-32 32v336a32 32 0 0032 32h120a32 32 0 0032-32V112a32 32 0 00-32-32zm-32 312a8 8 0 01-8 8h-48a8 8 0 01-8-8v-16a8 8 0 018-8h48a8 8 0 018 8zm0-72a8 8 0 01-8 8h-48a8 8 0 01-8-8v-16a8 8 0 018-8h48a8 8 0 018 8zm0-72a8 8 0 01-8 8h-48a8 8 0 01-8-8v-16a8 8 0 018-8h48a8 8 0 018 8zm0-72a8 8 0 01-8 8h-48a8 8 0 01-8-8v-16a8 8 0 018-8h48a8 8 0 018 8z" />
          </Svg>
        );

      case 'heart':
      case 'heart-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={iconName === 'heart' ? color : 'none'} stroke={iconName === 'heart-outline' ? color : 'none'} strokeWidth="32">
            <Path d="M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'arrow-back':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="48">
            <Path d="M244 400L100 256l144-144M120 256h292" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'person':
      case 'person-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={iconName === 'person' ? color : 'none'} stroke={iconName === 'person-outline' ? color : 'none'} strokeWidth="32">
            <Path d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304z" strokeMiterlimit="10" />
          </Svg>
        );

      case 'star':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M394 480a16 16 0 01-9.39-3L256 383.76 127.39 477a16 16 0 01-24.55-18.08L153 310.35 23 221.2a16 16 0 019-29.2h160.38l48.4-148.95a16 16 0 0130.44 0l48.4 149H480a16 16 0 019.05 29.2L359 310.35l50.13 148.53A16 16 0 01394 480z" />
          </Svg>
        );

      case 'checkmark-circle':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z" />
          </Svg>
        );

      case 'pencil':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M364.13 125.25L87 403l-23 45 44.99-23 277.76-277.13-22.62-22.62zM420.69 68.69l-22.62 22.62 22.62 22.63 22.62-22.63a16 16 0 000-22.62 16 16 0 00-22.62 0z" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'chevron-forward':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="48">
            <Path d="M184 112l144 144-144 144" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'rocket':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M461.81 53.81a4.4 4.4 0 00-3.3-3.39c-54.38-13.3-180 34.09-248.13 102.17a294.9 294.9 0 00-33.09 39.08c-21-1.9-42-.3-59.88 7.5-50.49 22.2-65.18 80.18-69.28 105.07a9 9 0 009.8 10.4l81.07-8.9a180.29 180.29 0 001.1 18.3 18.15 18.15 0 005.3 11.09l31.39 31.39a18.15 18.15 0 0011.1 5.3 179.91 179.91 0 0018.19 1.1l-8.89 81a9 9 0 0010.39 9.79c24.9-4 83-18.69 105.07-69.17 7.8-17.9 9.4-38.79 7.6-59.69a293.91 293.91 0 0039.19-33.09c68.38-68 115.47-190.86 102.37-247.95zM298.66 213.67a42.7 42.7 0 1160.38 0 42.65 42.65 0 01-60.38 0z" />
            <Path d="M109.64 352a45.06 45.06 0 00-26.35 12.84C65.67 382.52 64 448 64 448s65.52-1.67 83.15-19.31A44.73 44.73 0 00160 402.32" />
          </Svg>
        );

      case 'logo-google':
        // Modern multicolor Google "G" icon
        return (
          <Svg width={size} height={size} viewBox="0 0 48 48">
            <Path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
            <Path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
            <Path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
            <Path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
          </Svg>
        );

      case 'logo-apple':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512">
            <Path d="M349.13 136.86c-40.32 0-57.36 19.24-85.44 19.24-28.79 0-50.75-19.1-85.69-19.1-34.2 0-70.67 20.88-93.83 56.45-32.52 50.16-27 144.63 25.67 225.11 18.84 28.81 44 61.12 77 61.47h.6c28.68 0 37.2-18.78 76.67-19h.6c38.88 0 46.68 18.89 75.24 18.89h.6c33-.35 59.51-36.15 78.35-64.85 13.56-20.64 18.6-31 29.77-54.07-77.65-28.8-90.26-136.48-11.56-193.68-27.92-35.6-68.46-50.46-87.98-50.46zm-95.55-104.8c-17.44 20.16-45.51 35.53-70.33 34.64C177.34 42.58 197.4 14.84 214.44 0c17.23-14.92 48.77-28.13 72.48-29.06 3.36 27.48-13.04 54.62-33.34 61.12z" fill={color} />
          </Svg>
        );

      case 'logo-microsoft':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512">
            <Rect x="32" y="32" width="209" height="209" fill="#f25022" />
            <Rect x="271" y="32" width="209" height="209" fill="#7fba00" />
            <Rect x="32" y="271" width="209" height="209" fill="#00a4ef" />
            <Rect x="271" y="271" width="209" height="209" fill="#ffb900" />
          </Svg>
        );

      case 'mail':
        // Modern Gmail icon with colorful M design
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512">
            <Path d="M464 80H48C21.5 80 0 101.5 0 128v256c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V128c0-26.5-21.5-48-48-48z" fill="#ECEFF1" />
            <Path d="M464 80H48l208 152L464 80z" fill="#CFD8DC" />
            <Path d="M256 232L48 80v304l208-152z" fill="#F44336" />
            <Path d="M256 232l208-152v304L256 232z" fill="#C62828" />
            <Path d="M48 384V80l208 152L48 384z" fill="#FBC02D" />
            <Path d="M464 384V80L256 232l208 152z" fill="#1976D2" />
          </Svg>
        );

      case 'sparkles':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M208 512a24.84 24.84 0 01-23.34-16l-39.84-103.6a16.06 16.06 0 00-9.19-9.19L32 343.34a25 25 0 010-46.68l103.6-39.84a16.06 16.06 0 009.19-9.19L184.66 144a25 25 0 0146.68 0l39.84 103.6a16.06 16.06 0 009.19 9.19l103.6 39.84a25 25 0 010 46.68l-103.6 39.84a16.06 16.06 0 00-9.19 9.19L231.34 496A24.84 24.84 0 01208 512zM88 176a14.67 14.67 0 01-13.69-9.4l-16.86-43.84a7.28 7.28 0 00-4.21-4.21L9.4 101.69a14.67 14.67 0 010-27.38l43.84-16.86a7.31 7.31 0 004.21-4.21L74.16 9.4a14.67 14.67 0 0127.38 0l16.86 43.84a7.31 7.31 0 004.21 4.21l43.84 16.86a14.67 14.67 0 010 27.38l-43.84 16.86a7.28 7.28 0 00-4.21 4.21L101.69 166.6A14.67 14.67 0 0188 176zM400 256a16 16 0 01-14.93-10.26l-22.84-59.37a8 8 0 00-4.6-4.6l-59.37-22.84a16 16 0 010-29.86l59.37-22.84a8 8 0 004.6-4.6l22.84-59.37a16 16 0 0129.86 0l22.84 59.37a8 8 0 004.6 4.6l59.37 22.84a16 16 0 010 29.86l-59.37 22.84a8 8 0 00-4.6 4.6l-22.84 59.37A16 16 0 01400 256z" />
          </Svg>
        );

      case 'people':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M336 256c-20.56 0-40.44-9.18-56-25.84-15.13-16.25-24.37-37.92-26-61-1.74-24.62 5.77-47.26 21.14-63.76S312 80 336 80c23.83 0 45.38 9.06 60.7 25.52 15.47 16.62 23 39.22 21.26 63.63-1.67 23.11-10.9 44.77-26 61C376.44 246.82 356.57 256 336 256zm66-88zM467.83 432H204.18a27.71 27.71 0 01-22-10.67 30.22 30.22 0 01-5.26-25.79c8.42-33.81 29.28-61.85 60.32-81.08C264.79 297.4 299.86 288 336 288c36.85 0 71 9.1 98.71 26.33 31.11 19.36 52 47.5 60.38 81.55a30.27 30.27 0 01-5.32 25.78A27.68 27.68 0 01467.83 432zM147 260c-35.19 0-66.13-32.72-69-72.93-1.42-20.6 5-39.65 18-53.62 12.86-13.83 31-21.45 51-21.45s38 7.66 50.93 21.57c13.1 14.08 19.5 33.09 18 53.52-2.87 40.2-33.8 72.91-68.93 72.91zM212.66 291.45c-17.59-8.6-40.42-12.9-65.65-12.9-29.46 0-58.07 7.68-80.57 21.62-25.51 15.83-42.67 38.88-49.6 66.71a27.39 27.39 0 004.79 23.36A25.32 25.32 0 0041.72 400h111a8 8 0 007.87-6.57c.11-.63.25-1.26.41-1.88 8.48-34.06 28.35-62.84 57.71-83.82a8 8 0 00-.63-13.39c-1.57-.92-3.37-1.89-5.42-2.89z" />
          </Svg>
        );

      case 'medical':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M272 464h-32a32 32 0 01-32-32V336H96a32 32 0 01-32-32v-32a32 32 0 0132-32h112V128a32 32 0 0132-32h32a32 32 0 0132 32v112h112a32 32 0 0132 32v32a32 32 0 01-32 32H304v96a32 32 0 01-32 32z" />
          </Svg>
        );

      case 'shield-checkmark':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M479.07 111.35a16 16 0 00-13.15-14.75C421.18 89.32 384 81.46 304 64c-16-3.58-32-7.25-48-11.01-20.3-4.63-40.35-9.35-60.2-14.16-18-4.35-35.9-8.74-53.7-13.18a16 16 0 00-20.1 21.69c9.57 24.54 18.61 48.09 26.91 70.04 2.92 7.73 5.76 15.26 8.51 22.6a8.29 8.29 0 01.41 1.48 204.77 204.77 0 018.51 55.46c0 113 80.46 205.27 188.5 227.11a16 16 0 0019.94-13.15 274.89 274.89 0 0015.81-91c0-122.09-44.65-233.88-113.88-311.14a8 8 0 01-1.7-5.18c0-2.64 2.47-4.71 5.21-5.5C347 80.89 376.26 88.22 436 99.75c14.83 2.86 29.62 5.72 44.33 8.58a8 8 0 006.78-2.64 8.06 8.06 0 00-8.04-13.34z" />
            <Path d="M218.72 351.36l-25.44-25.45a16 16 0 00-22.62 22.63l36.72 36.72a16 16 0 0022.62 0l81.81-81.81a16 16 0 10-22.63-22.62z" />
          </Svg>
        );

      case 'notifications':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M440.08 341.31c-1.66-2-3.29-4-4.89-5.93-22-26.61-35.31-42.67-35.31-118 0-39-9.33-71-27.72-95-13.56-17.73-31.89-31.18-56.05-41.12a3 3 0 01-.82-.67C306.6 51.49 282.82 32 256 32s-50.59 19.49-59.28 48.56a3.13 3.13 0 01-.81.65c-56.38 23.21-83.78 67.74-83.78 136.14 0 75.36-13.29 91.42-35.31 118-1.6 1.93-3.23 3.89-4.89 5.93a35.16 35.16 0 00-4.65 37.62c6.17 13 19.32 21.07 34.33 21.07H410.5c14.94 0 28-8.06 34.19-21a35.17 35.17 0 00-4.61-37.38zM256 480a80.06 80.06 0 0070.44-42.13 4 4 0 00-3.54-5.87H189.12a4 4 0 00-3.55 5.87A80.06 80.06 0 00256 480z" />
          </Svg>
        );

      case 'finger-print':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M390.42 75.28a10.45 10.45 0 01-5.32-1.44C340.72 50.08 302.35 40 256.35 40c-45.77 0-89.23 11.28-128.76 33.84C122 77 115.11 74.8 111.87 69a12.4 12.4 0 014.63-16.32A281.81 281.81 0 01256.35 16c49.23 0 92.23 11.28 139.39 36.48a12 12 0 014.85 16.08 11.3 11.3 0 01-10.17 6.72zm-330.79 126a11.73 11.73 0 01-6.48-2.16 12.26 12.26 0 01-2.16-17.47C72.61 147.28 109.47 112 160 112h.24c50.83 0 94.23 36.39 116.39 92.4a11.92 11.92 0 01-6.2 15.71 12.85 12.85 0 01-15.95-5.88C236.23 172.84 201.47 144 160.24 144 117.2 144 87.41 174.32 67.15 199a12.3 12.3 0 01-7.52 2.28zm322.5 2.16a12.26 12.26 0 01-2.16-17.47c21.62-34.37 58.48-69.65 109-69.65h.24c50.83 0 94.23 36.39 116.39 92.4a11.92 11.92 0 01-6.2 15.71 12.85 12.85 0 01-15.95-5.88C555.77 172.84 521 144 479.76 144 436.72 144 406.93 174.32 386.67 199a12.3 12.3 0 01-7.52 2.28 11.73 11.73 0 01-6.48-2.16z" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M160 400.33a10.81 10.81 0 01-8.64-4.32c-2.16-2.88-53.28-71.28-53.28-159.65C98.08 167.44 152.24 112 224.24 112c66.88 0 120 50.88 124.08 116.64.48 8.88 7.68 14.24 15.84 11.84s12.24-9.84 11.76-18.72C371.36 151.12 304.4 80 224.24 80 134.8 80 66.08 150.48 66.08 236.36c0 71.76 25.92 133.68 48.96 167.28 2.88 4.32 7.92 6.72 13.2 6.72h.24c5.76 0 10.56-3.36 13.2-7.68 2.4-4.8 1.44-10.56-2.88-14.16a12 12 0 00-18.8 1.81z" strokeMiterlimit="10" />
          </Svg>
        );

      case 'moon':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M264 480A232 232 0 0132 248c0-94 54-178.28 137.61-214.67a16 16 0 0121.06 21.06C181.07 76.43 176 104.66 176 136c0 110.28 89.72 200 200 200 31.34 0 59.57-5.07 81.61-14.67a16 16 0 0121.06 21.06C442.28 426 358 480 264 480z" />
          </Svg>
        );

      case 'analytics':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M456 128a40 40 0 00-37.23 54.6l-84.17 84.17a39.86 39.86 0 00-29.2 0l-60.17-60.17a40 40 0 10-74.46 0L70.6 306.77a40 40 0 1022.63 22.63L193.4 229.23a39.86 39.86 0 0029.2 0l60.17 60.17a40 40 0 1074.46 0l84.17-84.17A40 40 0 10456 128z" />
          </Svg>
        );

      case 'help-circle':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192S362 64 256 64zm-6 304a20 20 0 1120-20 20 20 0 01-20 20zm33.44-102C267.23 276.88 265 286.85 265 296a14 14 0 01-28 0c0-21.91 10.08-39.33 30.82-53.26C287.1 229.8 298 221.6 298 203.57c0-12.26-7-21.57-21.49-28.46-3.41-1.62-11-3.2-20.34-3.09-11.72.15-20.82 2.95-27.83 8.59C215.12 191.25 214 202.83 214 203a14 14 0 11-28-1.35c.11-2.43 1.8-24.32 24.14-42.24 11.85-9.49 27.27-14.56 44.86-14.77a99.45 99.45 0 0127.94 3.6c21.17 10.05 31.06 24.75 31.06 46.33 0 34.42-23.44 47.78-36.56 55.43z" />
          </Svg>
        );

      case 'chatbox':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M408 64H104a56.16 56.16 0 00-56 56v192a56.16 56.16 0 0056 56h40v80l93.72-78.14a8 8 0 015.13-1.86H408a56.16 56.16 0 0056-56V120a56.16 56.16 0 00-56-56z" />
          </Svg>
        );

      case 'information-circle':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M256 56C145.72 56 56 145.72 56 256s89.72 200 200 200 200-89.72 200-200S366.28 56 256 56zm0 82a26 26 0 11-26 26 26 26 0 0126-26zm48 226h-88a16 16 0 010-32h28v-88h-16a16 16 0 010-32h32a16 16 0 0116 16v104h28a16 16 0 010 32z" />
          </Svg>
        );

      case 'log-out':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M304 336v40a40 40 0 01-40 40H104a40 40 0 01-40-40V136a40 40 0 0140-40h152c22.09 0 48 17.91 48 40v40M368 336l80-80-80-80M176 256h256" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'people-circle':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm-50.94 233.19c8.35-23.17 30.04-45.19 50.94-45.19s42.59 22.02 50.94 45.19a6 6 0 01-5.71 7.81H211.77a6 6 0 01-5.71-7.81zM205 192a51 51 0 1151-51 51 51 0 01-51 51zm152 134h-64a8 8 0 010-16h64a8 8 0 010 16zm0-40h-64a8 8 0 010-16h64a8 8 0 010 16z" />
          </Svg>
        );

      case 'briefcase':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M336 80H176a48 48 0 00-48 48v16H64a48 48 0 00-48 48v224a48 48 0 0048 48h384a48 48 0 0048-48V192a48 48 0 00-48-48h-64v-16a48 48 0 00-48-48zm-16 64H192v-16a16 16 0 0116-16h96a16 16 0 0116 16z" />
          </Svg>
        );

      case 'compass':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Circle cx="256" cy="256" r="24" />
            <Path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm105.07 113.33l-46.88 117.2a64 64 0 01-35.66 35.66l-117.2 46.88a8 8 0 01-10.4-10.4l46.88-117.2a64 64 0 0135.66-35.66l117.2-46.88a8 8 0 0110.4 10.4z" />
          </Svg>
        );

      case 'close':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M368 368L144 144M368 144L144 368" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'refresh':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M320 146s24.36-12-64-12a160 160 0 10160 160" strokeLinecap="round" strokeMiterlimit="10" />
            <Path d="M256 58l80 80-80 80" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'card':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M32 376a56 56 0 0056 56h336a56 56 0 0056-56V222H32zm66-76a30 30 0 0130-30h48a30 30 0 0130 30v20a30 30 0 01-30 30h-48a30 30 0 01-30-30zM424 80H88a56 56 0 00-56 56v26h448v-26a56 56 0 00-56-56z" />
          </Svg>
        );

      case 'lock-closed':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M368 192h-16v-80a96 96 0 10-192 0v80h-16a64.07 64.07 0 00-64 64v176a64.07 64.07 0 0064 64h224a64.07 64.07 0 0064-64V256a64.07 64.07 0 00-64-64zm-48 0H192v-80a64 64 0 11128 0z" />
          </Svg>
        );

      case 'business':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M432 176H320V64a48 48 0 00-48-48H80a48 48 0 00-48 48v416h448V224a48 48 0 00-48-48zM176 400H96v-48h80zm0-96H96v-48h80zm0-96H96v-48h80zm0-96H96V64h80zm80 288h-32v-48h32zm0-96h-32v-48h32zm0-96h-32v-48h32zm0-96h-32V64h32zm176 288H320v-48h112zm0-96H320v-48h112z" />
          </Svg>
        );

      case 'chevron-up':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="48">
            <Path d="M112 328l144-144 144 144" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'chevron-down':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="48">
            <Path d="M112 184l144 144 144-144" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'shield-checkmark':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M479.07 111.35a16 16 0 00-13.15-14.75C421.18 89.32 357.55 77.64 256 48c-101.55 29.64-165.18 41.32-209.92 48.6a16 16 0 00-13.15 14.75c-3.85 52.21-3.43 233.23 204.49 343.87a31.82 31.82 0 0037.16 0C482.5 344.58 482.92 163.56 479.07 111.35zM218.72 351.36l-25.44-25.45a16 16 0 0122.62-22.63l14.53 14.54 67.62-67.62a16 16 0 1122.62 22.62z" />
          </Svg>
        );

      case 'alert-circle':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm0 319.91a20 20 0 1120-20 20 20 0 01-20 20zm21.72-201.15l-5.74 122a16 16 0 01-32 0l-5.74-122a21.73 21.73 0 0121.5-22.69h.21a21.74 21.74 0 0121.73 22.7z" />
          </Svg>
        );

      case 'key':
      case 'key-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M218.1 167.17c0 13 0 25.6 4.1 37.4-43.1 50.6-156.9 184.3-167.5 194.5a20.17 20.17 0 00-6.7 15c0 8.5 5.2 16.7 9.6 21.3 6.6 6.9 34.8 33 40 28 15.4-15 18.5-19 24.8-25.2 9.5-9.3-1-28.3 2.3-36s6.8-9.2 12.5-10.4 15.8 2.9 23.7 3c8.3.1 12.8-3.4 19-9.2 5-4.6 8.6-8.9 8.7-15.6.2-9-12.8-20.9-3.1-30.4s23.7 6.2 34 5 22.8-15.5 24.1-21.6-11.7-21.8-9.7-30.7c.7-3 6.8-10 11.4-11s14 5.5 21.3 3.5 10.2-8.3 10.5-12.7-1.2-8.1-5.7-11.6c-4-3.2-7.2-8.9-6.4-14.8a13.69 13.69 0 015.2-9.3c6.6-5.7 15.4-3.3 20.2-8.9 4.2-4.8 2.7-11.4 3.4-16.9s4.3-12.2 8.8-15.6c5.5-4.1 12.3-4.9 18.2-4.5s12.5-.7 19.1-4.5c12.6-7.2 9.4-29.8 8.4-37.6" strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="400" cy="112" r="48" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
          </Svg>
        );

      case 'eye':
      case 'eye-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M255.66 112c-77.94 0-157.89 45.11-220.83 135.33a16 16 0 00-.27 17.77C82.92 340.8 161.8 400 255.66 400c92.84 0 173.34-59.38 221.79-135.25a16.14 16.14 0 000-17.47C428.89 172.28 347.8 112 255.66 112z" strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="256" cy="256" r="80" fill="none" stroke={color} strokeMiterlimit="10" strokeWidth="32" />
          </Svg>
        );

      case 'eye-off':
      case 'eye-off-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M432 448a15.92 15.92 0 01-11.31-4.69l-352-352a16 16 0 0122.62-22.62l352 352A16 16 0 01432 448zM255.66 384c-41.49 0-81.5-12.28-118.92-36.5-34.07-22-64.74-53.51-88.7-91a16 16 0 010-17.47c23.96-37.5 54.63-69 88.7-91 13.23-8.58 27.11-16 41.63-22.1M382.37 265.38c8.68-13.47 15.11-27.08 18.88-40.38a16 16 0 01.27-17.77C351.18 157.11 306.73 112 229.12 112a188.57 188.57 0 00-46.47 5.77" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M201.11 232a64 64 0 0078.89 78.89M332.12 279.88a80 80 0 00-100-100" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" />
          </Svg>
        );

      case 'mail-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Rect x="48" y="96" width="416" height="320" rx="40" ry="40" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M112 160l144 112 144-112" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'person-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304z" strokeMiterlimit="10" />
          </Svg>
        );

      case 'lock-closed-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M336 208v-95a80 80 0 00-160 0v95" strokeLinecap="round" strokeLinejoin="round" />
            <Rect x="96" y="208" width="320" height="272" rx="48" ry="48" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'share':
      case 'share-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M336 192h40a40 40 0 0140 40v192a40 40 0 01-40 40H136a40 40 0 01-40-40V232a40 40 0 0140-40h40M336 128l-80-80-80 80M256 321V48" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'refresh-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M320 146s24.36-12-64-12a160 160 0 10160 160" strokeLinecap="round" strokeMiterlimit="10" />
            <Path d="M256 58l80 80-80 80" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'close-circle':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm75.31 260.69a16 16 0 11-22.62 22.62L256 278.63l-52.69 52.68a16 16 0 01-22.62-22.62L233.37 256l-52.68-52.69a16 16 0 0122.62-22.62L256 233.37l52.69-52.68a16 16 0 0122.62 22.62L278.63 256z" />
          </Svg>
        );

      case 'people-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M402 168c-2.93 40.67-33.1 72-66 72s-63.12-31.32-66-72c-3-42.31 26.37-72 66-72s69 30.46 66 72z" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M336 304c-65.17 0-127.84 32.37-143.54 95.41-2.08 8.34 3.15 16.59 11.72 16.59h263.65c8.57 0 13.77-8.25 11.72-16.59C463.85 336.36 401.18 304 336 304z" strokeMiterlimit="10" />
            <Path d="M200 185.94c-2.34 32.48-26.72 58.06-53 58.06s-50.7-25.57-53-58.06C91.61 152.15 115.34 128 147 128s55.39 24.77 53 57.94z" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M206 306c-18.05-8.27-37.93-11.45-59-11.45-52 0-102.1 25.85-114.65 76.2-1.65 6.66 2.53 13.25 9.37 13.25H154" strokeLinecap="round" strokeMiterlimit="10" />
          </Svg>
        );

      case 'add-circle':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm80 224h-64v64a16 16 0 01-32 0v-64h-64a16 16 0 010-32h64v-64a16 16 0 0132 0v64h64a16 16 0 010 32z" />
          </Svg>
        );

      case 'enter':
      case 'enter-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M176 176v-40a40 40 0 0140-40h208a40 40 0 0140 40v240a40 40 0 01-40 40H216a40 40 0 01-40-40v-40" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M272 336l80-80-80-80M48 256h288" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'send':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
            <Path d="M476.59 227.05l-.16-.07L49.35 49.84A23.56 23.56 0 0027.14 52 24.65 24.65 0 0016 72.59v113.29a24 24 0 0019.52 23.57l232.93 43.07a4 4 0 010 7.86L35.53 303.45A24 24 0 0016 327v113.28A23.57 23.57 0 0026.59 460a23.94 23.94 0 0013.22 4 24.55 24.55 0 009.52-1.93L476.4 285.94l.19-.09a32 32 0 000-58.8z" />
          </Svg>
        );

      case 'ribbon':
      case 'ribbon-outline':
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color} strokeWidth="32">
            <Path d="M256 336c44.18 0 80-35.82 80-80s-35.82-80-80-80-80 35.82-80 80 35.82 80 80 80z" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M256 176a80.1 80.1 0 0156.57 23.43L416 96H96l103.43 103.43A80.1 80.1 0 01256 176z" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M432 208l-93.66 93.66a112 112 0 01-158.68 0L80 208M166 336l-58 202 88-88 60 60 60-60 88 88-58-202" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      default:
        // Fallback: simple circle
        return (
          <Svg width={size} height={size} viewBox="0 0 512 512">
            <Circle cx="256" cy="256" r="200" fill="none" stroke={color} strokeWidth="32" />
          </Svg>
        );
    }
  };

  return <View style={style}>{getSvgPath(name)}</View>;
};

export default SvgIcon;
