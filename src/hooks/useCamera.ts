import { useCallback, useEffect, useRef, useState } from 'react';

export interface CameraState {
  isActive: boolean;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CameraState>({
    isActive: false,
    isPaused: false,
    isLoading: false,
    error: null,
    devices: [],
    selectedDeviceId: '',
  });

  // Enumerate video devices
  const updateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setState((prev) => ({
        ...prev,
        devices: videoDevices,
        selectedDeviceId: prev.selectedDeviceId || videoDevices[0]?.deviceId || '',
      }));
    } catch (e) {
      console.warn('Failed to enumerate devices:', e);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
      isLoading: false,
    }));
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      stopCamera();

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Webcam access is not supported in this browser environment.');
        }

        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise<void>((resolve) => {
            if (!videoRef.current) return resolve();
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(resolve).catch(resolve);
            };
          });
        }

        await updateDevices();

        setState((prev) => ({
          ...prev,
          isActive: true,
          isPaused: false,
          isLoading: false,
          error: null,
          selectedDeviceId: deviceId || prev.selectedDeviceId,
        }));
      } catch (err: any) {
        console.error('Camera error:', err);
        let message = 'Failed to access camera.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message = 'Camera permission was denied. Please allow camera permissions in your browser bar.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = 'No video camera device was detected on your system.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          message = 'Camera is already in use by another application or tab.';
        } else if (err.message) {
          message = err.message;
        }

        setState((prev) => ({
          ...prev,
          isActive: false,
          isLoading: false,
          error: message,
        }));
      }
    },
    [stopCamera, updateDevices]
  );

  const togglePause = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return;
    if (state.isPaused) {
      videoRef.current.play();
      setState((prev) => ({ ...prev, isPaused: false }));
    } else {
      videoRef.current.pause();
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, [state.isPaused]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    cameraState: state,
    startCamera,
    stopCamera,
    togglePause,
  };
}
