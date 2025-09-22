"use client";

import React, { useEffect, useState, useCallback } from "react";
import { OrganizerLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Users,
  MapPin,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Settings,
  FileSpreadsheet,
  Download,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";

// Types
type Faculty = {
  id: string;
  name: string;
  email?: string;
  eventName?: string;
  eventId: string;
  department?: string;
  institution?: string;
  expertise?: string;
  phone?: string;
};

type Room = { id: string; name: string };

type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: string;
  description?: string;
  eventType?: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    sessions: number;
    registrations: number;
  };
  facultyCount?: number;
};

type ExcelSessionData = {
  id: string;
  facultyName: string;
  email: string;
  place: string;
  sessionTitle: string;
  date: string;
  role: string;
  roomId: string;
  status: "Draft" | "Confirmed";
};

// ✅ FIXED: Enhanced Excel date conversion functions [web:5][web:7][web:131]
const convertExcelSerialToDate = (serial: number): string => {
  try {
    console.log(`🔄 Converting Excel serial: ${serial}`);

    // Excel's epoch starts from January 1, 1900, but Excel incorrectly treats 1900 as a leap year
    const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
    const msPerDay = 24 * 60 * 60 * 1000;

    // Excel has a leap year bug for 1900, so we need to adjust for dates after Feb 28, 1900
    const adjustedSerial = serial > 59 ? serial - 1 : serial;

    const convertedDate = new Date(
      excelEpoch.getTime() + (adjustedSerial - 1) * msPerDay
    );

    if (isNaN(convertedDate.getTime())) {
      console.error("❌ Invalid date conversion for serial:", serial);
      return "";
    }

    const year = convertedDate.getFullYear();
    const month = String(convertedDate.getMonth() + 1).padStart(2, "0");
    const day = String(convertedDate.getDate()).padStart(2, "0");

    const result = `${year}-${month}-${day}`;
    console.log(`✅ Serial ${serial} -> ${result}`);
    return result;
  } catch (error) {
    console.error("❌ Error converting Excel serial date:", error);
    return "";
  }
};

// ✅ ENHANCED: String date parser specifically for DD/MM/YYYY format [web:134]
const parseStringDate = (dateString: string): string => {
  if (!dateString || typeof dateString !== "string") return "";

  const cleanDate = dateString.toString().trim();
  console.log(`🔍 Parsing string date: "${cleanDate}"`);

  // Handle DD/MM/YYYY format (your Excel format: 17/11/2025)
  const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = cleanDate.match(ddmmyyyyRegex);

  if (match) {
    const day = parseInt(match[1] ?? "");
    const month = parseInt(match[2] ?? "");
    const year = parseInt(match[3] ?? "");

    console.log(
      `📅 Parsed DD/MM/YYYY: day=${day}, month=${month}, year=${year}`
    );

    // Create date assuming DD/MM/YYYY format
    const parsedDate = new Date(year, month - 1, day);

    if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() === year) {
      const formattedYear = parsedDate.getFullYear();
      const formattedMonth = String(parsedDate.getMonth() + 1).padStart(2, "0");
      const formattedDay = String(parsedDate.getDate()).padStart(2, "0");

      const result = `${formattedYear}-${formattedMonth}-${formattedDay}`;
      console.log(`✅ DD/MM/YYYY parsed: ${cleanDate} -> ${result}`);
      return result;
    }
  }

  // Try other formats
  const formats = [
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: "YMD" }, // YYYY-MM-DD
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: "DMY" }, // DD-MM-YYYY
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: "MDY" }, // MM/DD/YYYY (fallback)
  ];

  for (const format of formats) {
    const formatMatch = cleanDate.match(format.regex);
    if (formatMatch) {
      try {
        let year = 0,
          month = 0,
          day = 0;

        switch (format.order) {
          case "YMD":
            year = parseInt(formatMatch[1] ?? "");
            month = parseInt(formatMatch[2] ?? "");
            day = parseInt(formatMatch[3] ?? "");
            break;
          case "DMY":
            day = parseInt(formatMatch[1] ?? "");
            month = parseInt(formatMatch[2] ?? "");
            year = parseInt(formatMatch[3] ?? "");
            break;
          case "MDY":
            month = parseInt(formatMatch[1] ?? "");
            day = parseInt(formatMatch[2] ?? "");
            year = parseInt(formatMatch[3] ?? "");
            break;
        }

        if (year && month && day) {
          const parsedDate = new Date(year, month - 1, day);
          if (!isNaN(parsedDate.getTime())) {
            const formattedYear = parsedDate.getFullYear();
            const formattedMonth = String(parsedDate.getMonth() + 1).padStart(
              2,
              "0"
            );
            const formattedDay = String(parsedDate.getDate()).padStart(2, "0");

            const result = `${formattedYear}-${formattedMonth}-${formattedDay}`;
            console.log(`✅ ${format.order} parsed: ${cleanDate} -> ${result}`);
            return result;
          }
        }
      } catch (error) {
        console.error("❌ Error parsing date format:", error);
      }
    }
  }

  console.warn(`❌ Could not parse date: ${cleanDate}`);
  return "";
};

// ✅ ENHANCED: Master date parsing function [web:134][web:138]
const parseExcelDateValue = (value: any): string => {
  if (!value) return "";

  console.log(`🔍 Processing date value:`, { value, type: typeof value });

  // If it's already a Date object from Excel parsing
  if (value instanceof Date) {
    if (!isNaN(value.getTime()) && value.getTime() !== 0) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      const result = `${year}-${month}-${day}`;
      console.log(`✅ Date object processed: ${result}`);
      return result;
    } else {
      console.warn("❌ Invalid Date object:", value);
      return "";
    }
  }

  // If it's a number (Excel serial date)
  if (typeof value === "number" && value > 1 && value < 2958466) {
    return convertExcelSerialToDate(value);
  }

  // If it's a string, parse it
  if (typeof value === "string") {
    return parseStringDate(value);
  }

  console.warn(`❌ Unsupported date value type:`, {
    value,
    type: typeof value,
  });
  return "";
};

const ExcelSessionCreator: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedSessions, setParsedSessions] = useState<ExcelSessionData[]>([]);
  const [formStep, setFormStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [createdSessions, setCreatedSessions] = useState<any[]>([]);

  // Load events and rooms
  const loadEventsAndRooms = useCallback(async () => {
    try {
      const [eventsResponse, roomsResponse] = await Promise.all([
        fetch("/api/events", { cache: "no-store" }),
        fetch("/api/rooms", { cache: "no-store" }),
      ]);

      let eventsList: Event[] = [];
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        if (eventsData.success && eventsData.data?.events) {
          eventsList = eventsData.data.events;
        } else if (Array.isArray(eventsData)) {
          eventsList = eventsData;
        }
      }

      const roomsList = roomsResponse.ok ? await roomsResponse.json() : [];

      setEvents(eventsList);
      setRooms(roomsList);
    } catch (error) {
      console.error("❌ Error loading data:", error);
      setErrorMessage("Failed to load events or rooms.");
    }
  }, []);

  useEffect(() => {
    loadEventsAndRooms();
  }, [loadEventsAndRooms]);

  // Handle Excel file upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Excel file size should be less than 10MB");
      return;
    }

    setExcelFile(file);
    parseExcelFile(file);
  };

  // ✅ ENHANCED: Excel parsing with comprehensive date handling [web:89][web:129]
  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);

        console.log("📂 Starting Excel file parsing...");

        // ✅ ENHANCED: Excel parsing with better date handling
        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true, // Parse dates as Date objects
          cellNF: true, // Preserve number formats
          cellText: false, // Get raw values, not formatted text
          raw: false, // Ensure proper type conversion
          dateNF: "dd/mm/yyyy", // Expected date format
        });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("No worksheets found in Excel file");
        }

        const sheetName =
          workbook.SheetNames && workbook.SheetNames.length > 0
            ? workbook.SheetNames[0]
            : undefined;
        if (!sheetName) {
          throw new Error("No worksheet name found in Excel file");
        }
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          throw new Error("Worksheet not found");
        }

        console.log("📊 Converting Excel sheet to JSON...");

        // Get raw data with proper parsing
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          dateNF: "dd/mm/yyyy",
          defval: "",
        });

        console.log("📋 Raw Excel data:", jsonData);

        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1);

        console.log("📝 Headers:", headers);
        console.log("📊 Data rows count:", dataRows.length);

        // ✅ ENHANCED: Session mapping with comprehensive date handling
        const sessions: ExcelSessionData[] = dataRows
          .map((row: any, index: number) => {
            if (!row || row.length === 0) return null;

            console.log(`\n🔄 Processing row ${index + 1}:`, row);

            // Map headers to values
            const rowData: Record<string, any> = {};
            headers.forEach((header, headerIndex) => {
              if (header && headerIndex < row.length) {
                rowData[header.trim()] = row[headerIndex];
              }
            });

            console.log("🗂️ Row data mapped:", rowData);

            // Extract field values with multiple possible column names
            const facultyName =
              rowData["Faculty Name"] ||
              rowData["Name"] ||
              rowData["faculty_name"] ||
              rowData["Faculty"] ||
              rowData["Teacher"] ||
              "";
            const email =
              rowData["Email"] ||
              rowData["Email ID"] ||
              rowData["email"] ||
              rowData["Email Address"] ||
              rowData["Mail"] ||
              "";
            const place =
              rowData["Place"] ||
              rowData["Location"] ||
              rowData["place"] ||
              rowData["Venue"] ||
              rowData["Campus"] ||
              "";
            const sessionTitle =
              rowData["Session Title"] ||
              rowData["Title"] ||
              rowData["session_title"] ||
              rowData["Session"] ||
              rowData["Topic"] ||
              "";
            const rawDate =
              rowData["Date"] ||
              rowData["Session Date"] ||
              rowData["date"] ||
              rowData["Event Date"] ||
              rowData["Schedule Date"] ||
              "";
            const role =
              rowData["Role"] ||
              rowData["Description"] ||
              rowData["role"] ||
              rowData["Faculty Role"] ||
              rowData["Position"] ||
              "";

            console.log("📋 Extracted fields:", {
              facultyName,
              email,
              place,
              sessionTitle,
              rawDate,
              role,
            });

            // ✅ CRITICAL: Enhanced date processing
            let parsedDate = "";
            if (rawDate !== null && rawDate !== undefined && rawDate !== "") {
              console.log(`📅 Processing date for row ${index + 1}:`, {
                rawDate,
                type: typeof rawDate,
                isDate: rawDate instanceof Date,
                isNumber: typeof rawDate === "number",
              });

              parsedDate = parseExcelDateValue(rawDate);

              console.log(
                `📅 Date conversion result: "${rawDate}" -> "${parsedDate}"`
              );
            } else {
              console.warn(`⚠️ Row ${index + 1}: No date found`);
            }

            // Validate essential fields
            if (
              !facultyName?.toString().trim() ||
              !email?.toString().trim() ||
              !sessionTitle?.toString().trim()
            ) {
              console.warn(`❌ Row ${index + 1} missing essential data:`, {
                facultyName: !!facultyName,
                email: !!email,
                sessionTitle: !!sessionTitle,
              });
              return null;
            }

            const sessionData = {
              id: `excel-session-${index}`,
              facultyName: facultyName.toString().trim(),
              email: email.toString().trim(),
              place: place?.toString().trim() || "",
              sessionTitle: sessionTitle.toString().trim(),
              date: parsedDate || "",
              role: role?.toString().trim() || "",
              roomId: "",
              status: "Draft" as const,
            };

            console.log(
              `✅ Session created for row ${index + 1}:`,
              sessionData
            );
            return sessionData;
          })
          .filter(
            (
              session
            ): session is {
              id: string;
              facultyName: string;
              email: string;
              place: string;
              sessionTitle: string;
              date: string;
              role: string;
              roomId: string;
              status: "Draft";
            } => session !== null
          );

        console.log("\n📊 Parsing summary:");
        console.log(`- Total rows processed: ${dataRows.length}`);
        console.log(`- Valid sessions created: ${sessions.length}`);
        console.log(
          `- Sessions with dates: ${
            sessions.filter((s) => s.date && s.date !== "").length
          }`
        );

        // Validate sessions
        const invalidSessions = sessions.filter(
          (s) => !s.facultyName || !s.email || !s.sessionTitle
        );

        if (invalidSessions.length > 0) {
          console.error("❌ Invalid sessions found:", invalidSessions);
          setErrorMessage(
            `${invalidSessions.length} rows have missing required fields (Faculty Name, Email, Session Title). Please check your Excel file format.`
          );
          return;
        }

        // Validate dates
        const sessionsWithInvalidDates = sessions.filter(
          (s) => !s.date || s.date === ""
        );
        if (sessionsWithInvalidDates.length > 0) {
          console.error(
            "❌ Sessions with invalid dates:",
            sessionsWithInvalidDates.map((s) => s.sessionTitle)
          );
          setErrorMessage(
            `${sessionsWithInvalidDates.length} rows have invalid date formats. Please ensure dates are in DD/MM/YYYY format (like 17/11/2025).`
          );
          return;
        }

        setParsedSessions(sessions);
        setErrorMessage("");
        setSuccessMessage("");

        console.log(
          `✅ Successfully parsed ${sessions.length} sessions with valid dates!`
        );
      } catch (error) {
        console.error("❌ Excel parsing error:", error);
        setErrorMessage(
          `Failed to parse Excel file: ${
            error instanceof Error ? error.message : "Unknown error"
          }.`
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Update session data
  const updateSession = (
    sessionId: string,
    field: keyof ExcelSessionData,
    value: string
  ) => {
    setParsedSessions((sessions) =>
      sessions.map((session) =>
        session.id === sessionId ? { ...session, [field]: value } : session
      )
    );

    const errorKey = `${sessionId}-${field === "roomId" ? "room" : field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!selectedEventId) {
      errors.selectedEventId = "Please select an event";
    }

    if (parsedSessions.length === 0) {
      errors.excelFile = "Please upload and parse an Excel file";
    }

    parsedSessions.forEach((session) => {
      if (!session.facultyName.trim()) {
        errors[`${session.id}-name`] = "Faculty name is required";
      }
      if (!session.email.trim() || !session.email.includes("@")) {
        errors[`${session.id}-email`] = "Valid email is required";
      }
      if (!session.sessionTitle.trim()) {
        errors[`${session.id}-title`] = "Session title is required";
      }
      if (!session.date || session.date === "") {
        errors[`${session.id}-date`] = "Valid date is required";
      }
      if (!session.roomId || session.roomId.trim() === "") {
        errors[`${session.id}-room`] = "Room assignment is required";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ ENHANCED: Session creation with detailed date handling [web:129][web:133]
  const handleCreateSessions = async () => {
    if (!validateForm()) {
      setErrorMessage("Please fix all validation errors before proceeding.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const createdSessionsList = [];

      for (const [index, session] of parsedSessions.entries()) {
        console.log(
          `\n🚀 Creating session ${index + 1}/${parsedSessions.length}:`
        );
        console.log(`📝 Title: ${session.sessionTitle}`);
        console.log(`📅 Date: ${session.date}`);
        console.log(`👤 Faculty: ${session.facultyName} (${session.email})`);

        const formData = new FormData();

        // Add basic session data
        const appendSafely = (
          key: string,
          value: string | undefined | null,
          isRequired = true
        ) => {
          if (value !== undefined && value !== null && value.trim() !== "") {
            formData.append(key, value.trim());
            console.log(`✅ Added ${key}: ${value.trim()}`);
          } else if (isRequired) {
            throw new Error(
              `Missing required field: ${key} for session "${session.sessionTitle}"`
            );
          }
        };

        try {
          appendSafely("title", session.sessionTitle);
          appendSafely("facultyId", `excel-faculty-${session.email}`);
          appendSafely("email", session.email);
          appendSafely("place", session.place);
          appendSafely("roomId", session.roomId);
          appendSafely("description", session.role, false);
          appendSafely("status", session.status);
          appendSafely("eventId", selectedEventId);
          formData.append("invite_status", "Pending");

          // ✅ CRITICAL: Enhanced date handling with validation
          if (session.date && session.date !== "") {
            try {
              // Validate date format (should be YYYY-MM-DD)
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (!dateRegex.test(session.date)) {
                throw new Error(
                  `Invalid date format: ${session.date}. Expected YYYY-MM-DD.`
                );
              }

              // Create and validate date objects
              const sessionDate = new Date(session.date + "T00:00:00");
              if (isNaN(sessionDate.getTime())) {
                throw new Error(`Invalid date: ${session.date}`);
              }

              // Validate date is reasonable
              const currentYear = new Date().getFullYear();
              if (
                sessionDate.getFullYear() < 1900 ||
                sessionDate.getFullYear() > currentYear + 10
              ) {
                throw new Error(
                  `Date ${
                    session.date
                  } seems unreasonable (year: ${sessionDate.getFullYear()}).`
                );
              }

              // Create start and end times
              const startTime = `${session.date}T09:00:00`;
              const endTime = `${session.date}T17:00:00`;

              // Validate the constructed times
              const startDate = new Date(startTime);
              const endDate = new Date(endTime);

              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error(
                  `Invalid time construction from date: ${session.date}`
                );
              }

              formData.append("suggested_time_start", startTime);
              formData.append("suggested_time_end", endTime);

              console.log(`✅ Date processed successfully:`);
              console.log(`   📅 Session date: ${session.date}`);
              console.log(`   ⏰ Start time: ${startTime}`);
              console.log(`   ⏰ End time: ${endTime}`);
              console.log(
                `   📆 Readable: ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()}`
              );
            } catch (dateError) {
              console.error(
                `❌ Date processing error for "${session.sessionTitle}":`,
                dateError
              );
              throw new Error(
                `Date processing failed for session: ${session.sessionTitle}. ${dateError}`
              );
            }
          } else {
            throw new Error(
              `Session "${session.sessionTitle}" is missing a valid date`
            );
          }

          // Debug: Log all FormData entries
          console.log("📦 Complete FormData for API call:");
          for (let [key, value] of formData.entries()) {
            console.log(`   ${key}: ${value}`);
          }

          // Make API call
          console.log(`🌐 Sending API request for "${session.sessionTitle}"`);

          const response = await fetch("/api/sessions", {
            method: "POST",
            body: formData,
          });

          console.log(`📡 API Response status: ${response.status}`);

          if (response.ok) {
            const responseData = await response.json();
            console.log(`✅ Session created successfully:`, responseData);

            // Log database verification
            if (responseData.data) {
              console.log(`📅 Stored dates verification:`);
              console.log(`   Start: ${responseData.data.startTime}`);
              console.log(`   End: ${responseData.data.endTime}`);
            }

            createdSessionsList.push({
              ...responseData.data,
              facultyName: session.facultyName,
              originalEmail: session.email,
              sessionDate: session.date,
            });
          } else {
            const errorData = await response.json();
            console.error(
              `❌ API Error for "${session.sessionTitle}":`,
              errorData
            );
            throw new Error(
              errorData.error ||
                `Failed to create session: ${session.sessionTitle}`
            );
          }
        } catch (sessionError) {
          console.error(
            `❌ Session creation error for "${session.sessionTitle}":`,
            sessionError
          );
          throw sessionError;
        }
      }

      setCreatedSessions(createdSessionsList);
      setSuccessMessage(
        `🎉 Successfully created ${createdSessionsList.length} sessions with correct dates from Excel file!`
      );
      setFormStep(3);

      console.log(
        `\n🎉 COMPLETE: Created ${createdSessionsList.length} sessions successfully!`
      );
    } catch (error) {
      console.error("❌ Session creation process failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while creating sessions"
      );
    } finally {
      setLoading(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const templateData = [
      {
        "Faculty Name": "Dr. John Smith",
        Email: "john.smith@university.edu",
        Place: "Main Campus",
        "Session Title": "Introduction to AI",
        Date: "17/11/2025", // DD/MM/YYYY format
        Role: "Keynote Speaker - AI Expert",
      },
      {
        "Faculty Name": "Prof. Jane Doe",
        Email: "jane.doe@university.edu",
        Place: "Science Building",
        "Session Title": "Data Science Workshop",
        Date: "18/11/2025", // DD/MM/YYYY format
        Role: "Workshop Facilitator",
      },
      {
        "Faculty Name": "Dr. Mike Johnson",
        Email: "mike.johnson@university.edu",
        Place: "Engineering Block",
        "Session Title": "Machine Learning Basics",
        Date: "19/11/2025", // DD/MM/YYYY format
        Role: "Technical Lead",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sessions");
    XLSX.writeFile(workbook, "session_template_with_dates.xlsx");
  };

  const resetForm = () => {
    setSelectedEventId("");
    setExcelFile(null);
    setParsedSessions([]);
    setCreatedSessions([]);
    setFormStep(1);
    setValidationErrors({});
    setSuccessMessage("");
    setErrorMessage("");
  };

  const nextStep = () => {
    if (formStep === 1) {
      if (!selectedEventId) {
        setValidationErrors({ selectedEventId: "Please select an event" });
        return;
      }
      if (parsedSessions.length === 0) {
        setValidationErrors({
          excelFile: "Please upload and parse an Excel file",
        });
        return;
      }
    }
    setFormStep(formStep + 1);
  };

  const prevStep = () => {
    setFormStep(formStep - 1);
  };

  const allRoomsAssigned = parsedSessions.every(
    (s) => s.roomId && s.roomId.trim() !== ""
  );
  const assignedRoomsCount = parsedSessions.filter(
    (s) => s.roomId && s.roomId.trim() !== ""
  ).length;

  return (
    <OrganizerLayout>
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-lg">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-200 to-blue-200 bg-clip-text text-transparent">
                  Excel Session Creator
                </h1>
                <p className="text-gray-300 text-lg mt-1">
                  Upload Excel file to create sessions with proper date parsing
                  (DD/MM/YYYY format)
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {[
                { step: 1, title: "Event & Excel Upload", icon: Upload },
                { step: 2, title: "Review & Create Sessions", icon: Eye },
                { step: 3, title: "Success", icon: CheckCircle },
              ].map(({ step, title, icon: Icon }) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                      formStep >= step
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg"
                        : "bg-gray-800 border-gray-600 text-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{title}</span>
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-8 h-0.5 mx-2 ${
                        formStep > step ? "bg-emerald-500" : "bg-gray-600"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          {successMessage && (
            <Alert className="mb-6 border-green-600 bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200 font-medium">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert className="mb-6 border-red-600 bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200 font-medium">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-gray-700 shadow-2xl bg-gray-900/80 backdrop-blur">
                <CardHeader className="border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-800/50">
                  <CardTitle className="flex items-center gap-3 text-xl text-white">
                    <div className="p-2 rounded-lg bg-emerald-600/20">
                      <Settings className="h-5 w-5 text-emerald-400" />
                    </div>
                    {formStep === 1 && "Event Selection & Excel Upload"}
                    {formStep === 2 && "Review & Create Sessions"}
                    {formStep === 3 && "Sessions Created Successfully!"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-white">
                  {/* Step 1 */}
                  {formStep === 1 && (
                    <div className="space-y-6">
                      {/* Event Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                          <Calendar className="h-4 w-4 inline mr-2" />
                          Select Event *
                        </label>
                        <select
                          value={selectedEventId}
                          onChange={(e) => {
                            setSelectedEventId(e.target.value);
                            if (validationErrors.selectedEventId) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                selectedEventId: "",
                              }));
                            }
                          }}
                          className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-800 text-white ${
                            validationErrors.selectedEventId
                              ? "border-red-500 bg-red-900/20"
                              : "border-gray-600 hover:border-gray-500 focus:border-emerald-400"
                          }`}
                        >
                          <option value="">Choose Event</option>
                          {events.map((event) => (
                            <option key={event.id} value={event.id}>
                              {event.name}
                            </option>
                          ))}
                        </select>
                        {validationErrors.selectedEventId && (
                          <p className="text-red-400 text-sm mt-1">
                            {validationErrors.selectedEventId}
                          </p>
                        )}
                      </div>

                      {/* Template Download */}
                      <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4 flex items-center gap-2">
                          <Download className="h-5 w-5" />
                          Excel Template (DD/MM/YYYY Date Format)
                        </h3>
                        <p className="text-blue-300 text-sm mb-4">
                          Download the template with proper date format
                          examples.
                          <span className="font-medium text-blue-200">
                            {" "}
                            Use DD/MM/YYYY format for dates:
                          </span>
                        </p>
                        <ul className="text-blue-300 text-sm mb-4 pl-4">
                          <li>
                            • <strong>17/11/2025</strong> (17th November 2025)
                          </li>
                          <li>
                            • <strong>18/11/2025</strong> (18th November 2025)
                          </li>
                          <li>
                            • <strong>19/11/2025</strong> (19th November 2025)
                          </li>
                        </ul>
                        <Button
                          type="button"
                          onClick={downloadTemplate}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                      </div>

                      {/* File Upload */}
                      <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 hover:border-emerald-400 transition-all bg-gray-800/50">
                        <div className="text-center">
                          <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Upload Excel File with DD/MM/YYYY Dates
                          </h3>
                          <p className="text-gray-300 mb-4">
                            Upload Excel file with sessions and dates in
                            DD/MM/YYYY format
                          </p>

                          {!excelFile ? (
                            <div>
                              <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleExcelUpload}
                                className="hidden"
                                id="excel-upload"
                              />
                              <label
                                htmlFor="excel-upload"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-xl hover:from-emerald-600 hover:to-blue-700 cursor-pointer transition-all shadow-lg"
                              >
                                <Upload className="h-4 w-4" />
                                Choose Excel File
                              </label>
                              <p className="text-xs text-gray-400 mt-2">
                                .xlsx, .xls up to 10MB
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center gap-3">
                                <Badge className="bg-emerald-800 text-emerald-200 border-emerald-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {excelFile.name}
                                </Badge>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setExcelFile(null);
                                    setParsedSessions([]);
                                  }}
                                  className="border-red-600 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                              {parsedSessions.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-emerald-300">
                                    ✅ Parsed {parsedSessions.length} sessions!
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Dates:{" "}
                                    {
                                      parsedSessions.filter((s) => s.date)
                                        .length
                                    }
                                    /{parsedSessions.length} valid
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Required Columns */}
                      <div className="bg-yellow-900/20 border border-yellow-600 rounded-xl p-4">
                        <h4 className="text-yellow-200 font-medium mb-2">
                          Required Excel Columns:
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mb-3">
                          {[
                            "Faculty Name",
                            "Email",
                            "Place",
                            "Session Title",
                            "Role",
                          ].map((col) => (
                            <div key={col} className="text-yellow-300">
                              • {col}
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-yellow-600 pt-3">
                          <div className="text-yellow-300 font-medium">
                            • Date (DD/MM/YYYY format)
                          </div>
                          <div className="text-xs text-yellow-200 pl-4">
                            Example: 17/11/2025 for November 17, 2025
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2 */}
                  {formStep === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">
                          Review Sessions ({parsedSessions.length})
                        </h3>
                        <div className="flex items-center gap-4">
                          <Badge className="bg-emerald-800 text-emerald-200">
                            Event:{" "}
                            {events.find((e) => e.id === selectedEventId)?.name}
                          </Badge>
                          <Badge
                            className={
                              allRoomsAssigned
                                ? "bg-green-800 text-green-200"
                                : "bg-red-800 text-red-200"
                            }
                          >
                            Rooms: {assignedRoomsCount}/{parsedSessions.length}
                          </Badge>
                        </div>
                      </div>

                      {!allRoomsAssigned && (
                        <Alert className="border-red-600 bg-red-900/20">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                          <AlertDescription className="text-red-200">
                            <strong>Action Required:</strong> Please assign
                            rooms to all sessions before proceeding.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {parsedSessions.map((session, index) => (
                          <Card
                            key={session.id}
                            className={`border-gray-600 bg-gray-800/50 ${
                              !session.roomId || session.roomId.trim() === ""
                                ? "border-red-500 bg-red-900/10"
                                : ""
                            }`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-white text-base flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="bg-emerald-900/50 text-emerald-200"
                                  >
                                    #{index + 1}
                                  </Badge>
                                  {session.sessionTitle}
                                </CardTitle>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-emerald-300">
                                    📅 {session.date || "❌ No Date"}
                                  </div>
                                  {session.date && (
                                    <div className="text-xs text-gray-400">
                                      {new Date(
                                        session.date
                                      ).toLocaleDateString("en-GB", {
                                        weekday: "short",
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">
                                    Faculty:
                                  </span>
                                  <span className="text-white ml-2">
                                    {session.facultyName}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Email:</span>
                                  <span className="text-white ml-2">
                                    {session.email}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Place:</span>
                                  <span className="text-white ml-2">
                                    {session.place}
                                  </span>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="text-gray-400 block mb-1">
                                    Room: *
                                  </label>
                                  <select
                                    value={session.roomId}
                                    onChange={(e) =>
                                      updateSession(
                                        session.id,
                                        "roomId",
                                        e.target.value
                                      )
                                    }
                                    className={`w-full p-3 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                      !session.roomId ||
                                      session.roomId.trim() === ""
                                        ? "bg-red-900/20 border-2 border-red-500 text-red-200"
                                        : "bg-gray-800 border-2 border-gray-600 text-white hover:border-gray-500 focus:border-emerald-400"
                                    }`}
                                  >
                                    <option value="">
                                      ⚠️ Select Room (Required)
                                    </option>
                                    {rooms.map((room) => (
                                      <option key={room.id} value={room.id}>
                                        {room.name}
                                      </option>
                                    ))}
                                  </select>
                                  {(!session.roomId ||
                                    session.roomId.trim() === "") && (
                                    <p className="text-red-400 text-xs mt-1">
                                      Room assignment is required
                                    </p>
                                  )}
                                </div>
                              </div>
                              {session.role && (
                                <div className="mt-2 pt-2 border-t border-gray-700">
                                  <span className="text-gray-400 text-sm">
                                    Role/Description:
                                  </span>
                                  <p className="text-white text-sm mt-1">
                                    {session.role}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div
                        className={`border rounded-lg p-4 ${
                          allRoomsAssigned
                            ? "bg-emerald-900/20 border-emerald-700"
                            : "bg-yellow-900/20 border-yellow-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {allRoomsAssigned ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-emerald-400" />
                              <span className="font-medium text-emerald-200">
                                Ready to create {parsedSessions.length} sessions
                                with proper dates! ✓
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-yellow-400" />
                              <span className="font-medium text-yellow-200">
                                Please assign rooms to all sessions
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3 */}
                  {formStep === 3 && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-emerald-800 to-emerald-800/50 rounded-xl p-6 border border-emerald-700">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                          Sessions Created Successfully with Correct Dates!
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4 text-sm mb-6">
                          <div>
                            <span className="font-medium text-gray-300">
                              Event:
                            </span>
                            <p className="text-white">
                              {
                                events.find((e) => e.id === selectedEventId)
                                  ?.name
                              }
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-300">
                              Total Sessions:
                            </span>
                            <p className="text-white">
                              {createdSessions.length}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-300">
                              Unique Faculty:
                            </span>
                            <p className="text-white">
                              {
                                new Set(
                                  createdSessions.map(
                                    (s) => s.originalEmail || s.email
                                  )
                                ).size
                              }
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-300">
                              Status:
                            </span>
                            <p className="text-emerald-300">
                              Sessions Created & Stored ✓
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-300">
                            Created Sessions:
                          </h4>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {createdSessions.map((session, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center text-sm bg-gray-800/50 rounded p-2"
                              >
                                <div className="flex-1">
                                  <span className="text-white">
                                    {session.facultyName || session.title}
                                  </span>
                                  <span className="text-gray-400 ml-2">
                                    ({session.originalEmail || session.email})
                                  </span>
                                  {session.sessionDate && (
                                    <div className="text-xs text-emerald-300">
                                      📅{" "}
                                      {new Date(
                                        session.sessionDate
                                      ).toLocaleDateString("en-GB")}
                                    </div>
                                  )}
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  Created ✓
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Alert className="border-emerald-600 bg-emerald-900/20">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <AlertDescription className="text-emerald-200">
                          <strong>
                            All {createdSessions.length} sessions have been
                            created and stored with proper dates from your Excel
                            file!
                          </strong>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-8 border-t border-gray-700">
                    <div>
                      {formStep > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          Previous Step
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {formStep === 1 && (
                        <Button
                          type="button"
                          onClick={nextStep}
                          disabled={
                            !selectedEventId || parsedSessions.length === 0
                          }
                          className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-50"
                        >
                          Continue to Review
                        </Button>
                      )}

                      {formStep === 2 && (
                        <Button
                          type="button"
                          onClick={handleCreateSessions}
                          disabled={loading || !allRoomsAssigned}
                          className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating {parsedSessions.length} Sessions...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Create {parsedSessions.length} Sessions
                            </>
                          )}
                        </Button>
                      )}

                      {formStep === 3 && (
                        <Button
                          type="button"
                          onClick={resetForm}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Create More Sessions
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-gray-700 shadow-xl bg-gradient-to-br from-gray-800 to-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                    Enhanced Date Processing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded bg-emerald-800">
                      <Calendar className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        DD/MM/YYYY Support
                      </p>
                      <p className="text-gray-300 text-xs">
                        Proper handling of European date format
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded bg-blue-800">
                      <Users className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        Excel Serial Numbers
                      </p>
                      <p className="text-gray-300 text-xs">
                        Converts Excel date serial numbers correctly
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded bg-green-800">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Date Validation</p>
                      <p className="text-gray-300 text-xs">
                        Ensures all dates are valid and reasonable
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded bg-purple-800">
                      <Settings className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Fixed 1970 Bug</p>
                      <p className="text-gray-300 text-xs">
                        No more epoch date errors
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-700 shadow-xl bg-gray-900/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Processing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {parsedSessions.length}
                      </div>
                      <p className="text-gray-400 text-sm">Sessions Parsed</p>
                    </div>

                    {parsedSessions.length > 0 && (
                      <div>
                        <div className="text-2xl font-bold text-emerald-400">
                          {
                            parsedSessions.filter(
                              (s) => s.date && s.date !== ""
                            ).length
                          }
                        </div>
                        <p className="text-gray-400 text-sm">Valid Dates</p>
                      </div>
                    )}

                    {formStep >= 3 && (
                      <div>
                        <div className="text-2xl font-bold text-emerald-400">
                          {createdSessions.length}
                        </div>
                        <p className="text-gray-400 text-sm">
                          Sessions Created
                        </p>
                      </div>
                    )}

                    {formStep >= 2 && parsedSessions.length > 0 && (
                      <div className="pt-4 border-t border-gray-700">
                        <div className="text-sm text-gray-300 space-y-2">
                          <div className="flex justify-between">
                            <span>Dates Parsed:</span>
                            <span className="text-emerald-400">
                              {parsedSessions.filter((s) => s.date).length}/
                              {parsedSessions.length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rooms Assigned:</span>
                            <span
                              className={
                                allRoomsAssigned
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {assignedRoomsCount}/{parsedSessions.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default ExcelSessionCreator;
