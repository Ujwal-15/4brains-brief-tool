import * as React from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { RenderedSection } from "./exportSections";

// Brand palette (mirrors tailwind.config.ts)
const PRIMARY = "#006FBA";
const SECONDARY = "#00AE5E";
const SUPPORT = "#00BDCD";
const INK = "#0E0F12";
const INK_SOFT = "#6B7280";
const HAIRLINE = "#E5E7EB";
const CREAM = "#FAF7EE";

// Section accent colors — same cycle as the web BriefDetail.
const SECTION_ACCENT: Record<number, string> = {
  1: PRIMARY,
  2: SUPPORT,
  3: SECONDARY,
  4: PRIMARY,
  5: SUPPORT,
  6: INK_SOFT,
};

const CATEGORY_TINT: Record<string, string> = {
  Registration: PRIMARY,
  "Interactive & Information": SUPPORT,
  "AI Activations": SECONDARY,
  Gamification: PRIMARY,
  Photobooth: SUPPORT,
  Installation: SECONDARY,
  "App Development": PRIMARY,
  Custom: INK_SOFT,
};

// Long-content labels get a full-width row instead of being squeezed into
// the 2-col grid. Mirrors the web heuristic.
const LONG_LABELS = new Set([
  "Venue",
  "Description",
  "User Journey",
  "Notes",
  "Spec notes",
  "Deliverables note",
  "Data Notes",
  "Client provides",
  "4Brains will fabricate",
  "1LD notes",
  "4Brains will provide",
  "Client will provide",
  "Brand Colors / Fonts",
  "4Brains Internet Arrangement",
]);
function isLong(label: string, value: string): boolean {
  if (LONG_LABELS.has(label)) return true;
  if (value.length > 60) return true;
  if (value.includes("\n")) return true;
  return false;
}

const styles = StyleSheet.create({
  // ---------- Page chrome ----------
  page: {
    paddingTop: 64,
    paddingBottom: 60,
    paddingHorizontal: 52,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: INK,
    backgroundColor: "#FFFFFF",
  },
  coverPage: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: INK,
    backgroundColor: CREAM,
  },
  header: {
    position: "absolute",
    top: 26,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
    color: INK_SOFT,
    borderBottomWidth: 0.5,
    borderBottomColor: HAIRLINE,
    paddingBottom: 8,
  },
  headerBrand: {
    color: PRIMARY,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: INK_SOFT,
    borderTopWidth: 0.5,
    borderTopColor: HAIRLINE,
    paddingTop: 8,
  },

  // ---------- Cover page ----------
  coverInner: {
    paddingTop: 90,
    paddingBottom: 60,
    paddingHorizontal: 64,
  },
  coverEyebrow: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2.4,
    color: INK_SOFT,
    marginBottom: 24,
  },
  coverTitle: {
    fontSize: 38,
    fontFamily: "Helvetica-Bold",
    color: INK,
    letterSpacing: -0.6,
    lineHeight: 1.06,
    marginBottom: 14,
  },
  coverSubtitleLine: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    marginBottom: 36,
  },
  coverSubtitle: {
    fontSize: 14,
    color: INK_SOFT,
  },
  coverAccent: {
    fontSize: 16,
    fontFamily: "Times-BoldItalic",
    color: PRIMARY,
    letterSpacing: -0.2,
  },
  coverMetaBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 0,
    marginBottom: 28,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: HAIRLINE,
  },
  coverMetaCell: {
    width: "50%",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  coverMetaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: INK_SOFT,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  coverMetaValue: {
    fontSize: 11,
    color: INK,
  },

  coverFooterMark: {
    position: "absolute",
    bottom: 40,
    left: 64,
    right: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: HAIRLINE,
  },
  coverFooterBrand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    letterSpacing: 1.6,
  },
  coverFooterMeta: {
    fontSize: 8.5,
    color: INK_SOFT,
  },

  // ---------- Body sections ----------
  sectionWrap: {
    marginTop: 20,
    marginBottom: 6,
    flexDirection: "row",
  },
  sectionAccentBar: {
    width: 3,
    marginRight: 14,
    borderRadius: 2,
  },
  sectionHeaderInner: {
    flex: 1,
  },
  sectionEyebrow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: HAIRLINE,
  },
  sectionNumeral: {
    fontSize: 16,
    fontFamily: "Times-BoldItalic",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: INK,
    letterSpacing: -0.1,
  },

  // ---------- Rows (data pairs) ----------
  rowsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginRight: -6,
    marginLeft: -6,
  },
  rowCellHalf: {
    width: "50%",
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  rowCellFull: {
    width: "100%",
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  rowLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: INK_SOFT,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  rowValue: {
    fontSize: 10.5,
    color: INK,
    lineHeight: 1.45,
  },

  // ---------- Activity sub-blocks ----------
  activityCard: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: HAIRLINE,
    backgroundColor: "#FBFAF6",
    overflow: "hidden",
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: HAIRLINE,
  },
  activityTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
  },
  activityNumeral: {
    fontSize: 12,
    fontFamily: "Times-BoldItalic",
    marginRight: 8,
  },
  activityTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  categoryChip: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 999,
    overflow: "hidden",
    textTransform: "uppercase",
  },
  activityBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },

  // ---------- Flowchart ----------
  flowchartWrap: {
    marginTop: 4,
    marginBottom: 8,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: HAIRLINE,
  },
  flowchartLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: INK_SOFT,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  flowchartCaption: {
    fontSize: 8,
    color: INK_SOFT,
    marginTop: 6,
    textAlign: "center",
    fontFamily: "Helvetica-Oblique",
  },
  flowchartImage: {
    maxHeight: 320,
    objectFit: "contain",
  },
});

type Props = {
  projectName: string;
  clientName?: string;
  csName: string;
  pmName?: string;
  generatedDate: string;
  sections: RenderedSection[];
  // One flowchart PNG per activity, keyed by activity ordinal (1-based).
  // Empty/undefined skips embedding.
  activityFlowcharts?: Record<number, Buffer>;
};

// Pull a quick fact off of section 1/2 rows for the cover meta block.
// Falls back to "—" if the row isn't present.
function findRow(sections: RenderedSection[], label: string): string {
  for (const s of sections) {
    const r = s.rows.find((row) => row.label === label);
    if (r) return r.value;
  }
  return "—";
}

function activityCategoryFromRows(
  rows: { label: string; value: string }[],
): string {
  return rows.find((r) => r.label === "Category")?.value ?? "";
}

export function BriefPdfDocument({
  projectName,
  clientName,
  csName,
  pmName,
  generatedDate,
  sections,
  activityFlowcharts,
}: Props) {
  const safeTitle = projectName || "Untitled brief";
  const eventDate = findRow(sections, "Event Date(s)");
  const venue = findRow(sections, "City / Cities");
  const indoorOutdoor = findRow(sections, "Indoor / Outdoor");
  const activitiesCount =
    sections.find((s) => s.index === 3)?.activities?.length ?? 0;

  return (
    <Document>
      {/* ---------- Cover page ---------- */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverInner}>
          <Text style={styles.coverEyebrow}>PROJECT BRIEF</Text>

          <Text style={styles.coverTitle}>{safeTitle}</Text>

          <View style={styles.coverSubtitleLine}>
            <Text style={styles.coverSubtitle}>prepared </Text>
            <Text style={styles.coverAccent}>for </Text>
            <Text style={styles.coverSubtitle}>
              {clientName || "your client"}
            </Text>
          </View>

          <View style={styles.coverMetaBox}>
            <View style={styles.coverMetaCell}>
              <Text style={styles.coverMetaLabel}>Event Date</Text>
              <Text style={styles.coverMetaValue}>{eventDate}</Text>
            </View>
            <View style={styles.coverMetaCell}>
              <Text style={styles.coverMetaLabel}>City / Cities</Text>
              <Text style={styles.coverMetaValue}>{venue}</Text>
            </View>
            <View style={styles.coverMetaCell}>
              <Text style={styles.coverMetaLabel}>Activities</Text>
              <Text style={styles.coverMetaValue}>
                {activitiesCount > 0
                  ? `${activitiesCount} planned`
                  : "—"}
              </Text>
            </View>
            <View style={styles.coverMetaCell}>
              <Text style={styles.coverMetaLabel}>Setting</Text>
              <Text style={styles.coverMetaValue}>{indoorOutdoor}</Text>
            </View>
            <View style={styles.coverMetaCell}>
              <Text style={styles.coverMetaLabel}>CS / BD Owner</Text>
              <Text style={styles.coverMetaValue}>{csName || "—"}</Text>
            </View>
            <View style={styles.coverMetaCell}>
              <Text style={styles.coverMetaLabel}>Project Manager</Text>
              <Text style={styles.coverMetaValue}>{pmName || "—"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.coverFooterMark} fixed>
          <Text style={styles.coverFooterBrand}>4BRAINS · BRIEF</Text>
          <Text style={styles.coverFooterMeta}>
            Generated {generatedDate}
          </Text>
        </View>
      </Page>

      {/* ---------- Body pages ---------- */}
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <Text>
            <Text style={styles.headerBrand}>4BRAINS BRIEF</Text>
            {projectName ? `  ·  ${projectName}` : ""}
          </Text>
          <Text>{generatedDate}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            Filled by {csName} · {generatedDate}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>

        {sections.map((section) => {
          const accent = SECTION_ACCENT[section.index] ?? INK_SOFT;
          return (
            <View key={section.index} style={styles.sectionWrap} wrap>
              <View
                style={[styles.sectionAccentBar, { backgroundColor: accent }]}
              />
              <View style={styles.sectionHeaderInner}>
                <View style={styles.sectionEyebrow}>
                  <Text style={[styles.sectionNumeral, { color: accent }]}>
                    {String(section.index).padStart(2, "0")}
                  </Text>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>

                {/* Section-level rows */}
                {section.rows.length > 0 && (
                  <View style={styles.rowsGrid}>
                    {section.rows.map((r, i) => {
                      const long = isLong(r.label, r.value);
                      return (
                        <View
                          key={i}
                          style={long ? styles.rowCellFull : styles.rowCellHalf}
                          wrap={false}
                        >
                          <Text style={styles.rowLabel}>{r.label}</Text>
                          <Text style={styles.rowValue}>{r.value}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Activity sub-blocks */}
                {section.activities?.map((a) => {
                  const category = activityCategoryFromRows(a.rows);
                  const tint = CATEGORY_TINT[category] ?? INK_SOFT;
                  const visibleRows = a.rows.filter(
                    (r) => r.label !== "Category",
                  );
                  return (
                    <View key={a.index} style={styles.activityCard} wrap>
                      <View style={styles.activityHeader} wrap={false}>
                        <View style={styles.activityTitleRow}>
                          <Text
                            style={[
                              styles.activityNumeral,
                              { color: accent },
                            ]}
                          >
                            {section.index}.{a.index}
                          </Text>
                          <Text style={styles.activityTitle}>{a.title}</Text>
                        </View>
                        {category ? (
                          <Text
                            style={[
                              styles.categoryChip,
                              { color: tint, backgroundColor: tint + "1A" },
                            ]}
                          >
                            {category}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.activityBody}>
                        <View style={styles.rowsGrid}>
                          {visibleRows.map((r, i) => {
                            const long = isLong(r.label, r.value);
                            return (
                              <View
                                key={i}
                                style={
                                  long ? styles.rowCellFull : styles.rowCellHalf
                                }
                                wrap={false}
                              >
                                <Text style={styles.rowLabel}>{r.label}</Text>
                                <Text style={styles.rowValue}>{r.value}</Text>
                              </View>
                            );
                          })}
                        </View>
                        {activityFlowcharts?.[a.index] ? (
                          <View style={styles.flowchartWrap} wrap={false}>
                            <Text style={styles.flowchartLabel}>
                              User Journey Flowchart
                            </Text>
                            <Image
                              src={activityFlowcharts[a.index]}
                              style={styles.flowchartImage}
                            />
                            <Text style={styles.flowchartCaption}>
                              {a.title}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
