import {
  useEffect,
  useRef,
  useState,
} from "react";

import Human from "@vladmandic/human";

import api from "../../lib/axios";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type RegisteredEmployee = {
  employeeId: string;
  employeeCode: string;
  name: string;
  embedding: number[];
};

type AttendanceResponse = {
  success: boolean;
  message: string;

  data?: {
    action:
      | "check-in"
      | "check-out";

    employeeId: string;
    name: string;
    similarity: number;
    checkIn: string;
    checkOut?: string;
    attendanceId: string;
    terminalId: string;
  };
};

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const TERMINAL_KEY =
  import.meta.env.VITE_ATTENDANCE_TERMINAL_KEY ||
  "";

const TERMINAL_ID =
  import.meta.env.VITE_ATTENDANCE_TERMINAL_ID ||
  "OFFICE-01";

const FACE_THRESHOLD = 0.52;

const AUTO_SCAN_DELAY = 2000;

const SUCCESS_RESET_DELAY = 4000;

/*
 * Main application color.
 */
const PRIMARY_COLOR = "#fe0100";

/* -------------------------------------------------------------------------- */
/* Human Face Recognition                                                     */
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
      return: true,
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
/* Cosine Similarity                                                          */
/* -------------------------------------------------------------------------- */

function cosineSimilarity(
  a: number[],
  b: number[]
): number {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length === 0 ||
    b.length === 0 ||
    a.length !== b.length
  ) {
    return -1;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (
    let i = 0;
    i < a.length;
    i += 1
  ) {
    dot += a[i] * b[i];

    normA +=
      a[i] * a[i];

    normB +=
      b[i] * b[i];
  }

  if (
    normA === 0 ||
    normB === 0
  ) {
    return -1;
  }

  return (
    dot /
    (
      Math.sqrt(normA) *
      Math.sqrt(normB)
    )
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AttendanceTerminal() {

  /* ======================================================================== */
  /* VIDEO                                                                    */
  /* ======================================================================== */

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const streamRef =
    useRef<MediaStream | null>(
      null
    );

  /* ======================================================================== */
  /* AUTO SCAN REFS                                                           */
  /* ======================================================================== */

  const autoScanTimeoutRef =
    useRef<number | null>(
      null
    );

  const scanFaceRef =
    useRef<
      (() => Promise<void>) | null
    >(null);

  const autoScanEnabledRef =
    useRef(false);

  const scanInProgressRef =
    useRef(false);

  const successResetTimeoutRef =
    useRef<number | null>(
      null
    );

  /*
   * Prevents state/closure problems while deciding whether
   * the current scan found a person.
   */
  const matchedThisScanRef =
    useRef(false);

  /* ======================================================================== */
  /* STATE                                                                    */
  /* ======================================================================== */

  const [
    employees,
    setEmployees,
  ] = useState<
    RegisteredEmployee[]
  >([]);

  const [
    cameraReady,
    setCameraReady,
  ] = useState(false);

  const [
    starting,
    setStarting,
  ] = useState(false);

  const [
    scanning,
    setScanning,
  ] = useState(false);

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    matchedEmployee,
    setMatchedEmployee,
  ] =
    useState<RegisteredEmployee | null>(
      null
    );

  const [
    currentEmbedding,
    setCurrentEmbedding,
  ] =
    useState<number[] | null>(
      null
    );

  const [
    pin,
    setPin,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState(
    "Click Start Attendance Terminal to begin."
  );

  /* ======================================================================== */
  /* CLEANUP                                                                  */
  /* ======================================================================== */

  useEffect(() => {
    return () => {
      stopAutoScan();
      stopCamera();

      if (
        successResetTimeoutRef.current !==
        null
      ) {
        window.clearTimeout(
          successResetTimeoutRef.current
        );

        successResetTimeoutRef.current =
          null;
      }
    };
  }, []);

  /* ======================================================================== */
  /* STOP AUTO SCAN                                                           */
  /* ======================================================================== */

  function stopAutoScan() {

    autoScanEnabledRef.current =
      false;

    if (
      autoScanTimeoutRef.current !==
      null
    ) {
      window.clearTimeout(
        autoScanTimeoutRef.current
      );

      autoScanTimeoutRef.current =
        null;
    }
  }

  /* ======================================================================== */
  /* SCHEDULE AUTO SCAN                                                       */
  /* ======================================================================== */

  function scheduleNextAutoScan(
    delay = AUTO_SCAN_DELAY
  ) {

    if (
      !autoScanEnabledRef.current
    ) {
      return;
    }

    if (
      !streamRef.current ||
      !videoRef.current
    ) {
      return;
    }

    if (
      autoScanTimeoutRef.current !==
      null
    ) {
      window.clearTimeout(
        autoScanTimeoutRef.current
      );

      autoScanTimeoutRef.current =
        null;
    }

    autoScanTimeoutRef.current =
      window.setTimeout(
        () => {

          autoScanTimeoutRef.current =
            null;

          if (
            !autoScanEnabledRef.current
          ) {
            return;
          }

          console.log(
            "[Attendance Terminal] AUTO SCAN"
          );

          void scanFaceRef.current?.();

        },
        delay
      );
  }

  /* ======================================================================== */
  /* START AUTO SCAN                                                          */
  /* ======================================================================== */

  function startAutoScan() {

    stopAutoScan();

    if (
      !streamRef.current ||
      !videoRef.current
    ) {

      console.warn(
        "[Attendance Terminal] Camera is not ready for auto scan."
      );

      return;
    }

    autoScanEnabledRef.current =
      true;

    setMessage(
      "Auto-scanning every 2 seconds..."
    );

    console.log(
      "[Attendance Terminal] AUTO SCAN STARTED"
    );

    scheduleNextAutoScan(
      AUTO_SCAN_DELAY
    );
  }

  /* ======================================================================== */
  /* STOP CAMERA                                                              */
  /* ======================================================================== */

  function stopCamera() {

    stopAutoScan();

    scanInProgressRef.current =
      false;

    if (
      streamRef.current
    ) {

      streamRef.current
        .getTracks()
        .forEach(
          (track) => {
            track.stop();
          }
        );

      streamRef.current =
        null;
    }

    if (
      videoRef.current
    ) {
      videoRef.current.pause();

      videoRef.current.srcObject =
        null;
    }

    setCameraReady(false);
    setScanning(false);
  }

  /* ======================================================================== */
  /* START TERMINAL                                                           */
  /* ======================================================================== */

  async function startTerminal() {

    if (
      starting ||
      cameraReady
    ) {
      return;
    }

    try {

      setStarting(true);

      setMessage(
        "Starting attendance terminal..."
      );

      /* -------------------------------------------------------------------- */
      /* TERMINAL KEY                                                         */
      /* -------------------------------------------------------------------- */

      if (!TERMINAL_KEY) {
        throw new Error(
          "VITE_ATTENDANCE_TERMINAL_KEY is missing from frontend .env"
        );
      }

      /* -------------------------------------------------------------------- */
      /* LOAD REGISTERED FACES                                                */
      /* -------------------------------------------------------------------- */

      setMessage(
        "Loading registered employee faces..."
      );

      let response;

      try {

        response =
          await api.get(
            "/attendance-terminal/terminal/faces",
            {
              headers: {
                "x-attendance-terminal-key":
                  TERMINAL_KEY,

                "x-attendance-terminal-id":
                  TERMINAL_ID,
              },
            }
          );

      } catch (
        error: any
      ) {

        console.error(
          "Attendance terminal API error:",
          error
        );

        console.error(
          "API response:",
          error?.response?.data
        );

        console.error(
          "API status:",
          error?.response?.status
        );

        if (
          error?.response?.status ===
          401
        ) {
          throw new Error(
            "Invalid attendance terminal key. Check frontend and backend ATTENDANCE_TERMINAL_KEY."
          );
        }

        if (
          error?.response?.status ===
          503
        ) {
          throw new Error(
            "Attendance terminal is not configured on the backend."
          );
        }

        if (
          error?.response?.status ===
          404
        ) {
          throw new Error(
            "Attendance terminal API route was not found."
          );
        }

        throw new Error(
          error?.response?.data?.message ||
            `Unable to connect to attendance API. HTTP ${
              error?.response?.status ||
              "unknown"
            }`
        );
      }

      const registeredFaces =
        response?.data?.data ||
        [];

      setEmployees(
        registeredFaces
      );

      console.log(
        "Registered attendance faces:",
        registeredFaces.length
      );

      if (
        registeredFaces.length ===
        0
      ) {
        console.warn(
          "[Attendance Terminal] No registered employee faces found."
        );
      }

      /* -------------------------------------------------------------------- */
      /* LOAD HUMAN                                                           */
      /* -------------------------------------------------------------------- */

      setMessage(
        "Loading face recognition system..."
      );

      try {

        await human.load();

        await human.warmup();

      } catch (
        error
      ) {

        console.error(
          "Human face recognition error:",
          error
        );

        throw new Error(
          "Face recognition models could not be loaded. Check your internet connection."
        );
      }

      /* -------------------------------------------------------------------- */
      /* CAMERA                                                               */
      /* -------------------------------------------------------------------- */

      setMessage(
        "Requesting camera permission..."
      );

      let stream: MediaStream;

      try {

        stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: "user",

                width: {
                  ideal: 1280,
                },

                height: {
                  ideal: 720,
                },

                frameRate: {
                  ideal: 30,
                },
              },

              audio: false,
            }
          );

      } catch (
        error: any
      ) {

        console.error(
          "Camera error:",
          error
        );

        if (
          error?.name ===
          "NotAllowedError"
        ) {
          throw new Error(
            "Camera permission was denied. Please allow camera access in your browser."
          );
        }

        if (
          error?.name ===
          "NotFoundError"
        ) {
          throw new Error(
            "No camera was found on this device."
          );
        }

        if (
          error?.name ===
          "NotReadableError"
        ) {
          throw new Error(
            "Camera is already being used by another application."
          );
        }

        if (
          error?.name ===
          "SecurityError"
        ) {
          throw new Error(
            "Camera access requires HTTPS or localhost."
          );
        }

        throw new Error(
          `Unable to access camera: ${
            error?.message ||
            "Unknown camera error"
          }`
        );
      }

      /* -------------------------------------------------------------------- */
      /* ATTACH STREAM                                                        */
      /* -------------------------------------------------------------------- */

      streamRef.current =
        stream;

      if (
        !videoRef.current
      ) {
        throw new Error(
          "Camera video element is not available."
        );
      }

      const video =
        videoRef.current;

      video.srcObject =
        stream;

      video.muted =
        true;

      video.playsInline =
        true;

      /* -------------------------------------------------------------------- */
      /* WAIT FOR VIDEO                                                       */
      /* -------------------------------------------------------------------- */

      await new Promise<void>(
        (
          resolve,
          reject
        ) => {

          if (
            video.readyState >=
            2
          ) {
            resolve();

            return;
          }

          const timeout =
            window.setTimeout(
              () => {
                reject(
                  new Error(
                    "Camera video did not become ready."
                  )
                );
              },
              10000
            );

          const handleMetadata =
            () => {

              window.clearTimeout(
                timeout
              );

              video.removeEventListener(
                "loadedmetadata",
                handleMetadata
              );

              resolve();
            };

          video.addEventListener(
            "loadedmetadata",
            handleMetadata
          );

        }
      );

      /* -------------------------------------------------------------------- */
      /* PLAY VIDEO                                                           */
      /* -------------------------------------------------------------------- */

      await video.play();

      /* -------------------------------------------------------------------- */
      /* READY                                                                */
      /* -------------------------------------------------------------------- */

      setCameraReady(
        true
      );

      setMessage(
        "Camera ready. Auto-scanning every 2 seconds..."
      );

      console.log(
        "[Attendance Terminal] CAMERA READY"
      );

      startAutoScan();

    } catch (
      error: any
    ) {

      console.error(
        "ATTENDANCE TERMINAL STARTUP ERROR:",
        error
      );

      stopCamera();

      setMessage(
        error?.message ||
          "Unable to start attendance terminal."
      );

    } finally {

      setStarting(false);
    }
  }

  /* ======================================================================== */
  /* SCAN FACE                                                                */
  /* ======================================================================== */

  async function scanFace() {

    if (
      !videoRef.current ||
      !streamRef.current
    ) {

      console.warn(
        "[Attendance Terminal] Scan skipped: camera not ready."
      );

      return;
    }

    if (
      videoRef.current.readyState <
      2
    ) {

      console.warn(
        "[Attendance Terminal] Scan skipped: video not ready."
      );

      return;
    }

    if (
      scanInProgressRef.current
    ) {

      console.log(
        "[Attendance Terminal] Scan skipped: previous scan still running."
      );

      return;
    }

    if (
      busy ||
      matchedEmployee
    ) {
      return;
    }

    matchedThisScanRef.current =
      false;

    try {

      scanInProgressRef.current =
        true;

      setScanning(
        true
      );

      setMessage(
        "Scanning face..."
      );

      console.log(
        "[Attendance Terminal] Face detection started."
      );

      /* -------------------------------------------------------------------- */
      /* HUMAN DETECTION                                                      */
      /* -------------------------------------------------------------------- */

      const result =
        await human.detect(
          videoRef.current
        );

      const faces =
        result.face || [];

      console.log(
        "[Attendance Terminal] Faces detected:",
        faces.length
      );

      /* -------------------------------------------------------------------- */
      /* NO FACE                                                              */
      /* -------------------------------------------------------------------- */

      if (
        faces.length ===
        0
      ) {

        setMatchedEmployee(
          null
        );

        setCurrentEmbedding(
          null
        );

        setMessage(
          "No face detected. Scanning again in 2 seconds..."
        );

        return;
      }

      /* -------------------------------------------------------------------- */
      /* MULTIPLE FACES                                                       */
      /* -------------------------------------------------------------------- */

      if (
        faces.length >
        1
      ) {

        setMatchedEmployee(
          null
        );

        setCurrentEmbedding(
          null
        );

        setMessage(
          "Only one person should be visible. Scanning again in 2 seconds..."
        );

        return;
      }

      /* -------------------------------------------------------------------- */
      /* FACE                                                                  */
      /* -------------------------------------------------------------------- */

      const face =
        faces[0];

      if (
        !face.embedding ||
        face.embedding.length ===
        0
      ) {

        setMatchedEmployee(
          null
        );

        setCurrentEmbedding(
          null
        );

        setMessage(
          "Unable to generate face data. Scanning again..."
        );

        return;
      }

      /* -------------------------------------------------------------------- */
      /* FRESH CAMERA EMBEDDING                                               */
      /* -------------------------------------------------------------------- */

      const freshEmbedding =
        Array.from(
          face.embedding
        );

      /* -------------------------------------------------------------------- */
      /* FIND BEST MATCH                                                      */
      /* -------------------------------------------------------------------- */

      let bestEmployee:
        | RegisteredEmployee
        | null =
        null;

      let bestSimilarity =
        -1;

      for (
        const employee of
        employees
      ) {

        if (
          !Array.isArray(
            employee.embedding
          )
        ) {
          continue;
        }

        const similarity =
          cosineSimilarity(
            freshEmbedding,
            employee.embedding
          );

        if (
          similarity >
          bestSimilarity
        ) {

          bestSimilarity =
            similarity;

          bestEmployee =
            employee;
        }
      }

      console.log(
        "[Attendance Terminal] Best similarity:",
        bestSimilarity
      );

      /* -------------------------------------------------------------------- */
      /* NO MATCH                                                             */
      /* -------------------------------------------------------------------- */

      if (
        !bestEmployee ||
        bestSimilarity <
          FACE_THRESHOLD
      ) {

        setMatchedEmployee(
          null
        );

        setCurrentEmbedding(
          null
        );

        setPin("");

        setMessage(
          "Face not recognized. Scanning again in 2 seconds..."
        );

        return;
      }

      /* -------------------------------------------------------------------- */
      /* MATCHED                                                              */
      /* -------------------------------------------------------------------- */

      console.log(
        "[Attendance Terminal] MATCH:",
        bestEmployee.name,
        bestSimilarity
      );

      matchedThisScanRef.current =
        true;

      /*
       * Save fresh camera embedding.
       *
       * This is what the backend verifies.
       */
      setCurrentEmbedding(
        freshEmbedding
      );

      setMatchedEmployee(
        bestEmployee
      );

      setPin("");

      /*
       * Stop automatic scanning.
       */
      stopAutoScan();

      setMessage(
        `Welcome ${bestEmployee.name}. Enter your attendance PIN.`
      );

    } catch (
      error
    ) {

      console.error(
        "[Attendance Terminal] Face scan error:",
        error
      );

      setMessage(
        "Face scanning failed. Please try again."
      );

    } finally {

      setScanning(
        false
      );

      scanInProgressRef.current =
        false;

      /*
       * Schedule another scan only when this scan
       * did NOT find an employee.
       */
      if (
        autoScanEnabledRef.current &&
        streamRef.current &&
        !matchedThisScanRef.current
      ) {

        scheduleNextAutoScan(
          AUTO_SCAN_DELAY
        );
      }
    }
  }

  /* ======================================================================== */
  /* KEEP LATEST SCAN FUNCTION                                                */
  /* ======================================================================== */

  scanFaceRef.current =
    scanFace;

  /* ======================================================================== */
  /* VERIFY ATTENDANCE                                                        */
  /* ======================================================================== */

  async function verifyAttendance() {

    if (
      !matchedEmployee ||
      !currentEmbedding
    ) {

      setMessage(
        "Please scan your face first."
      );

      return;
    }

    if (
      !/^\d{4,6}$/.test(
        pin
      )
    ) {

      setMessage(
        "Enter your 4–6 digit attendance PIN."
      );

      return;
    }

    try {

      setBusy(
        true
      );

      setMessage(
        "Verifying attendance..."
      );

      const response =
        await api.post<AttendanceResponse>(
          "/attendance-terminal/terminal/verify",

          {
            /*
             * IMPORTANT:
             *
             * Send the fresh camera embedding.
             *
             * Never send the registered employee embedding.
             */
            embedding:
              currentEmbedding,

            pin,
          },

          {
            headers: {

              "x-attendance-terminal-key":
                TERMINAL_KEY,

              "x-attendance-terminal-id":
                TERMINAL_ID,
            },
          }
        );

      if (
        response.data.success
      ) {

        const data =
          response.data.data;

        if (
          data?.action ===
          "check-in"
        ) {

          setMessage(
            `Check-in successful. Welcome ${data.name}.`
          );

        } else if (
          data?.action ===
          "check-out"
        ) {

          setMessage(
            `Check-out successful. Goodbye ${data.name}.`
          );

        } else {

          setMessage(
            response.data.message
          );
        }

        setPin("");

        setCurrentEmbedding(
          null
        );

        /*
         * Clear any previous reset timer.
         */
        if (
          successResetTimeoutRef.current !==
          null
        ) {
          window.clearTimeout(
            successResetTimeoutRef.current
          );
        }

        /*
         * Wait before returning to scanning.
         */
        successResetTimeoutRef.current =
          window.setTimeout(
            () => {

              successResetTimeoutRef.current =
                null;

              setMatchedEmployee(
                null
              );

              setMessage(
                "Look directly at the camera. Auto-scanning every 2 seconds..."
              );

              startAutoScan();

            },
            SUCCESS_RESET_DELAY
          );
      }

    } catch (
      error: any
    ) {

      console.error(
        "Attendance verification error:",
        error
      );

      const code =
        error?.response?.data?.code;

      const errorMessage =
        error?.response?.data?.message ||
        "Attendance verification failed.";

      setMessage(
        errorMessage
      );

      if (
        code ===
          "INVALID_PIN" ||
        code ===
          "PIN_LOCKED"
      ) {

        setPin("");
      }

      if (
        code ===
        "FACE_NOT_RECOGNIZED"
      ) {

        setMatchedEmployee(
          null
        );

        setCurrentEmbedding(
          null
        );

        setPin("");

        startAutoScan();
      }

    } finally {

      setBusy(
        false
      );
    }
  }

  /* ======================================================================== */
  /* PIN                                                                      */
  /* ======================================================================== */

  function addPinDigit(
    digit: string
  ) {

    if (
      busy ||
      pin.length >=
        6
    ) {
      return;
    }

    setPin(
      (
        current
      ) =>
        current +
        digit
    );
  }

  function removePinDigit() {

    if (
      busy
    ) {
      return;
    }

    setPin(
      (
        current
      ) =>
        current.slice(
          0,
          -1
        )
    );
  }

  function clearPin() {

    if (
      busy
    ) {
      return;
    }

    setPin("");
  }

  /* ======================================================================== */
  /* CANCEL VERIFICATION                                                      */
  /* ======================================================================== */

  function resetVerification() {

    if (
      busy
    ) {
      return;
    }

    setMatchedEmployee(
      null
    );

    setCurrentEmbedding(
      null
    );

    setPin("");

    setMessage(
      "Look directly at the camera. Auto-scanning every 2 seconds..."
    );

    if (
      cameraReady
    ) {

      startAutoScan();
    }
  }

  /* ======================================================================== */
  /* RENDER                                                                   */
  /* ======================================================================== */

  return (
    <div className="min-h-screen bg-white text-white">

      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-5 sm:py-6 lg:px-6">

        {/* ================================================================ */}
        {/* HEADER                                                           */}
        {/* ================================================================ */}

        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">

            <h1 className="truncate text-xl font-bold sm:text-2xl lg:text-3xl">
              Office Attendance
            </h1>

            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Face recognition + PIN verification
            </p>

          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">

            <div className="flex items-center gap-2">

              <span
                className={`h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3 ${
                  cameraReady
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />

              <span className="text-xs text-slate-300 sm:text-sm">

                {cameraReady
                  ? "Terminal Ready"
                  : "Camera Offline"}

              </span>

            </div>

            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-300 sm:px-3 sm:text-xs">
              {TERMINAL_ID}
            </span>

          </div>

        </div>

        {/* ================================================================ */}
        {/* MAIN GRID                                                        */}
        {/* ================================================================ */}

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">

          {/* ============================================================ */}
          {/* CAMERA                                                       */}
          {/* ============================================================ */}

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 sm:rounded-3xl">

            {/* START BUTTON */}

            {!cameraReady && (

              <div className="border-b border-slate-800 bg-white p-4 sm:p-5">

                <button
                  type="button"
                  onClick={() =>
                    void startTerminal()
                  }
                  disabled={
                    starting
                  }
                  style={{
                    backgroundColor:
                      PRIMARY_COLOR,
                  }}
                  className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition active:scale-[0.98] hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base"
                >

                  {starting
                    ? "Starting Attendance Terminal..."
                    : "Start Attendance Terminal"}

                </button>

                <p className="mt-2 text-center text-[11px] leading-4 text-slate-500 sm:text-xs">
                  Camera starts automatically and scans every 2 seconds.
                </p>

              </div>
            )}

            {/* ========================================================== */}
            {/* VIDEO                                                       */}
            {/* ========================================================== */}

            <div className="relative aspect-[4/3] w-full overflow-hidden bg-black sm:aspect-video">

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              {/* FACE GUIDE */}

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                <div
                  className="
                    h-[68%]
                    w-[48%]
                    max-w-[250px]
                    rounded-[45%]
                    border-2
                    border-white/70
                    shadow-[0_0_30px_rgba(255,255,255,0.12)]
                    sm:h-72
                    sm:w-56
                    md:h-80
                    md:w-64
                  "
                />

              </div>

              {/* LIVE INDICATOR */}

              {cameraReady && (

                <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1.5 text-[10px] font-medium backdrop-blur sm:left-4 sm:top-4 sm:px-3 sm:py-2 sm:text-xs">

                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 sm:h-2 sm:w-2" />

                  CAMERA LIVE

                </div>
              )}

              {/* SCANNING */}

              {scanning && (

                <div className="absolute bottom-3 left-0 right-0 flex justify-center px-3 sm:bottom-5">

                  <div className="rounded-full bg-black/75 px-4 py-2 text-xs backdrop-blur sm:px-5 sm:text-sm">
                    Scanning face...
                  </div>

                </div>
              )}

            </div>

            {/* ========================================================== */}
            {/* CAMERA STATUS                                               */}
            {/* ========================================================== */}

            <div className="p-4 sm:p-6">

              <div className="flex min-h-12 items-center justify-center text-center sm:min-h-15">

                <p className="max-w-md text-xs leading-5 text-slate-300 sm:text-sm">
                  {message}
                </p>

              </div>

              {/* AUTO SCAN STATUS */}

              {!matchedEmployee &&
                cameraReady && (

                  <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">

                    <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-3 py-2.5 text-xs text-slate-300 sm:px-4 sm:py-3 sm:text-sm">

                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500 sm:h-2.5 sm:w-2.5" />

                      Auto-scanning every 2 seconds

                    </div>

                    {/* MANUAL SCAN */}

                    <button
                      type="button"
                      onClick={() =>
                        void scanFace()
                      }
                      disabled={
                        scanning ||
                        busy
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 text-sm font-semibold text-slate-200 transition active:scale-[0.98] hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      {scanning
                        ? "Scanning..."
                        : "Scan Now"}

                    </button>

                  </div>
                )}

              {/* STOP TERMINAL */}

              {cameraReady &&
                !matchedEmployee && (

                  <button
                    type="button"
                    onClick={() => {

                      stopCamera();

                      setMatchedEmployee(
                        null
                      );

                      setCurrentEmbedding(
                        null
                      );

                      setPin("");

                      setMessage(
                        "Attendance terminal stopped."
                      );

                    }}
                    className="mt-2.5 w-full rounded-xl border border-red-900/60 bg-red-950/40 py-3 text-sm font-semibold text-red-300 transition active:scale-[0.98] hover:bg-red-950/70 sm:mt-3"
                  >
                    Stop Attendance Terminal
                  </button>
                )}

            </div>

          </div>

          {/* ============================================================ */}
          {/* PIN PANEL                                                    */}
          {/* ============================================================ */}

          <div className="flex min-h-[500px] flex-col justify-center rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:min-h-[550px] sm:rounded-3xl sm:p-6 md:p-8">

            {matchedEmployee ? (

              <>

                {/* ====================================================== */}
                {/* EMPLOYEE                                                */}
                {/* ====================================================== */}

                <div className="mb-5 text-center sm:mb-7">

                  <div
                    style={{
                      color:
                        PRIMARY_COLOR,
                      backgroundColor:
                        "rgba(254,1,0,0.12)",
                    }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold sm:h-20 sm:w-20 sm:text-3xl"
                  >

                    {matchedEmployee.name
                      .charAt(0)
                      .toUpperCase()}

                  </div>

                  <h2 className="mt-3 break-words text-xl font-bold sm:mt-4 sm:text-2xl">
                    {matchedEmployee.name}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                    {matchedEmployee.employeeCode}
                  </p>

                </div>

                {/* PIN TITLE */}

                <div className="mb-2 text-center text-xs text-slate-400 sm:mb-3 sm:text-sm">
                  Enter attendance PIN
                </div>

                {/* PIN DOTS */}

                <div className="mb-5 flex justify-center gap-2 sm:mb-7 sm:gap-3">

                  {[
                    0,
                    1,
                    2,
                    3,
                    4,
                    5,
                  ].map(
                    (index) => (

                      <div
                        key={index}
                        style={
                          index <
                          pin.length
                            ? {
                                backgroundColor:
                                  PRIMARY_COLOR,
                              }
                            : undefined
                        }
                        className={`h-3 w-3 rounded-full transition-all sm:h-4 sm:w-4 ${
                          index <
                          pin.length
                            ? "shadow-[0_0_10px_rgba(254,1,0,0.35)]"
                            : "bg-slate-700"
                        }`}
                      />

                    )
                  )}

                </div>

                {/* ====================================================== */}
                {/* KEYPAD                                                  */}
                {/* ====================================================== */}

                <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2 sm:gap-3">

                  {[
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                  ].map(
                    (number) => (

                      <button
                        type="button"
                        key={number}
                        onClick={() =>
                          addPinDigit(
                            number
                          )
                        }
                        disabled={
                          busy
                        }
                        className="h-14 rounded-xl bg-slate-800 text-lg font-semibold transition active:scale-95 active:bg-slate-700 hover:bg-slate-700 disabled:opacity-50 sm:h-16 sm:text-xl"
                      >
                        {number}
                      </button>

                    )
                  )}

                  {/* CLEAR */}

                  <button
                    type="button"
                    onClick={
                      clearPin
                    }
                    disabled={
                      busy
                    }
                    className="h-14 rounded-xl bg-slate-800 text-xs font-medium transition active:scale-95 active:bg-slate-700 hover:bg-slate-700 disabled:opacity-50 sm:h-16 sm:text-sm"
                  >
                    Clear
                  </button>

                  {/* ZERO */}

                  <button
                    type="button"
                    onClick={() =>
                      addPinDigit(
                        "0"
                      )
                    }
                    disabled={
                      busy
                    }
                    className="h-14 rounded-xl bg-slate-800 text-lg font-semibold transition active:scale-95 active:bg-slate-700 hover:bg-slate-700 disabled:opacity-50 sm:h-16 sm:text-xl"
                  >
                    0
                  </button>

                  {/* BACKSPACE */}

                  <button
                    type="button"
                    onClick={
                      removePinDigit
                    }
                    disabled={
                      busy
                    }
                    className="h-14 rounded-xl bg-slate-800 text-lg transition active:scale-95 active:bg-slate-700 hover:bg-slate-700 disabled:opacity-50 sm:h-16"
                  >
                    ←
                  </button>

                </div>

                {/* ====================================================== */}
                {/* VERIFY                                                  */}
                {/* ====================================================== */}

                <button
                  type="button"
                  onClick={
                    verifyAttendance
                  }
                  disabled={
                    busy ||
                    pin.length <
                      4 ||
                    !currentEmbedding
                  }
                  style={{
                    backgroundColor:
                      PRIMARY_COLOR,
                  }}
                  className="mx-auto mt-4 w-full max-w-sm rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition active:scale-[0.98] hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-6 sm:py-4 sm:text-base"
                >

                  {busy
                    ? "Verifying..."
                    : "Verify Attendance"}

                </button>

                {/* CANCEL */}

                <button
                  type="button"
                  onClick={
                    resetVerification
                  }
                  disabled={
                    busy
                  }
                  className="mt-3 py-2 text-sm text-slate-400 transition hover:text-white disabled:opacity-50 sm:mt-4"
                >
                  Cancel
                </button>

              </>

            ) : (

              /* ======================================================== */
              /* WAITING FOR FACE                                         */
              /* ======================================================== */

              <div className="text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-4xl sm:h-28 sm:w-28 sm:text-6xl">
                  👤
                </div>

                <h2 className="mt-4 text-2xl font-bold sm:mt-6 sm:text-3xl">

                  {cameraReady
                    ? "Scan Your Face"
                    : "Attendance Terminal"}

                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400 sm:mt-3">

                  {cameraReady
                    ? "Look directly at the camera. The terminal automatically scans every 2 seconds."
                    : "Start the terminal to begin attendance verification."}

                </p>

                {/* HOW IT WORKS */}

                <div className="mt-6 rounded-2xl bg-slate-800/60 p-4 text-left sm:mt-8 sm:p-5">

                  <div className="mb-2 text-sm font-medium text-white sm:text-base">
                    How it works
                  </div>

                  <div className="space-y-1 text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">

                    <div>
                      <span
                        style={{
                          color:
                            PRIMARY_COLOR,
                        }}
                        className="font-semibold"
                      >
                        1.
                      </span>{" "}
                      Face recognition identifies you.
                    </div>

                    <div>
                      <span
                        style={{
                          color:
                            PRIMARY_COLOR,
                        }}
                        className="font-semibold"
                      >
                        2.
                      </span>{" "}
                      Enter your attendance PIN.
                    </div>

                    <div>
                      <span
                        style={{
                          color:
                            PRIMARY_COLOR,
                        }}
                        className="font-semibold"
                      >
                        3.
                      </span>{" "}
                      First successful verification = check-in.
                    </div>

                    <div>
                      <span
                        style={{
                          color:
                            PRIMARY_COLOR,
                        }}
                        className="font-semibold"
                      >
                        4.
                      </span>{" "}
                      Second successful verification = check-out.
                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

        {/* ================================================================ */}
        {/* FOOTER                                                           */}
        {/* ================================================================ */}

        <div className="mt-4 pb-2 text-center text-[10px] text-slate-600 sm:mt-5 sm:text-xs">
          Authorized Office Attendance Terminal
        </div>

      </div>

    </div>
  );
}
