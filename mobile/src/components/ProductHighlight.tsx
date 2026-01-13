import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedObject {
  name: string;
  boundingBox: BoundingBox;
  confidence: number;
}

interface ProductHighlightProps {
  imageUri: string;
  detectedObjects?: DetectedObject[];
  imageWidth?: number;
  imageHeight?: number;
  highlightColor?: string;
  showCorners?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * ProductHighlight Component
 * 
 * Displays an image with bounding boxes highlighting detected objects
 * Similar to Appediet's product highlighting feature
 * 
 * Usage:
 * <ProductHighlight 
 *   imageUri={capturedImage}
 *   detectedObjects={scanResult.detectedObjects}
 *   highlightColor="#00ff00"
 * />
 */
export default function ProductHighlight({
  imageUri,
  detectedObjects = [],
  imageWidth = SCREEN_WIDTH,
  imageHeight = SCREEN_WIDTH * 1.5,
  highlightColor = '#00ff00',
  showCorners = true,
}: ProductHighlightProps) {
  
  if (!imageUri) {
    return null;
  }

  return (
    <View style={[styles.container, { width: imageWidth, height: imageHeight }]}>
      {/* Base Image */}
      <Image 
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="cover"
      />
      
      {/* SVG Overlay for Bounding Boxes */}
      {detectedObjects.length > 0 && (
        <Svg 
          style={StyleSheet.absoluteFill}
          width={imageWidth}
          height={imageHeight}
        >
          {detectedObjects.map((obj, index) => {
            const { x, y, width, height } = obj.boundingBox;
            const cornerSize = 20;
            const strokeWidth = 3;
            
            return (
              <React.Fragment key={index}>
                {/* Main Bounding Box */}
                <Rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  stroke={highlightColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  opacity={0.8}
                />
                
                {/* Corner Accents (like Appediet style) */}
                {showCorners && (
                  <>
                    {/* Top-Left Corner */}
                    <Rect
                      x={x - strokeWidth / 2}
                      y={y - strokeWidth / 2}
                      width={cornerSize}
                      height={strokeWidth * 2}
                      fill={highlightColor}
                    />
                    <Rect
                      x={x - strokeWidth / 2}
                      y={y - strokeWidth / 2}
                      width={strokeWidth * 2}
                      height={cornerSize}
                      fill={highlightColor}
                    />
                    
                    {/* Top-Right Corner */}
                    <Rect
                      x={x + width - cornerSize + strokeWidth / 2}
                      y={y - strokeWidth / 2}
                      width={cornerSize}
                      height={strokeWidth * 2}
                      fill={highlightColor}
                    />
                    <Rect
                      x={x + width - strokeWidth / 2}
                      y={y - strokeWidth / 2}
                      width={strokeWidth * 2}
                      height={cornerSize}
                      fill={highlightColor}
                    />
                    
                    {/* Bottom-Left Corner */}
                    <Rect
                      x={x - strokeWidth / 2}
                      y={y + height - strokeWidth}
                      width={cornerSize}
                      height={strokeWidth * 2}
                      fill={highlightColor}
                    />
                    <Rect
                      x={x - strokeWidth / 2}
                      y={y + height - cornerSize + strokeWidth / 2}
                      width={strokeWidth * 2}
                      height={cornerSize}
                      fill={highlightColor}
                    />
                    
                    {/* Bottom-Right Corner */}
                    <Rect
                      x={x + width - cornerSize + strokeWidth / 2}
                      y={y + height - strokeWidth}
                      width={cornerSize}
                      height={strokeWidth * 2}
                      fill={highlightColor}
                    />
                    <Rect
                      x={x + width - strokeWidth / 2}
                      y={y + height - cornerSize + strokeWidth / 2}
                      width={strokeWidth * 2}
                      height={cornerSize}
                      fill={highlightColor}
                    />
                    
                    {/* Center Dot */}
                    <Circle
                      cx={x + width / 2}
                      cy={y + height / 2}
                      r={4}
                      fill={highlightColor}
                      opacity={0.6}
                    />
                  </>
                )}
                
                {/* Glow Effect (optional) */}
                <Rect
                  x={x - 2}
                  y={y - 2}
                  width={width + 4}
                  height={height + 4}
                  stroke={highlightColor}
                  strokeWidth={1}
                  fill="none"
                  opacity={0.3}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
