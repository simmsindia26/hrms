import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Human from "@vladmandic/human";
import {
  Camera,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserRound,
  VideoOff,
  X,
} from "lucide-react";

import api from "../../lib/axios";

/* -------------------------------------------------------------------------- */
/* Human Configuration                                                        */
/* -------------------------------------------------------------------------- */

const human = new Human({
  backend: "webgl",

  modelBasePath:
    "https://cdn.jsdelivr.net/npm/@vladmandic/human/models/",

  cacheModels: true,

  face: {
    enabled: true,

    detector: {
      enabled: true,
      rotation: true,
      maxDetected: 1,
      minConfidence: 0.5,
    },

    mesh: {
      enabled: true,
    },

    description: {
      enabled: true,
    },
  },
});

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AttendanceSecurityData {
  employee?: {
    _id?: string;
    employeeId?: string;
    name?: string;
    email?: string;
  };

  pinConfigured: boolean;
  faceRegistered: boolean;

  pinUpdatedAt?: string | null;
  faceRegisteredAt?: string | null;
  faceUpdatedAt?: string | null;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };

  message?: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getErrorMessage(
  error: unknown
): string {
  const apiError =
    error as ApiError;

  return (
    apiError?.response?.data?.message ||
    apiError?.message ||
    "Something went wrong."
  );
}


/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceSecurity() {
  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */

  const [security, setSecurity] =
    useState<AttendanceSecurityData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [savingPin, setSavingPin] =
    useState(false);

  const [registeringFace, setRegisteringFace] =
    useState(false);

  const [cameraActive, setCameraActive] =
    useState(false);

  const [detecting, setDetecting] =
    useState(false);

  const [faceDetected, setFaceDetected] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [pin, setPin] =
    useState("");

  const [confirmPin, setConfirmPin] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Refs                                                                     */
  /* ------------------------------------------------------------------------ */

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const streamRef =
    useRef<MediaStream | null>(
      null
    );

  const detectionFrameRef =
    useRef<number | null>(null);

  const mountedRef =
    useRef(true);

  const registeringRef =
    useRef(false);

  /* ------------------------------------------------------------------------ */
  /* Stop Camera                                                              */
  /* ------------------------------------------------------------------------ */

  const stopCamera =
    useCallback(() => {
      registeringRef.current = false;

      if (
        detectionFrameRef.current !== null
      ) {
        cancelAnimationFrame(
          detectionFrameRef.current
        );

        detectionFrameRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }

      const video =
        videoRef.current;

      if (video) {
        video.pause();
        video.srcObject = null;
      }

      const canvas =
        canvasRef.current;

      if (canvas) {
        const context =
          canvas.getContext("2d");

        context?.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      if (mountedRef.current) {
        setCameraActive(false);
        setDetecting(false);
        setFaceDetected(false);
      }
    }, []);

  /* ------------------------------------------------------------------------ */
  /* Load Security Status                                                     */
  /* ------------------------------------------------------------------------ */

  const loadSecurity =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/attendance-terminal/me"
          );

        if (
          response.data?.success
        ) {
          setSecurity(
            response.data.data
          );
        } else {
          throw new Error(
            response.data?.message ||
              "Unable to load attendance security."
          );
        }
      } catch (err) {
        console.error(
          "Attendance security load error:",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }, []);

  /* ------------------------------------------------------------------------ */
  /* Initial Load                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    mountedRef.current = true;

    void loadSecurity();

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [
    loadSecurity,
    stopCamera,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Start Camera                                                             */
  /* ------------------------------------------------------------------------ */

  const startCamera =
    useCallback(async () => {
      try {
        setError("");
        setMessage("");
        setFaceDetected(false);

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            "Your browser does not support webcam access."
          );
        }

        stopCamera();

        setMessage(
          "Starting camera..."
        );

        /* -------------------------------------------------------------- */
        /* Load Human models                                              */
        /* -------------------------------------------------------------- */

        await human.load();

        await human.warmup();

        /* -------------------------------------------------------------- */
        /* Get camera                                                    */
        /* -------------------------------------------------------------- */

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: "user",

                width: {
                  ideal: 640,
                },

                height: {
                  ideal: 480,
                },

                frameRate: {
                  ideal: 30,
                },
              },

              audio: false,
            }
          );

        if (!mountedRef.current) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        streamRef.current =
          stream;

        const video =
          videoRef.current;

        if (!video) {
          throw new Error(
            "Camera video element is unavailable."
          );
        }

        /* -------------------------------------------------------------- */
        /* IMPORTANT: Attach stream to video                             */
        /* -------------------------------------------------------------- */

        video.srcObject =
          stream;

        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;

        /* -------------------------------------------------------------- */
        /* Wait until video metadata is available                        */
        /* -------------------------------------------------------------- */

        await new Promise<void>(
          (resolve, reject) => {
            if (
              video.readyState >= 2
            ) {
              resolve();
              return;
            }

            const timeout =
              window.setTimeout(() => {
                reject(
                  new Error(
                    "Camera video did not become ready."
                  )
                );
              }, 10000);

            const handleLoadedMetadata =
              () => {
                window.clearTimeout(
                  timeout
                );

                video.removeEventListener(
                  "loadedmetadata",
                  handleLoadedMetadata
                );

                resolve();
              };

            video.addEventListener(
              "loadedmetadata",
              handleLoadedMetadata
            );
          }
        );

        /* -------------------------------------------------------------- */
        /* Explicitly play video                                          */
        /* -------------------------------------------------------------- */

        await video.play();

        /* -------------------------------------------------------------- */
        /* Set canvas dimensions                                          */
        /* -------------------------------------------------------------- */

        const canvas =
          canvasRef.current;

        if (canvas) {
          canvas.width =
            video.videoWidth ||
            640;

          canvas.height =
            video.videoHeight ||
            480;
        }

        if (mountedRef.current) {
          setCameraActive(true);
          setMessage(
            "Camera ready. Look directly at the camera."
          );
        }

        /* -------------------------------------------------------------- */
        /* Start detection                                               */
        /* -------------------------------------------------------------- */

        registeringRef.current =
          true;

        const detectLoop =
          async () => {
            if (
              !mountedRef.current ||
              !registeringRef.current
            ) {
              return;
            }

            if (
              !videoRef.current ||
              videoRef.current.readyState <
                2
            ) {
              detectionFrameRef.current =
                requestAnimationFrame(
                  () => {
                    void detectLoop();
                  }
                );

              return;
            }

            try {
              setDetecting(true);

              const result =
                await human.detect(
                  videoRef.current
                );

              const faces =
                result.face || [];

              const hasFace =
                faces.length === 1;

              if (
                mountedRef.current
              ) {
                setFaceDetected(
                  hasFace
                );

                if (hasFace) {
                  setMessage(
                    "Face detected. Hold still and click Register Face."
                  );
                } else if (
                  faces.length === 0
                ) {
                  setMessage(
                    "No face detected. Please look directly at the camera."
                  );
                } else {
                  setMessage(
                    "Multiple faces detected. Only one person should be in the camera."
                  );
                }
              }

              /* ------------------------------------------------------ */
              /* Draw face box                                          */
              /* ------------------------------------------------------ */

              drawFaceOverlay(
                result,
                videoRef.current,
                canvasRef.current
              );
            } catch (err) {
              console.error(
                "Face detection error:",
                err
              );
            } finally {
              if (
                mountedRef.current
              ) {
                setDetecting(false);
              }
            }

            if (
              mountedRef.current &&
              registeringRef.current
            ) {
              detectionFrameRef.current =
                requestAnimationFrame(
                  () => {
                    void detectLoop();
                  }
                );
            }
          };

        void detectLoop();
      } catch (err) {
        console.error(
          "Camera startup error:",
          err
        );

        stopCamera();

        setError(
          getErrorMessage(err)
        );
      }
    }, [stopCamera]);

  /* ------------------------------------------------------------------------ */
  /* Register Face                                                            */
  /* ------------------------------------------------------------------------ */

  const registerFace =
    async () => {
      try {
        setError("");
        setMessage("");

        if (!videoRef.current) {
          setError(
            "Camera is not available."
          );

          return;
        }

        if (
          !cameraActive ||
          videoRef.current.readyState < 2
        ) {
          setError(
            "Please start the camera first."
          );

          return;
        }

        setRegisteringFace(true);

        setMessage(
          "Scanning your face..."
        );

        const result =
          await human.detect(
            videoRef.current
          );

        const faces =
          result.face || [];

        if (faces.length === 0) {
          throw new Error(
            "No face detected. Please look directly at the camera."
          );
        }

        if (faces.length > 1) {
          throw new Error(
            "Multiple faces detected. Only one person should be visible."
          );
        }

        const face =
          faces[0];

        const embedding =
          face.embedding;

        if (
          !embedding ||
          !Array.isArray(
            embedding
          ) ||
          embedding.length === 0
        ) {
          throw new Error(
            "Unable to generate a face embedding. Please try again."
          );
        }

        const cleanEmbedding =
          embedding.map(
            (value) =>
              Number(value)
          );

        if (
          cleanEmbedding.some(
            (value) =>
              !Number.isFinite(value)
          )
        ) {
          throw new Error(
            "Invalid face data was generated. Please try again."
          );
        }

        /* -------------------------------------------------------------- */
        /* Send embedding to backend                                     */
        /* -------------------------------------------------------------- */

        const response =
          await api.post(
            "/attendance-terminal/me/face",
            {
              embedding:
                cleanEmbedding,
            }
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data?.message ||
              "Face registration failed."
          );
        }

        setMessage(
          "Face registered successfully."
        );

        await loadSecurity();

        stopCamera();
      } catch (err) {
        console.error(
          "Face registration error:",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        if (
          mountedRef.current
        ) {
          setRegisteringFace(false);
        }
      }
    };

  /* ------------------------------------------------------------------------ */
  /* Set PIN                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleSetPin =
    async () => {
      try {
        setError("");
        setMessage("");

        if (
          !/^\d{4,6}$/.test(pin)
        ) {
          setError(
            "PIN must contain 4 to 6 digits."
          );

          return;
        }

        if (
          pin !== confirmPin
        ) {
          setError(
            "PIN and confirmation PIN do not match."
          );

          return;
        }

        setSavingPin(true);

        const response =
          await api.post(
            "/attendance-terminal/me/pin",
            {
              pin,
            }
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data?.message ||
              "Unable to set attendance PIN."
          );
        }

        setPin("");
        setConfirmPin("");

        setMessage(
          "Attendance PIN configured successfully."
        );

        await loadSecurity();
      } catch (err) {
        console.error(
          "Attendance PIN error:",
          err
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        setSavingPin(false);
      }
    };

  /* ------------------------------------------------------------------------ */
  /* Loading Screen                                                           */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />

          <p className="text-sm text-slate-500">
            Loading attendance security...
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ================================================================ */}
        {/* HEADER                                                           */}
        {/* ================================================================ */}

        <div>
          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-indigo-100 p-3">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Attendance Security
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Set your attendance PIN and register
                your face for office attendance.
              </p>
            </div>

          </div>
        </div>

        {/* ================================================================ */}
        {/* GLOBAL MESSAGE                                                   */}
        {/* ================================================================ */}

        {message && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            {message}
          </div>
        )}

        {/* ================================================================ */}
        {/* ERROR                                                            */}
        {/* ================================================================ */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ================================================================ */}
        {/* MAIN GRID                                                        */}
        {/* ================================================================ */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ============================================================ */}
          {/* PIN                                                           */}
          {/* ============================================================ */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex items-start justify-between">

              <div className="flex items-start gap-3">

                <div className="rounded-xl bg-indigo-50 p-3">
                  <LockKeyhole className="h-6 w-6 text-indigo-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Attendance PIN
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Used at the office attendance
                    terminal.
                  </p>
                </div>

              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  security?.pinConfigured
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {security?.pinConfigured
                  ? "Configured"
                  : "Not configured"}
              </span>

            </div>

            <div className="mt-6 space-y-3">

              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pin}
                onChange={(event) =>
                  setPin(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="Enter 4–6 digit PIN"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={confirmPin}
                onChange={(event) =>
                  setConfirmPin(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="Confirm PIN"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <button
                type="button"
                disabled={
                  savingPin ||
                  pin.length < 4 ||
                  confirmPin.length < 4
                }
                onClick={() =>
                  void handleSetPin()
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPin && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {security?.pinConfigured
                  ? "Update Attendance PIN"
                  : "Set Attendance PIN"}
              </button>

            </div>

            {security?.pinUpdatedAt && (
              <p className="mt-4 text-xs text-slate-400">
                Last updated:{" "}
                {new Date(
                  security.pinUpdatedAt
                ).toLocaleString("en-IN")}
              </p>
            )}

          </section>

          {/* ============================================================ */}
          {/* FACE                                                          */}
          {/* ============================================================ */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex items-start justify-between">

              <div className="flex items-start gap-3">

                <div className="rounded-xl bg-emerald-50 p-3">
                  <UserRound className="h-6 w-6 text-emerald-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Face Recognition
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Register your face for the office
                    attendance terminal.
                  </p>
                </div>

              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  security?.faceRegistered
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {security?.faceRegistered
                  ? "Registered"
                  : "Not registered"}
              </span>

            </div>

            {/* ========================================================== */}
            {/* CAMERA                                                     */}
            {/* ========================================================== */}

            <div className="relative mt-5 overflow-hidden rounded-2xl bg-black">

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="block aspect-video h-auto w-full object-cover"
              />

              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />

              {/* Face Guide */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                <div
                  className={`h-[72%] w-[48%] rounded-[45%] border-2 transition ${
                    faceDetected
                      ? "border-emerald-400"
                      : "border-white/70"
                  }`}
                />

              </div>

              {/* Camera Status */}
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">

                {cameraActive ? (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />

                    Camera Live
                  </>
                ) : (
                  <>
                    <VideoOff className="h-3.5 w-3.5" />

                    Camera Off
                  </>
                )}

              </div>

              {/* Detection Status */}
              {cameraActive && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur">

                  {detecting
                    ? "Scanning..."
                    : faceDetected
                    ? "Face detected ✓"
                    : "Looking for face..."}

                </div>
              )}

            </div>

            {/* ========================================================== */}
            {/* CAMERA CONTROLS                                            */}
            {/* ========================================================== */}

            <div className="mt-4 grid grid-cols-2 gap-3">

              {!cameraActive ? (
                <button
                  type="button"
                  onClick={() =>
                    void startCamera()
                  }
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Camera className="h-4 w-4" />

                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={
                      registeringFace ||
                      !faceDetected
                    }
                    onClick={() =>
                      void registerFace()
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {registeringFace ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}

                    {registeringFace
                      ? "Registering..."
                      : security?.faceRegistered
                      ? "Update Face"
                      : "Register Face"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      registeringFace
                    }
                    onClick={
                      stopCamera
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                  >
                    <X className="h-4 w-4" />

                    Stop Camera
                  </button>
                </>
              )}

            </div>

            {/* Retry */}
            {error && (
              <button
                type="button"
                onClick={() =>
                  void startCamera()
                }
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />

                Try Camera Again
              </button>
            )}

            {security?.faceRegisteredAt && (
              <p className="mt-4 text-xs text-slate-400">
                Registered:{" "}
                {new Date(
                  security.faceRegisteredAt
                ).toLocaleString("en-IN")}
              </p>
            )}

          </section>
        </div>

        {/* ================================================================ */}
        {/* HOW IT WORKS                                                     */}
        {/* ================================================================ */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-slate-100 p-2.5">
              <ShieldCheck className="h-5 w-5 text-slate-700" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                How office attendance works
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Your registered face and PIN are used
                together at the office terminal.
              </p>
            </div>

          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">

            <Step
              number="1"
              icon={<Camera className="h-5 w-5" />}
              title="Face Recognition"
              description="The office attendance device identifies your registered face."
            />

            <Step
              number="2"
              icon={<LockKeyhole className="h-5 w-5" />}
              title="Enter PIN"
              description="Enter your private attendance PIN on the office terminal."
            />

            <Step
              number="3"
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Attendance"
              description="The first successful verification checks you in and the next one checks you out."
            />

          </div>

        </section>

      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Face Overlay                                                               */
/* -------------------------------------------------------------------------- */

function drawFaceOverlay(
  result: any,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement | null
) {
  if (!canvas) {
    return;
  }

  const context =
    canvas.getContext("2d");

  if (!context) {
    return;
  }

  const width =
    video.videoWidth || 640;

  const height =
    video.videoHeight || 480;

  if (
    canvas.width !== width ||
    canvas.height !== height
  ) {
    canvas.width = width;
    canvas.height = height;
  }

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const faces =
    result?.face || [];

  if (
    faces.length !== 1
  ) {
    return;
  }

  const face =
    faces[0];

  const box =
    face.box;

  if (
    !box ||
    !Array.isArray(box)
  ) {
    return;
  }

  const [
    x,
    y,
    boxWidth,
    boxHeight,
  ] = box;

  context.strokeStyle =
    "#22c55e";

  context.lineWidth = 4;

  context.strokeRect(
    x,
    y,
    boxWidth,
    boxHeight
  );
}

/* -------------------------------------------------------------------------- */
/* Step Component                                                             */
/* -------------------------------------------------------------------------- */

interface StepProps {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Step({
  number,
  icon,
  title,
  description,
}: StepProps) {
  return (
    <div className="flex gap-4">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>

      <div>

        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Step {number}
        </div>

        <h3 className="mt-1 font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>

      </div>

    </div>
  );
}