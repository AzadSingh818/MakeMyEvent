import { sendMail } from "@/lib/mailer";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const FACULTY_DATA = {
  "muigoku42@gmail.com": {
    facultyName: "Arunaditya Lal",
    email: "muigoku42@gmail.com",
    sessions: [
      {
        title: "Advanced Pediatric Critical Care Management",
        date: "8/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  // "praj@abhinavagroup.com": {
  //   facultyName: "Prajwal P",
  //   email: "praj@abhinavagroup.com",
  //   sessions: [
  //     {
  //       title: "Talk on test data of scientific commitments",
  //       date: "9/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "MCC",
  //       date: "8/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "dr.amitvij2@gmail.com": {
  //   facultyName: "Amit Vij",
  //   email: "dr.amitvij2@gmail.com",
  //   sessions: [
  //     {
  //       title: "Electrolyte Emergencies in the PICU: Algorithms, Controversies, and Pitfalls",
  //       date: "9/11",
  //       role: "Panelist",
  //       description: "---"
  //     }
  //   ]
  // },
  // "bananip@hotmail.com": {
  //   facultyName: "Banani Poddar",
  //   email: "bananip@hotmail.com",
  //   sessions: [
  //     {
  //       title: "Data Dreams or Data Drama? Unmasking the National PICU Database (agenda - National pediatric critical database myths and reality)",
  //       date: "8/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "Interpreting Critical Labs in Suspected Metabolic Disease",
  //       date: "8/11",
  //       role: "Moderator",
  //       description: "---"
  //     }
  //   ]
  // },
  // "deepankarbansal@outlook.com": {
  //   facultyName: "Deepankar Bansal",
  //   email: "deepankarbansal@outlook.com",
  //   sessions: [
  //     {
  //       title: "Friend, Foe, or Firefighting Tool? CRRT & Plasmapheresis in Pediatric ALF",
  //       date: "9/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "PICU Liberation",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "jollymyla@gmail.com": {
  //   facultyName: "Jolly Chandran",
  //   email: "jollymyla@gmail.com",
  //   sessions: [
  //     {
  //       title: "Innovators of Tomorrow: Pediatric Critical Care DM/DrNB Thesis Awards",
  //       date: "7/11",
  //       role: "Chairperson\n\nCo-Chairperson: Dr Rachana",
  //       description: "---"
  //     },
  //     {
  //       title: "Friend, Foe, or Firefighting Tool? CRRT & Plasmapheresis in Pediatric ALF",
  //       date: "9/11",
  //       role: "Moderator",
  //       description: "---"
  //     },
  //     {
  //       title: "BPICC",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "ksachane@yahoo.com": {
  //   facultyName: "Kapil Sachane",
  //   email: "ksachane@yahoo.com",
  //   sessions: [
  //     {
  //       title: "Pediatric Mechanical Circulatory Assistance from Innovation to Impact-Tiny Hearts, Big Support.",
  //       date: "8/11",
  //       role: "Speaker",
  //       description: "---"
  //     },
  //     {
  //       title: "ECMO",
  //       date: "6/11",
  //       role: "Local Cordinator",
  //       description: "---"
  //     }
  //   ]
  // },
  // "manjinderk75@gmail.com": {
  //   facultyName: "Ms Manjinder Kaur",
  //   email: "manjinderk75@gmail.com",
  //   sessions: [
  //     {
  //       title: "Plenary - PediCritiCon Keynotes",
  //       date: "7/11",
  //       role: "Plenary",
  //       description: "---"
  //     },
  //     {
  //       title: "CRRT and SLED",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "mehakbansal@yahoo.com": {
  //   facultyName: "Mehak Bansal",
  //   email: "mehakbansal@yahoo.com",
  //   sessions: [
  //     {
  //       title: "PediCritiCon Imaging Honors: Clinico-Radiology Case Awards",
  //       date: "7/11",
  //       role: "Chairperson",
  //       description: "---"
  //     },
  //     {
  //       title: "Echo in Action: Real-Time Clarity for Real-Life Hemodynamics.",
  //       date: "8/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "POCUS (Basic)",
  //       date: "6/11",
  //       role: "National Coordinator",
  //       description: "---"
  //     }
  //   ]
  // },
  // "neerajverma1957@yahoo.com": {
  //   facultyName: "Neeraj Verma",
  //   email: "neerajverma1957@yahoo.com",
  //   sessions: [
  //     {
  //       title: "Burnout in PICU: Caring for the Caring Team",
  //       date: "9/11",
  //       role: "Panelist",
  //       description: "---"
  //     }
  //   ]
  // },
  // "dr.prashantmitharwal@gmail.com": {
  //   facultyName: "Prashant Mitharwal",
  //   email: "dr.prashantmitharwal@gmail.com",
  //   sessions: [
  //     {
  //       title: "Keeping the Calm: Practical Challenges in Sedating the ECMO Child",
  //       date: "9/11",
  //       role: "Panelist",
  //       description: "---"
  //     }
  //   ]
  // },
  // "poonipa@yahoo.com": {
  //   facultyName: "Puneet Pooni",
  //   email: "poonipa@yahoo.com",
  //   sessions: [
  //     {
  //       title: "Between Guidelines and Ground Reality: Talking to Families in Indian PICUs",
  //       date: "8/11",
  //       role: "Moderator",
  //       description: "---"
  //     }
  //   ]
  // },
  // "krramesh_iway@yahoo.co.in": {
  //   facultyName: "Ramesh Kumar",
  //   email: "krramesh_iway@yahoo.co.in",
  //   sessions: [
  //     {
  //       title: "cEEG: Essential Surveillance or Expensive Overkill?",
  //       date: "8/11",
  //       role: "Debater - FOR OR AGAINST",
  //       description: "---"
  //     },
  //     {
  //       title: "Advanced Ventilation",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drpandian81@gmail.com": {
  //   facultyName: "Sarvanan Pandian",
  //   email: "drpandian81@gmail.com",
  //   sessions: [
  //     {
  //       title: "Post-Transplant Panic: ICU Nightmares After Pediatric Liver Transplant",
  //       date: "9/11",
  //       role: "Speaker",
  //       description: "---"
  //     }
  //   ]
  // },
  // "satheeshponnar@gmail.com": {
  //   facultyName: "Satheesh Ponnarneni",
  //   email: "satheeshponnar@gmail.com",
  //   sessions: [
  //     {
  //       title: "Management of Complications related to blood based dialysis in PICU",
  //       date: "7/11",
  //       role: "Moderator",
  //       description: "---"
  //     },
  //     {
  //       title: "CRRT and SLED",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "kandathsathish@gmail.com": {
  //   facultyName: "K.Sathish Kumar",
  //   email: "kandathsathish@gmail.com",
  //   sessions: [
  //     {
  //       title: "Beyond Survival: Navigating Long-Stay Challenges in the PICU",
  //       date: "9/11",
  //       role: "Speaker",
  //       description: "---"
  //     }
  //   ]
  // },
  // "narayanankarthik86@gmail.com": {
  //   facultyName: "Karthik Narayanan",
  //   email: "narayanankarthik86@gmail.com",
  //   sessions: [
  //     {
  //       title: "Data Dreams or Data Drama? Unmasking the National PICU Database",
  //       date: "8/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "Quiz",
  //       date: "7/11",
  //       role: "Quiz Master",
  //       description: "---"
  //     },
  //     {
  //       title: "POCUS (Advanced)",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "bpkaruns@gmail.com": {
  //   facultyName: "Karunakar BP",
  //   email: "bpkaruns@gmail.com",
  //   sessions: [
  //     {
  //       title: "Interpreting Critical Labs in Suspected Metabolic Diseases",
  //       date: "8/11",
  //       role: "Panelist",
  //       description: "---"
  //     }
  //   ]
  // },
  // "reshma1987@gmail.com": {
  //   facultyName: "Reshma A",
  //   email: "reshma1987@gmail.com",
  //   sessions: [
  //     {
  //       title: "HSCT: Navigating HSCT Challenges",
  //       date: "7/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "PCCN workshop",
  //       date: "6 NOV",
  //       role: "Workshop",
  //       description: "---"
  //     }
  //   ]
  // },
  // "saumenmeur@yahoo.co.uk": {
  //   facultyName: "Saumen Meur",
  //   email: "saumenmeur@yahoo.co.uk",
  //   sessions: [
  //     {
  //       title: "Management of Complications related to blood based dialysis in PICU",
  //       date: "7/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "POCUS (Basic)",
  //       date: "6/11",
  //       role: "Worskshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "ssenthilsmc@yahoo.co.in": {
  //   facultyName: "Senthil Kumar",
  //   email: "ssenthilsmc@yahoo.co.in",
  //   sessions: [
  //     {
  //       title: "Top 5 ICU Red Flags You Should Never Miss",
  //       date: "9/11",
  //       role: "Speaker",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drshalugupta@yahoo.co.in": {
  //   facultyName: "Shalu Gupta",
  //   email: "drshalugupta@yahoo.co.in",
  //   sessions: [
  //     {
  //       title: "Interpreting Critical Labs in Suspected Metabolic Disease",
  //       date: "8/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "Friend, Foe, or Firefighting Tool? CRRT & Plasmapheresis in Pediatric ALF",
  //       date: "9/11",
  //       role: "Panellist",
  //       description: "---"
  //     },
  //     {
  //       title: "BPICC",
  //       date: "6/11",
  //       role: "Worskshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drshiv2014@gmail.com": {
  //   facultyName: "Shivkumar",
  //   email: "drshiv2014@gmail.com",
  //   sessions: [
  //     {
  //       title: "Stamp of Quality or Just a Stamp? Impact of PICU Accreditation",
  //       date: "9/11",
  //       role: "Debater - Just a Stamp",
  //       description: "---"
  //     },
  //     {
  //       title: "POCUS (Basic)",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "shrishu@yahoo.com": {
  //   facultyName: "Shrishu Kamath",
  //   email: "shrishu@yahoo.com",
  //   sessions: [
  //     {
  //       title: "Rescue, Restore, Rewire: Protecting the Pediatric Brain After Trauma and Arrest.",
  //       date: "8/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "Difficult Airway: Plan-B and Beyond",
  //       date: "9/11",
  //       role: "Speaker",
  //       description: "---"
  //     }
  //   ]
  // },
  // "shubhadeepnrsdoc@gmail.com": {
  //   facultyName: "Shubhadeep Das",
  //   email: "shubhadeepnrsdoc@gmail.com",
  //   sessions: [
  //     {
  //       title: "Infections in the Cardiac ICU: When Bugs Break Hearts",
  //       date: "7/11",
  //       role: "Speaker",
  //       description: "---"
  //     },
  //     {
  //       title: "Cardiac Critical Care",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "siva.anjin@gmail.com": {
  //   facultyName: "Siva Vyasam",
  //   email: "siva.anjin@gmail.com",
  //   sessions: [
  //     {
  //       title: "Super-Refractory Status Epilepticus: How Far Should We Go?",
  //       date: "7/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "Simulation",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drsonal287@gmail.com": {
  //   facultyName: "Sonal Gajbhiya",
  //   email: "drsonal287@gmail.com",
  //   sessions: [
  //     {
  //       title: "Liver Transplant: Mastering Post-Op Complications",
  //       date: "7/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "POCUS (Advanced)",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drsudani@gmail.com": {
  //   facultyName: "Soonu Udani",
  //   email: "drsudani@gmail.com",
  //   sessions: [
  //     {
  //       title: "Hemophagocytic Lymphohistiocytosis (HLH) and Macrophage Activation Syndrome: ICU Diagnosis and Management",
  //       date: "7/11",
  //       role: "Speaker",
  //       description: "---"
  //     },
  //     {
  //       title: "From Collapse to Comeback: Pediatric Cardiac Arrest through the Lens of Multidisciplinary Care",
  //       date: "8/11",
  //       role: "Panelist",
  //       description: "---"
  //     }
  //   ]
  // },
  // "sudeepkecy2011@gmail.com": {
  //   facultyName: "Sudeep KC",
  //   email: "sudeepkecy2011@gmail.com",
  //   sessions: [
  //     {
  //       title: "Rescue, Restore, Rewire: Protecting the Pediatric Brain After Trauma and Arrest.",
  //       date: "8/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "PCCN workshop",
  //       date: "6/11",
  //       role: "Work shop",
  //       description: "---"
  //     }
  //   ]
  // },
  // "sumantsp22@gmail.com": {
  //   facultyName: "Sumant Patil",
  //   email: "sumantsp22@gmail.com",
  //   sessions: [
  //     {
  //       title: "Management of Complications related to blood based dialysis in PICU",
  //       date: "7/11",
  //       role: "Panelist",
  //       description: "---"
  //     }
  //   ]
  // },
  // "sunit.singhi@gmail.com": {
  //   facultyName: "Sunit Singhi",
  //   email: "sunit.singhi@gmail.com",
  //   sessions: [
  //     {
  //       title: "Pediatric respiratory critical care research and promoting the development of a research network in India- identifying key gaps",
  //       date: "7/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "Building Leaders in Pediatric Critical Care: A Roadmap for India's Future",
  //       date: "8/11",
  //       role: "Speaker",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drschandrasekar@yahoo.com": {
  //   facultyName: "Supraja Chandrasekhar",
  //   email: "drschandrasekar@yahoo.com",
  //   sessions: [
  //     {
  //       title: "RRT Timing: Act Fast or Wait Smart?",
  //       date: "8/11",
  //       role: "Debater - FOR Wait Smart",
  //       description: "---"
  //     },
  //     {
  //       title: "Simulation",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drskpanuganti@gmail.com": {
  //   facultyName: "Dr Suresh Kumar Panugati",
  //   email: "drskpanuganti@gmail.com",
  //   sessions: [
  //     {
  //       title: "Electrolyte Emergencies in the PICU: Algorithms, Controversies, and Pitfalls",
  //       date: "9/11",
  //       role: "Panelist",
  //       description: "---"
  //     }
  //   ]
  // },
  // "sureshangurana@gmail.com": {
  //   facultyName: "Suresh Kumar Angurana",
  //   email: "sureshangurana@gmail.com",
  //   sessions: [
  //     {
  //       title: "The Gut-Brain Axis in Pediatric ICU: A Microbiome Perspective",
  //       date: "9/11",
  //       role: "Speaker",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drumaali22@gmail.com": {
  //   facultyName: "Uma Ali",
  //   email: "drumaali22@gmail.com",
  //   sessions: [
  //     {
  //       title: "Managing Sodium disurbances during CRRT",
  //       date: "9/11",
  //       role: "Speaker",
  //       description: "---"
  //     },
  //     {
  //       title: "Friend, Foe, or Firefighting Tool? CRRT & Plasmapheresis in Pediatric ALF",
  //       date: "9/11",
  //       role: "Panellist",
  //       description: "---"
  //     }
  //   ]
  // },
  // "vasanthbabblu@gmail.com": {
  //   facultyName: "Vasanth",
  //   email: "vasanthbabblu@gmail.com",
  //   sessions: [
  //     {
  //       title: "Antibiotics on the Clock: Timing, Dosing, and De-escalation in the ICU.",
  //       date: "9/11",
  //       role: "Speaker",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drvraghunathan@gmail.com": {
  //   facultyName: "Veena Raghunathan",
  //   email: "drvraghunathan@gmail.com",
  //   sessions: [
  //     {
  //       title: "Coming Off CRRT: Protocol Precision or Clinical Wisdom?",
  //       date: "9/11",
  //       role: "Debater - FOR PROTOCOL PRECISION",
  //       description: "---"
  //     },
  //     {
  //       title: "Nursing Respiratory Care",
  //       date: "6/11",
  //       role: "Workshop Faculty",
  //       description: "---"
  //     }
  //   ]
  // },
  // "vijaiwilliams@gmail.com": {
  //   facultyName: "Vijai Williams",
  //   email: "vijaiwilliams@gmail.com",
  //   sessions: [
  //     {
  //       title: "Start Slow or Start Smart? Should Golden Hour DKA Management Be Aggressively Standardized?",
  //       date: "8/11",
  //       role: "Debater - FOR Start Smart",
  //       description: "---"
  //     }
  //   ]
  // },
  // "dr.vikas.78@gmail.com": {
  //   facultyName: "Vikas Bansal",
  //   email: "dr.vikas.78@gmail.com",
  //   sessions: [
  //     {
  //       title: "The New Gold Standard in Ventilation? In Mechanical Power We Trust… or Not?",
  //       date: "8/11",
  //       role: "Debater - WE TRUST",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drvikastaneja@yahoo.co.in": {
  //   facultyName: "Vikas Taneja",
  //   email: "drvikastaneja@yahoo.co.in",
  //   sessions: [
  //     {
  //       title: "The New Gold Standard in Ventilation? In Mechanical Power We Trust… or Not?",
  //       date: "8/11",
  //       role: "Debater - NOT TRUST",
  //       description: "---"
  //     }
  //   ]
  // },
  // "vinpreethadi@gmail.com": {
  //   facultyName: "Vinay Joshi",
  //   email: "vinpreethadi@gmail.com",
  //   sessions: [
  //     {
  //       title: "Silent Hypoxia: Recognizing & Managing Pulmonary Hypertensive Crisis",
  //       date: "7/11",
  //       role: "Speaker",
  //       description: "---"
  //     }
  //   ]
  // },
  // "patkivinayak@gmail.com": {
  //   facultyName: "Vinayak Patki",
  //   email: "patkivinayak@gmail.com",
  //   sessions: [
  //     {
  //       title: "Rescue, Restore, Rewire: Protecting the Pediatric Brain After Trauma and Arrest.",
  //       date: "8/11",
  //       role: "Moderator",
  //       description: "---"
  //     }
  //   ]
  // },
  // "ratageri@rediffmail.com": {
  //   facultyName: "Vinod Ratageri",
  //   email: "ratageri@rediffmail.com",
  //   sessions: [
  //     {
  //       title: "Belly Under Siege: Clinical Clues and ICU Strategies for ACS",
  //       date: "9/11",
  //       role: "Speaker",
  //       description: "---"
  //     }
  //   ]
  // },
  // "vbuche@gmail.com": {
  //   facultyName: "Vishram Buche",
  //   email: "vbuche@gmail.com",
  //   sessions: [
  //     {
  //       title: "The Arterial Truth: Using Trends to Guide Real-Time Decisions",
  //       date: "9/11",
  //       role: "Speaker",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drvsvprasad@gmail.com": {
  //   facultyName: "VSV Prasad",
  //   email: "drvsvprasad@gmail.com",
  //   sessions: [
  //     {
  //       title: "Fluid, Not Flood: Smarter Resuscitation in the PICU",
  //       date: "8/11",
  //       role: "Panelist",
  //       description: "---"
  //     },
  //     {
  //       title: "Buying Smart: Equipping Your PICU for Function, Not Fashion",
  //       date: "9/11",
  //       role: "Moderator",
  //       description: "---"
  //     }
  //   ]
  // },
  // "drgirishc@gmail.com": {
  //   facultyName: "Girish H C",
  //   email: "drgirishc@gmail.com",
  //   sessions: [
  //     {
  //       title: "Accidental Drug Overdose or Wrong Drug in the PICU: First Response and Reporting",
  //       date: "9/11",
  //       role: "Speaker",
  //       description: "---"
  //     }
  //   ]
  // }
};
// Generate HTML for a specific faculty member
function renderFacultyHTML(facultyEmail: string) {
  const facultyData = FACULTY_DATA[facultyEmail as keyof typeof FACULTY_DATA];

  if (!facultyData) {
    console.error(`No data found for faculty: ${facultyEmail}`);
    return "";
  }

  const loginUrl = `${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(facultyData.email)}`;

  const rows = facultyData.sessions
    .map(
      (s) => `
      <tr style="border-bottom: 1px solid #eaeaea;">
        <td style="padding:12px; border-right:1px solid #ddd;">${s.title}</td>
        <td style="padding:12px; border-right:1px solid #ddd;">${s.date}</td>
        <td style="padding:12px; border-right:1px solid #ddd;">${s.role}</td>
        <td style="padding:12px;">${s.description}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Session Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height:1.5; color:#333; max-width:600px; margin:0 auto; padding:20px;">
  
  <!-- Header -->
  <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 10px 10px 0 0; overflow: hidden;">
      <!-- PediCritiCon Header Image -->
      <img src="https://make-my-event.vercel.app/images/pedicriticon-header.png" 
           alt="PediCritiCon 2025 Header - 6th to 9th November 2025"
           style="width: 100%; height: auto; display: block; max-width: 600px;" />
  </div>

  <div style="background:#fff; padding:30px; border:1px solid #ddd;">
    <h1 style="color:#764ba2; text-align:center; margin-bottom:20px;">PediCritiCon 2025, Hyderabad</h1>
    
    <p>Dear Dr. <strong>${facultyData.facultyName}</strong>,</p>
    <p>Greetings from the Scientific Committee, PediCritiCon 2025!</p>
    <p>It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.</p>
    <p>Your proposed faculty role${facultyData.sessions.length > 1 ? "s are" : " is"} outlined below:</p>
    
    <!-- 4-column table with description -->
    <table style="width:100%; border-collapse: collapse; margin:20px 0;">
      <thead style="background:#efefef;">
        <tr>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Title</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Date</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Role</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd;">Description</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <!-- Conference Registration & Participation -->
    <div style="background: #fff8e1; border: 1px solid #ffcc02; border-radius: 6px; padding: 15px; margin: 25px 0;">
      <h4 style="color: #e65100; margin: 0 0 10px 0; font-size: 14px;">📋 Conference Acceptance & Details:</h4>
      <p style="color: #bf360c; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
          <strong>Please confirm your acceptance by clicking Accept or Decline on the faculty dashboard</strong>
      </p>
    </div>

    <!-- Access Faculty Dashboard Button -->
    <p style="text-align:center; margin: 30px 0;">
      <a href="${loginUrl}" target="_blank" style="
        background:#764ba2;
        color:#fff;
        padding:15px 25px;
        border-radius:25px;
        text-decoration:none;
        font-weight:bold;
        font-size:16px;
        box-shadow:0 4px 15px rgba(118,75,162,0.4);
        ">
        🔐 Access Faculty Dashboard
      </a>
    </p>

    <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 6px; padding: 15px; margin: 25px 0;">
        <h4 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 14px;">🔹 Hospitality & Travel:</h4>
        <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
            <strong>Accommodation:</strong> We will provide you with twin-sharing accommodation for the duration of the conference. Email will follow with more details on this.
        </p>
        <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
            <strong>Travel:</strong> You are requested to kindly arrange your own travel.
        </p>
        <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
            <strong>Registration:</strong> You will receive a unique link at early bird rates upon acceptance of the invite.
        </p>
    </div>

    <div style="background: #f0f9ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin: 25px 0;">
        <p style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
            Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. 
            If you are unable to accept or face a scheduling conflict, please indicate <strong>No</strong> on the faculty dashboard at 
            the earliest so we may make suitable adjustments.
        </p>
        <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
            We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 
            a memorable success.
        </p>
    </div>

    <div style="margin: 25px 0; padding: 15px; background: #f7fafc; border-left: 4px solid #764ba2; border-radius: 4px;">
        <p style="color: #2d3748; margin: 0; font-size: 14px; font-weight: 500;">
            Warm regards,<br>
            <span style="color: #764ba2;">Scientific Committee, PediCritiCon 2025</span>
        </p>
    </div>
    
    <p style="font-size:12px; color:#666; text-align:center; margin-top:20px;">
      If you have questions, contact your event coordinator. This message was sent automatically.
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 0 0 10px 10px; margin-top: 10px; overflow: hidden;">
      <!-- PediCritiCon Footer Image -->
      <img src="https://make-my-event.vercel.app/images/pedicriticon-footer.png" 
           alt="PediCritiCon 2025 Footer - Scan for Website, Helpline: 63646 90353"
           style="width: 100%; height: auto; display: block; max-width: 600px;" />
  </div>
</body>
</html>
`;
}

// Generate plain text email for a specific faculty member
function generateFacultyTextEmail(facultyEmail: string) {
  const facultyData = FACULTY_DATA[facultyEmail as keyof typeof FACULTY_DATA];

  if (!facultyData) {
    return "";
  }

  const sessionsText = facultyData.sessions
    .map((s, index) => `Date ${s.date}:
Session: ${s.title}
Role: ${s.role}
Description: ${s.description}`)
    .join("\n\n");

  return `Subject: PediCritiCon 2025 - Faculty Invitation

Dear Dr. ${facultyData.facultyName},

Greetings from the Scientific Committee, PediCritiCon 2025!

It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.

📅 Dates: November 6–9, 2025
📍 Venue: Hyderabad International Convention Centre (HICC), Hyderabad, India

Your proposed faculty role${facultyData.sessions.length > 1 ? "s are" : " is"} outlined below:

Your Faculty Invitation – PediCritiCon 2025

${sessionsText}

👉 Kindly confirm your acceptance by clicking Yes or No 
Login here: ${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(facultyData.email)}

🔹 Hospitality & Travel:
Accommodation: We will provide you with twin-sharing accommodation for the duration of the conference. Email will follow with more details on this.
Travel: You are requested to kindly arrange your own travel.
Registration: You will receive a unique link at early bird rates upon acceptance of the invite.

Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. If you are unable to accept or face a scheduling conflict, please indicate No at the earliest so we may make suitable adjustments.

We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 a memorable success.

Warm regards,
Scientific Committee, PediCritiCon 2025
`;
}

/**
 * Send personalized emails to Shruti and Vidyashankar
 */
export async function sendBulkInviteEmail(
  sessions?: any[],  // Ignored
  facultyName?: string,  // Ignored  
  email?: string  // Ignored
) {
  const results = [];

  // Send personalized email to each faculty member (only Shruti and Vidyashankar)
  for (const [facultyEmail, facultyData] of Object.entries(FACULTY_DATA)) {
    try {
      const html = renderFacultyHTML(facultyEmail);
      const text = generateFacultyTextEmail(facultyEmail);

      const result = await sendMail({
        to: facultyData.email,
        subject: `PediCritiCon 2025 - Faculty Invitation`,
        text,
        html,
      });

      results.push({
        email: facultyData.email,
        name: facultyData.facultyName,
        success: result.ok,
        message: result.message || "Email sent successfully"
      });

      console.log(`Email sent to ${facultyData.facultyName} (${facultyData.email}): ${result.ok ? 'Success' : 'Failed'}`);

    } catch (error) {
      console.error(`Failed to send email to ${facultyData.facultyName}:`, error);
      results.push({
        email: facultyData.email,
        name: facultyData.facultyName,
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Return summary of all sends
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  console.log(`Email Summary: ${successCount} successful, ${failureCount} failed out of ${results.length} total`);

  return {
    ok: failureCount === 0,
    message: `Sent ${successCount}/${results.length} emails successfully`,
    results: results
  };
}

/**
 * Send personalized emails to Shruti and Vidyashankar
 * Input parameters are ignored
 */
export async function sendInviteEmail(
  session?: any,  // Ignored
  facultyName?: string,  // Ignored
  email?: string  // Ignored
) {
  return sendBulkInviteEmail(); // Calls the bulk function that sends to both
}

/**
 * Send update emails to Shruti and Vidyashankar
 * Input parameters are ignored
 */
export async function sendUpdateEmail(
  session?: any,  // Ignored
  facultyName?: string,  // Ignored
  roomName?: string  // Ignored
): Promise<{ ok: boolean; message?: string }> {
  try {
    const results = [];

    // Send update email to each faculty member
    for (const [facultyEmail, facultyData] of Object.entries(FACULTY_DATA)) {
      try {
        const sessionsText = facultyData.sessions
          .map(s => `Session: "${s.title}" - ${s.date} - ${s.role}
Description: ${s.description}`)
          .join('\n\n');

        const text = `Hello ${facultyData.facultyName},

Your session${facultyData.sessions.length > 1 ? 's have' : ' has'} been updated:

${sessionsText}

Please confirm your availability again as the schedule has changed.

Registration: You will receive a unique link at early bird rates upon acceptance of the invite.

Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. If you are unable to accept or face a scheduling conflict, please indicate No at the earliest so we may make suitable adjustments.

We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 a memorable success.

Warm regards,
Scientific Committee, PediCritiCon 2025

Login here: ${baseUrl.replace(
          /\/+$/,
          ""
        )}/faculty-login?email=${encodeURIComponent(facultyData.email)}
`;

        const result = await sendMail({
          to: facultyData.email,
          subject: `📅 Session Updated: PediCritiCon 2025`,
          text,
          html: renderFacultyHTML(facultyEmail), // Use their personalized HTML
        });

        results.push({
          email: facultyData.email,
          success: result.ok
        });

      } catch (error) {
        console.error(`Failed to send update email to ${facultyData.facultyName}:`, error);
        results.push({
          email: facultyData.email,
          success: false
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      ok: failureCount === 0,
      message: `Update emails: ${successCount}/${results.length} sent successfully`
    };

  } catch (error) {
    console.error("Failed to send update emails:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
