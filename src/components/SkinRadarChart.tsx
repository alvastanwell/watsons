import React, { useState } from 'react';
import { VisualRadarDimension, OpticalDimensionKey, Language } from '../types';

interface SkinRadarChartProps {
  dimensions: VisualRadarDimension[];
  language: Language;
  className?: string;
}

export const SkinRadarChart: React.FC<SkinRadarChartProps> = ({
  dimensions,
  language,
  className = ''
}) => {
  const isZh = language === 'zh';
  const [selectedKey, setSelectedKey] = useState<OpticalDimensionKey | null>(null);

  // Default dimension mapping fallback if array is missing or unordered
  const standardKeys: OpticalDimensionKey[] = [
    'visibleShine',
    'visibleRedness',
    'unevenTone',
    'visibleTexture',
    'visiblePores',
    'visibleFineLines'
  ];

  const standardLabels: Record<OpticalDimensionKey, { en: string; zh: string }> = {
    visibleShine: { en: 'Visible Shine', zh: '可见油光' },
    visibleRedness: { en: 'Visible Redness', zh: '可见泛红' },
    unevenTone: { en: 'Uneven Tone', zh: '肤色不均' },
    visibleTexture: { en: 'Visible Texture', zh: '可见纹理' },
    visiblePores: { en: 'Visible Pores', zh: '毛孔可见度' },
    visibleFineLines: { en: 'Visible Fine Lines', zh: '细纹可见度' }
  };

  const orderedDimensions: VisualRadarDimension[] = standardKeys.map((k) => {
    const found = dimensions?.find((d) => d.key === k);
    if (found) return found;
    return {
      key: k,
      name: standardLabels[k].en,
      nameZh: standardLabels[k].zh,
      level: null,
      levelLabel: 'Cannot assess',
      levelLabelZh: '无法评估',
      canAssess: false,
      evidence: 'No optical data available.',
      evidenceZh: '未采集有效实拍照片。',
      facialArea: 'Facial zone',
      facialAreaZh: '面部对应区域',
      limitations: 'Missing image evidence.',
      limitationsZh: '缺乏有效实拍图像。'
    };
  });

  const width = 280;
  const height = 240;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 68;
  const totalAxes = 6;

  // Helper to calculate (x, y) coordinates for an axis index and normalized value [0, 1]
  const getCoordinates = (index: number, normalizedValue: number, rOffset = 0) => {
    const angle = ((Math.PI * 2) / totalAxes) * index - Math.PI / 2;
    const r = radius * normalizedValue + rOffset;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  // Concentric polygon web levels (0 to 4 scale -> 0.25, 0.5, 0.75, 1.0)
  const webLevels = [0.25, 0.5, 0.75, 1.0];
  const webPaths = webLevels.map((lvl) => {
    return standardKeys
      .map((_, i) => {
        const { x, y } = getCoordinates(i, lvl);
        return `${x},${y}`;
      })
      .join(' ');
  });

  // Check if all 6 dimensions have valid assessed levels
  const allAssessed = orderedDimensions.every(
    (d) => d.canAssess && typeof d.level === 'number' && d.level >= 0 && d.level <= 4
  );

  const availableCount = orderedDimensions.filter(
    (d) => d.canAssess && typeof d.level === 'number'
  ).length;

  // Complete data polygon (ONLY if all 6 dimensions are assessed)
  const completePolygonPoints = allAssessed
    ? orderedDimensions
        .map((dim, i) => {
          const val = typeof dim.level === 'number' ? Math.max(0.08, dim.level / 4) : 0.08;
          const { x, y } = getCoordinates(i, val);
          return `${x},${y}`;
        })
        .join(' ')
    : '';

  const activeDetail = selectedKey
    ? orderedDimensions.find((d) => d.key === selectedKey) || null
    : null;

  return (
    <div className={`w-full rounded-3xl bg-white border border-[#e5f1f3] p-4 flex flex-col space-y-3 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#f0f9fa]">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-[#0099A7]">radar</span>
          <h4 className="font-headline font-bold text-xs text-[#1f2937]">
            {isZh ? '六维外观表现雷达估计' : 'Six-Dimension Visual Radar'}
          </h4>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          allAssessed
            ? 'bg-[#f0f9fa] text-[#0099A7] border border-[#d0eff3]'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {allAssessed
            ? (isZh ? '6维光学完成' : '6/6 Assessed')
            : (isZh ? `${availableCount}/6 可用 (数据不全不闭合)` : `${availableCount}/6 Available`)}
        </span>
      </div>

      {/* SVG Radar Chart Display */}
      <div className="relative w-full flex flex-col items-center justify-center pt-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[270px] h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="watsonsRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0099A7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0099A7" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Concentric grid webs */}
          {webPaths.map((pts, idx) => (
            <polygon
              key={idx}
              points={pts}
              fill="none"
              stroke="#d0eff3"
              strokeWidth={idx === webLevels.length - 1 ? '1.5' : '1'}
              strokeDasharray={idx === webLevels.length - 1 ? 'none' : '3,3'}
              opacity={0.8}
            />
          ))}

          {/* Radial axis lines */}
          {orderedDimensions.map((dim, i) => {
            const { x, y } = getCoordinates(i, 1.0);
            const isAvailable = dim.canAssess && typeof dim.level === 'number';
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke={isAvailable ? '#0099A7' : '#cbd5e1'}
                strokeWidth={isAvailable ? '1.2' : '1'}
                strokeDasharray={isAvailable ? 'none' : '3,3'}
                opacity={isAvailable ? 0.6 : 0.4}
              />
            );
          })}

          {/* Data Polygon: RENDERED ONLY WHEN DATA IS 100% COMPLETE */}
          {allAssessed && completePolygonPoints && (
            <polygon
              points={completePolygonPoints}
              fill="url(#watsonsRadarFill)"
              stroke="#0099A7"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          )}

          {/* If data is incomplete: Draw unconnected line segments between adjacent points if available */}
          {!allAssessed && availableCount > 1 && (
            <g>
              {orderedDimensions.map((dim, i) => {
                const nextIdx = (i + 1) % totalAxes;
                const nextDim = orderedDimensions[nextIdx];
                if (
                  dim.canAssess && typeof dim.level === 'number' &&
                  nextDim.canAssess && typeof nextDim.level === 'number'
                ) {
                  const p1 = getCoordinates(i, Math.max(0.08, dim.level / 4));
                  const p2 = getCoordinates(nextIdx, Math.max(0.08, nextDim.level / 4));
                  return (
                    <line
                      key={`seg_${i}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#0099A7"
                      strokeWidth="2"
                      strokeDasharray="4,3"
                    />
                  );
                }
                return null;
              })}
            </g>
          )}

          {/* Vertices Dots & Tappable Hit Targets */}
          {orderedDimensions.map((dim, i) => {
            const isAvailable = dim.canAssess && typeof dim.level === 'number';
            const normalized = isAvailable ? Math.max(0.08, (dim.level as number) / 4) : 0.08;
            const pt = getCoordinates(i, normalized);
            const isSelected = selectedKey === dim.key;

            return (
              <g
                key={`vert_${dim.key}`}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => setSelectedKey(isSelected ? null : dim.key)}
              >
                {/* Hit area */}
                <circle cx={pt.x} cy={pt.y} r="10" fill="transparent" />
                {/* Visual dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? '5.5' : '4'}
                  fill={isAvailable ? (isSelected ? '#007d89' : '#0099A7') : '#94a3b8'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* Axis Labels & Values around perimeter */}
          {orderedDimensions.map((dim, i) => {
            const labelPos = getCoordinates(i, 1.0, 18);
            const isAvailable = dim.canAssess && typeof dim.level === 'number';
            const isSelected = selectedKey === dim.key;
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (i === 1 || i === 2) textAnchor = 'start';
            else if (i === 4 || i === 5) textAnchor = 'end';

            return (
              <g
                key={`label_${dim.key}`}
                transform={`translate(${labelPos.x}, ${labelPos.y})`}
                className="cursor-pointer"
                onClick={() => setSelectedKey(isSelected ? null : dim.key)}
              >
                <text
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className={`text-[10px] font-medium transition-colors ${
                    isSelected ? 'fill-[#0099A7] font-bold' : isAvailable ? 'fill-[#1f2937]' : 'fill-[#94a3b8]'
                  }`}
                >
                  {isZh ? dim.nameZh : dim.name}
                  <tspan className={`font-mono font-bold ml-1 ${
                    isAvailable ? 'fill-[#0099A7]' : 'fill-[#94a3b8]'
                  }`}>
                    {' '}
                    {isAvailable ? `${dim.level}/4` : (isZh ? '无法评估' : 'N/A')}
                  </tspan>
                </text>
              </g>
            );
          })}
        </svg>

        {/* Notice when data is incomplete */}
        {!allAssessed && (
          <p className="text-[10px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 mt-1">
            {isZh
              ? '部分维度缺乏实拍依据，已如实标注为无法评估，不绘制虚假闭合多边形。'
              : 'Some dimensions lack sufficient image evidence and are shown as unavailable.'}
          </p>
        )}
      </div>

      {/* Mandatory Regulatory & Disclosure Label below chart */}
      <div className="text-center pt-0.5">
        <p className="text-[11px] font-medium text-[#4b5563]">
          {isZh
            ? '“AI外观估计，仅供护肤参考，非仪器测量或医疗诊断。”'
            : '"AI appearance estimate for skincare reference only, not an instrument measurement or medical diagnosis."'}
        </p>
      </div>

      {/* Interactive 6-Dimension Chips (Tappable for Details) */}
      <div className="space-y-1.5 pt-1 border-t border-[#f0f9fa]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#6b7280]">
            {isZh ? '点击任一维度查看表观依据与局限：' : 'Tap a dimension to view evidence & limitations:'}
          </span>
          {selectedKey && (
            <button
              onClick={() => setSelectedKey(null)}
              className="text-[10px] text-[#0099A7] hover:underline"
              type="button"
            >
              {isZh ? '收起详情' : 'Close'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {orderedDimensions.map((dim) => {
            const isSelected = selectedKey === dim.key;
            const isAvailable = dim.canAssess && typeof dim.level === 'number';
            return (
              <button
                key={dim.key}
                onClick={() => setSelectedKey(isSelected ? null : dim.key)}
                className={`py-1.5 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all border ${
                  isSelected
                    ? 'bg-[#0099A7] text-white border-[#0099A7] shadow-xs'
                    : isAvailable
                    ? 'bg-[#f0f9fa] text-[#1f2937] border-[#d0eff3] hover:bg-[#e0f5f7]'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}
                type="button"
              >
                <span className="text-[10px] font-semibold truncate w-full px-0.5">
                  {isZh ? dim.nameZh : dim.name}
                </span>
                <span className={`text-[9px] font-mono font-bold mt-0.5 ${
                  isSelected ? 'text-white' : isAvailable ? 'text-[#0099A7]' : 'text-gray-400'
                }`}>
                  {isAvailable ? `${dim.level}级 (0-4)` : (isZh ? '无法评估' : 'N/A')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inspector Details Card (Appears on Tap) */}
      {activeDetail && (
        <div className="p-3 bg-[#f0f9fa] rounded-2xl border border-[#d0eff3] text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between pb-1 border-b border-[#d0eff3]/60">
            <span className="font-bold text-[#1f2937] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#0099A7]">search_insights</span>
              <span>{isZh ? activeDetail.nameZh : activeDetail.name}</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeDetail.canAssess
                ? 'bg-[#0099A7] text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {activeDetail.canAssess
                ? (isZh ? activeDetail.levelLabelZh || `${activeDetail.level}级` : activeDetail.levelLabel || `Level ${activeDetail.level}`)
                : (isZh ? '无法评估' : 'Cannot assess')}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-[#4b5563]">
            <p>
              <span className="font-semibold text-[#1f2937]">{isZh ? '观察区域：' : 'Facial Area: '}</span>
              {isZh ? activeDetail.facialAreaZh : activeDetail.facialArea}
            </p>
            <p>
              <span className="font-semibold text-[#1f2937]">{isZh ? '表观依据：' : 'Visible Evidence: '}</span>
              {isZh ? activeDetail.evidenceZh : activeDetail.evidence}
            </p>
            <p className="text-[10px] text-[#6b7280]">
              <span className="font-semibold text-[#4b5563]">{isZh ? '环境与画质局限：' : 'Limitations: '}</span>
              {isZh ? activeDetail.limitationsZh : activeDetail.limitations}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
