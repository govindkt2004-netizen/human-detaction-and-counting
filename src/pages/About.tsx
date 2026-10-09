import React from 'react';
import {
  BookOpen,
  Cpu,
  ExternalLink,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-4xl mx-auto">
      {/* Top Banner / Heading */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          About & Machine Learning Architecture
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Engineering design, computer vision pipelines, neural network architecture, and privacy specifications.
        </p>
      </div>

      {/* Main Info Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            HD
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Human Detection & Counting
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Real-Time Browser-Based Computer Vision Analytics
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Inspired by Google AI Edge's modern MediaPipe Web Task architecture, this system provides a
          dedicated, production-grade human detection and population counting platform. It combines
          state-of-the-art quantized neural network weights (TensorFlow Lite) with client-side WebAssembly
          and WebGL GPU shaders to achieve high framerates with zero server-side round trips.
        </p>

        {/* Person Detection vs Face Detection distinction */}
        <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-300">
            <Users className="w-4 h-4 text-sky-500" />
            <span>Whole-Body Person Detection vs. Face Detection</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Unlike simple facial landmark detectors that only recognize frontal human faces, this
            system executes full-body Object Detection configured with a strict{' '}
            <code className="bg-white/60 dark:bg-slate-900/60 px-1 py-0.5 rounded font-mono text-[11px]">
              categoryAllowlist: ['person']
            </code>
            . It recognizes individuals in standing, seated, walking, and partially occluded poses
            from various camera angles and distances.
          </p>
        </div>
      </div>

      {/* Pipeline Specifications */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Core Technology Stack
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>MediaPipe Tasks Vision</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Utilizes <code className="font-mono text-slate-700 dark:text-slate-300">@mediapipe/tasks-vision</code> with
              dynamic WebAssembly runtime and WebGL GPU acceleration for instantaneous inference.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <span>Lightweight Centroid & IoU Tracking</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Maintains unique person IDs across frames by evaluating bounding box intersection-over-union
              (IoU) and normalized Euclidean distance, preventing duplicate counts.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Spatial Counting & Corridors</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Supports virtual counting lines with direction vectors (Entered / Exited) and
              customizable Regions of Interest (Detection Zones) for foot-traffic analysis.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <span>Zero-Cloud Privacy Guarantee</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              All video frames and photos are analyzed locally in browser memory. No media is
              uploaded to remote servers, and no facial biometric records are generated.
            </p>
          </div>
        </div>
      </div>

      {/* External References & Docs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Official Documentation & References
        </h4>
        <div className="space-y-2 text-xs">
          <a
            href="https://ai.google.dev/edge/mediapipe/solutions/vision/object_detector/web_js"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                MediaPipe Object Detector Web Guide
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="https://google-ai-edge.github.io/mediapipe-samples-web/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Google AI Edge MediaPipe Web Samples
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
