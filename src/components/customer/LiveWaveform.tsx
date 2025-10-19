"use client";

import React, { useState, useEffect, useRef } from "react";

// Utility function to conditionally join class names
const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

interface LiveWaveformProps {
  active?: boolean;
  processing?: boolean;
  deviceId?: string;
  barColor?: string;
  fadeEdges?: boolean;
  fadeWidth?: number;
  height?: number | string;
  sensitivity?: number;
  smoothingTimeConstant?: number;
  fftSize?: number;
  historySize?: number;
  updateRate?: number;
  mode?: "static" | "scrolling";
  onError?: (error: Error) => void;
  onStreamReady?: (stream: MediaStream) => void;
  onStreamEnd?: () => void;
  className?: string;
  [key: string]: any;
}

// A live audio waveform visualizer component for React.
const LiveWaveform: React.FC<LiveWaveformProps> = ({
  active = false,
  processing = false,
  deviceId,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  height = 64,
  sensitivity = 1,
  smoothingTimeConstant = 0.8,
  fftSize = 256,
  historySize = 100,
  updateRate = 10,
  mode = "static",
  onError,
  onStreamReady,
  onStreamEnd,
  className,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<number[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const processingAnimationRef = useRef<number | null>(null);
  const lastActiveDataRef = useRef<number[]>([]);
  const transitionProgressRef = useRef<number>(0);
  const staticBarsRef = useRef<number[]>([]);
  const smoothedBarsRef = useRef<number[]>([]); // For smoother animations
  const needsRedrawRef = useRef<boolean>(true);
  const gradientCacheRef = useRef<CanvasGradient | null>(null);
  const lastWidthRef = useRef<number>(0);

  const heightStyle = typeof height === "number" ? `${height}px` : height;

  // Handle canvas resizing to fit its container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Invalidate gradient cache on resize
      gradientCacheRef.current = null;
      lastWidthRef.current = rect.width;
      needsRedrawRef.current = true;
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Handle processing and idle animations
  useEffect(() => {
    if (processing && !active) {
      let time = 0;
      transitionProgressRef.current = 0;

      const animateProcessing = () => {
        time += 0.03;
        transitionProgressRef.current = Math.min(
          1,
          transitionProgressRef.current + 0.02
        );

        const processingData: number[] = [];
        const barCount = 15; // Fixed bar count for processing animation

        // Generate a synthetic wave for the processing state
        for (let i = 0; i < barCount; i++) {
          const normalizedPosition = (i - barCount / 2) / (barCount / 2);
          const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4;
          const wave1 = Math.sin(time * 1.5 + normalizedPosition * 3) * 0.25;
          const wave2 = Math.sin(time * 0.8 - normalizedPosition * 2) * 0.2;
          const wave3 = Math.cos(time * 2 + normalizedPosition) * 0.15;
          const combinedWave = wave1 + wave2 + wave3;
          const processingValue = (0.2 + combinedWave) * centerWeight;

          // Smoothly transition from last active data to processing animation
          let finalValue = processingValue;
          if (
            lastActiveDataRef.current.length > 0 &&
            transitionProgressRef.current < 1
          ) {
            const lastDataIndex = Math.min(
              i,
              lastActiveDataRef.current.length - 1
            );
            const lastValue = lastActiveDataRef.current[lastDataIndex] || 0;
            finalValue =
              lastValue * (1 - transitionProgressRef.current) +
              processingValue * transitionProgressRef.current;
          }
          processingData.push(Math.max(0.05, Math.min(1, finalValue)));
        }

        if (mode === "static") {
          staticBarsRef.current = processingData;
        } else {
          historyRef.current = processingData;
        }

        needsRedrawRef.current = true;
        processingAnimationRef.current =
          requestAnimationFrame(animateProcessing);
      };

      animateProcessing();

      return () => {
        if (processingAnimationRef.current) {
          cancelAnimationFrame(processingAnimationRef.current);
        }
      };
    } else if (!active && !processing) {
      // Fade out the bars to an idle state when not active or processing
      const hasData = mode === "static" ?
        staticBarsRef.current.length > 0 :
        historyRef.current.length > 0;

      if (hasData) {
        let fadeProgress = 0;
        const fadeToIdle = () => {
          fadeProgress = Math.min(1, fadeProgress + 0.03);
          if (fadeProgress < 1) {
            const mapper = (value: number) => value * (1 - fadeProgress);
            if (mode === "static") {
              staticBarsRef.current = staticBarsRef.current.map(mapper);
            } else {
              historyRef.current = historyRef.current.map(mapper);
            }
            needsRedrawRef.current = true;
            requestAnimationFrame(fadeToIdle);
          } else {
            // Clear data after fade-out is complete
            if (mode === "static") {
              staticBarsRef.current = [];
            } else {
              historyRef.current = [];
            }
            needsRedrawRef.current = true; // Final clear draw
          }
        };
        fadeToIdle();
      }
    }
  }, [processing, active, mode]);

  // Handle microphone setup and teardown
  useEffect(() => {
    const cleanup = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        onStreamEnd?.();
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };

    if (!active) {
      cleanup();
      return;
    }

    const setupMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ?
            {
              deviceId: { exact: deviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            } :
            {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
        });
        streamRef.current = stream;
        onStreamReady?.(stream);

        const AudioContextConstructor =
          window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextConstructor();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        // Clear history when starting a new stream
        historyRef.current = [];
        staticBarsRef.current = [];
        smoothedBarsRef.current = [];

      } catch (error) {
        onError?.(error as Error);
      }
    };

    setupMicrophone();

    return cleanup;
  }, [
    active,
    deviceId,
    fftSize,
    smoothingTimeConstant,
    onError,
    onStreamReady,
    onStreamEnd,
  ]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    const animate = (currentTime: number) => {
      const rect = canvas.getBoundingClientRect();

      // Update audio data if active and enough time has passed
      if (active && currentTime - lastUpdateRef.current > updateRate) {
        lastUpdateRef.current = currentTime;

        if (analyserRef.current) {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount
          );
          analyserRef.current.getByteFrequencyData(dataArray);

          if (mode === "static") {
            const startFreq = Math.floor(dataArray.length * 0.05);
            const endFreq = Math.floor(dataArray.length * 0.4);
            const relevantData = dataArray.slice(startFreq, endFreq);

            const barCount = 15;
            const halfCount = Math.floor(barCount / 2);
            const newBars = new Array(barCount);

            // Center bar reacts to the lowest frequencies
            const centerValue = (relevantData[0] / 255) * sensitivity;
            newBars[halfCount] = Math.max(0.05, Math.min(1, centerValue));

            // Side bars expand outwards with higher frequencies
            for (let i = 1; i <= halfCount; i++) {
              // Map distance from center 'i' to an index in the frequency data
              const dataIndex = Math.floor((i / halfCount) * (relevantData.length - 1));
              const value = (relevantData[dataIndex] / 255) * sensitivity;
              const finalValue = Math.max(0.05, Math.min(1, value));

              // Assign to symmetrical bars on the left and right
              newBars[halfCount - i] = finalValue;
              newBars[halfCount + i] = finalValue;
            }

            staticBarsRef.current = newBars;
            lastActiveDataRef.current = newBars;
          } else { // Scrolling mode
            const startFreq = Math.floor(dataArray.length * 0.05);
            const endFreq = Math.floor(dataArray.length * 0.4);
            const relevantData = dataArray.slice(startFreq, endFreq);
            let sum = 0;
            for (let i = 0; i < relevantData.length; i++) {
              sum += relevantData[i];
            }
            const average = (sum / relevantData.length / 255) * sensitivity;

            // Smooth the incoming value for more fluid height changes
            const lastValue = historyRef.current[historyRef.current.length - 1] || average;
            const smoothingFactor = 0.4;
            const smoothedValue = lastValue + (average - lastValue) * smoothingFactor;

            historyRef.current.push(Math.min(1, Math.max(0.05, smoothedValue)));
            lastActiveDataRef.current = [...historyRef.current];
            if (historyRef.current.length > historySize) {
              historyRef.current.shift();
            }
          }
          needsRedrawRef.current = true;
        }
      }

      // Apply smoothing to bar height transitions for a fluid animation
      if (active && mode === 'static') {
        const targetBars = staticBarsRef.current;
        let currentBars = smoothedBarsRef.current;

        if (currentBars.length !== targetBars.length) {
          currentBars = Array(targetBars.length).fill(0);
        }

        const smoothingFactor = 0.2; // Adjust for more or less smoothness
        smoothedBarsRef.current = targetBars.map((target, i) => {
          const current = currentBars[i] || 0;
          return current + (target - current) * smoothingFactor;
        });
      }

      if (!needsRedrawRef.current && !active && !processing) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      needsRedrawRef.current = active || processing;
      ctx.clearRect(0, 0, rect.width, rect.height);

      const computedBarColor =
        barColor || getComputedStyle(canvas).color || "#000";

      const barCount = 15;
      const step = rect.width / barCount;
      const barWidth = step * 0.7;
      const barRadius = barWidth / 2;
      const centerY = rect.height / 2;

      if (mode === "static") {
        const dataToRender = active ? smoothedBarsRef.current : staticBarsRef.current;
        for (let i = 0; i < dataToRender.length; i++) {
          const value = dataToRender[i] || 0;
          const x = i * step + (step - barWidth) / 2;
          const barHeight = Math.max(barRadius * 2, value * rect.height * 0.9);
          const y = centerY - barHeight / 2;

          ctx.fillStyle = computedBarColor;
          ctx.globalAlpha = 0.4 + value * 0.6;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }
      } else { // Scrolling mode
        const dataToRender = historyRef.current;

        // Calculate the interpolation progress between data updates for smooth scrolling
        const timeSinceLastUpdate = currentTime - lastUpdateRef.current;
        const updateProgress = active ? Math.min(timeSinceLastUpdate / updateRate, 1.0) : 0;
        const offset = updateProgress * step;

        // Draw one extra bar which is scrolling into view from the right
        const barsToDraw = Math.min(barCount + 1, dataToRender.length);

        for (let i = 0; i < barsToDraw; i++) {
          const dataIndex = dataToRender.length - 1 - i;
          const value = dataToRender[dataIndex] || 0;
          // Apply the offset to the x position for a smooth slide effect
          const x = rect.width - (i * step) - barWidth - (step - barWidth) / 2 + offset;
          const barHeight = Math.max(barRadius * 2, value * rect.height * 0.9);
          const y = centerY - barHeight / 2;

          ctx.fillStyle = computedBarColor;
          ctx.globalAlpha = 0.4 + value * 0.6;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }
      }

      // Apply fade effect to the edges of the canvas
      if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
        if (!gradientCacheRef.current || lastWidthRef.current !== rect.width) {
          const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
          const fadePercent = Math.min(0.3, fadeWidth / rect.width);
          gradient.addColorStop(0, "rgba(255,255,255,1)");
          gradient.addColorStop(fadePercent, "rgba(255,255,255,0)");
          gradient.addColorStop(1 - fadePercent, "rgba(255,255,255,0)");
          gradient.addColorStop(1, "rgba(255,255,255,1)");
          gradientCacheRef.current = gradient;
          lastWidthRef.current = rect.width;
        }
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = gradientCacheRef.current;
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    active,
    processing,
    sensitivity,
    updateRate,
    historySize,
    barColor,
    fadeEdges,
    fadeWidth,
    mode,
    height
  ]);

  return (
    <div
      className={cn("relative w-full", className)}
      ref={containerRef}
      style={{ height: heightStyle }}
      aria-label={
        active ?
        "Live audio waveform" :
        processing ?
        "Processing audio" :
        "Audio waveform idle"
      }
      role="img"
      {...props}
    >
      {!active && !processing && staticBarsRef.current.length === 0 && (
        <div className="border-gray-400/20 absolute top-1/2 right-0 left-0 -translate-y-1/2 border-t-2 border-dotted" />
      )}
      <canvas
        className="block h-full w-full"
        ref={canvasRef}
        aria-hidden="true"
      />
    </div>
  );
};

export default LiveWaveform;