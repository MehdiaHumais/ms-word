import { create } from "zustand";

export interface Recipient {
  id: string;
  FirstName: string;
  LastName: string;
  Company: string;
  Address: string;
  City: string;
  State: string;
  Zip: string;
  Phone: string;
  Email: string;
}

export const MERGE_MASTER_FIELDS = [
  "FirstName",
  "LastName",
  "Company",
  "Address",
  "City",
  "State",
  "Zip",
  "Phone",
  "Email",
] as const;
export type MergeField = (typeof MERGE_MASTER_FIELDS)[number];

const SAMPLE_RECIPIENTS: Recipient[] = [
  { id: "r1", FirstName: "Ada", LastName: "Lovelace", Company: "Analytical Engines Ltd", Address: "12 St James's Square", City: "London", State: "", Zip: "SW1Y 4JH", Phone: "(020) 7400 1234", Email: "ada@analytical.example" },
  { id: "r2", FirstName: "Grace", LastName: "Hopper", Company: "Cobol Corp", Address: "88 Harbor Drive", City: "San Diego", State: "CA", Zip: "92101", Phone: "(619) 555 0142", Email: "grace@cobol.example" },
  { id: "r3", FirstName: "Alan", LastName: "Turing", Company: "Turing Machines Co", Address: "5 Bletchley Park", City: "Milton Keynes", State: "", Zip: "MK3 6EB", Phone: "(01908) 640 500", Email: "alan@turing.example" },
  { id: "r4", FirstName: "Katherine", LastName: "Johnson", Company: "NASA Langley", Address: "1 NASA Drive", City: "Hampton", State: "VA", Zip: "23666", Phone: "(757) 864 1000", Email: "katherine@nasa.example" },
];

export type MergeDocType = "letters" | "email" | "envelopes" | "labels" | "directory";

interface MailState {
  recipients: Recipient[];
  docType: MergeDocType;
  currentIdx: number;
  preview: boolean;
  highlightFields: boolean;
  startMerge: boolean;
  setRecipients: (r: Recipient[]) => void;
  addRecipient: (r: Recipient) => void;
  updateRecipient: (r: Recipient) => void;
  removeRecipient: (id: string) => void;
  applySampleList: () => void;
  setDocType: (t: MergeDocType) => void;
  setCurrentIdx: (i: number) => void;
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
  goLast: () => void;
  setPreview: (p: boolean) => void;
  toggleHighlight: () => void;
  setStartMerge: (s: boolean) => void;
}

export const useMailStore = create<MailState>((set) => ({
  recipients: SAMPLE_RECIPIENTS,
  docType: "letters",
  currentIdx: 0,
  preview: false,
  highlightFields: false,
  startMerge: false,
  setRecipients: (recipients) => set({ recipients, currentIdx: 0 }),
  addRecipient: (r) =>
    set((s) => ({ recipients: [...s.recipients, r] })),
  updateRecipient: (r) =>
    set((s) => ({ recipients: s.recipients.map((x) => (x.id === r.id ? r : x)) })),
  removeRecipient: (id) =>
    set((s) => {
      const recipients = s.recipients.filter((x) => x.id !== id);
      const currentIdx = Math.min(s.currentIdx, Math.max(0, recipients.length - 1));
      return { recipients, currentIdx };
    }),
  applySampleList: () => set({ recipients: SAMPLE_RECIPIENTS, currentIdx: 0 }),
  setDocType: (docType) => set({ docType }),
  setCurrentIdx: (i) =>
    set((s) => ({
      currentIdx: Math.max(0, Math.min(i, s.recipients.length - 1)),
    })),
  goFirst: () => set({ currentIdx: 0 }),
  goPrev: () => set((s) => ({ currentIdx: Math.max(0, s.currentIdx - 1) })),
  goNext: () =>
    set((s) => ({ currentIdx: Math.min(s.recipients.length - 1, s.currentIdx + 1) })),
  goLast: () => set((s) => ({ currentIdx: s.recipients.length - 1 })),
  setPreview: (preview) => set({ preview }),
  toggleHighlight: () => set((s) => ({ highlightFields: !s.highlightFields })),
  setStartMerge: (startMerge) => set({ startMerge }),
}));

/** Extract the fields present as «Field» placeholders in a text blob. */
export function collectMergeFields(text: string): string[] {
  const found = new Set<string>();
  const re = /«([^»]+)»/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) found.add(m[1].trim());
  return [...found];
}

/** Substitute every «Field» placeholder in a text blob using a recipient record. */
export function substituteFields(text: string, rec: Partial<Recipient>): string {
  return text.replace(/«([^»]+)»/g, (whole, field: string) => {
    const key = field.trim() as keyof Recipient;
    const val = rec[key];
    return val !== undefined && val !== "" ? String(val) : whole;
  });
}

/** Standard address block used by the Address Block insert. */
export function addressBlockFor(rec: Recipient): string {
  return [rec.FirstName, rec.LastName].filter(Boolean).join(" ") || " ";
}

export function greetingLineFor(rec: Recipient): string {
  return rec.FirstName ? `Dear ${rec.FirstName},` : "Dear Sir or Madam,";
}