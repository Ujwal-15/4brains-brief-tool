import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { RenderedSection } from "./exportSections";

const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#111111",
  },
  header: {
    position: "absolute",
    top: 24,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#9CA3AF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  headerBrand: {
    color: "#111111",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9CA3AF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 20,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
  },
  rowGroup: {
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 11,
    color: "#111111",
    lineHeight: 1.4,
  },
  flowchartCaption: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
    fontFamily: "Helvetica-Oblique",
  },
  flowchartImage: {
    marginTop: 10,
    maxHeight: 360,
    objectFit: "contain",
  },
});

type Props = {
  projectName: string;
  csName: string;
  generatedDate: string;
  sections: RenderedSection[];
  flowchartPng?: Buffer;
};

export function BriefPdfDocument({
  projectName,
  csName,
  generatedDate,
  sections,
  flowchartPng,
}: Props) {
  return (
    <Document>
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

        <View>
          <Text style={styles.title}>{projectName || "Untitled brief"}</Text>
          <Text style={styles.subtitle}>
            Project brief generated on {generatedDate}
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.index} wrap={true}>
            <Text style={styles.sectionHeader}>
              {section.index}. {section.title}
            </Text>

            {section.rows.map((r, i) => (
              <View key={i} style={styles.rowGroup} wrap={false}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowValue}>{r.value}</Text>
              </View>
            ))}

            {section.index === 4 && flowchartPng ? (
              <View wrap={false}>
                <Image
                  src={flowchartPng}
                  style={styles.flowchartImage}
                />
                <Text style={styles.flowchartCaption}>
                  Auto-generated user journey flowchart
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </Page>
    </Document>
  );
}
