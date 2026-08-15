import React from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { iconLibrary } from '../lib/content';
import { colors } from '../lib/theme';

type Props = { name?: string | null; size?: number; color?: ColorValue };

const num = (v?: string) => (v === undefined ? undefined : Number(v));

export default function Icon({ name, size = 20, color = colors.accent }: Props) {
  const def = name ? iconLibrary[name] : undefined;
  const shape = def ?? iconLibrary.paw;
  if (!shape) return null;
  const common = {
    stroke: color,
    fill: 'none',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox={shape.viewBox}>
      {shape.els.map((el, i) => {
        const a = el.attrs;
        const dash = a['stroke-dasharray'];
        const extra = dash ? { strokeDasharray: dash } : {};
        switch (el.tag) {
          case 'path':
            return <Path key={i} d={a.d} {...common} {...extra} />;
          case 'circle':
            return <Circle key={i} cx={num(a.cx)} cy={num(a.cy)} r={num(a.r)} {...common} {...extra} />;
          case 'ellipse':
            return (
              <Ellipse key={i} cx={num(a.cx)} cy={num(a.cy)} rx={num(a.rx)} ry={num(a.ry)} {...common} {...extra} />
            );
          case 'rect':
            return (
              <Rect
                key={i}
                x={num(a.x)}
                y={num(a.y)}
                width={num(a.width)}
                height={num(a.height)}
                rx={num(a.rx)}
                {...common}
                {...extra}
              />
            );
          default:
            return null;
        }
      })}
    </Svg>
  );
}
