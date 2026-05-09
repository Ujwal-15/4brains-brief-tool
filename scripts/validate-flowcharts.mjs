// Validates each seeded Mermaid spec parses without error. Run from project
// root so it can resolve mermaid from node_modules.
import mermaid from 'mermaid';

const SPECS = {
  FC_QR_REG: `graph TD
A["Visitor scans QR"]
B["System validates badge"]
C{"Recognised?"}
D["Auto-fill name and room"]
E["Manual entry at counter"]
F["Personalised badge prints"]
G["Hostess hands over badge"]
A --> B
B --> C
C -- Yes --> D
C -- No --> E
D --> F
E --> F
F --> G`,
  FC_AI_CARICATURE: `graph TD
A["Visitor steps to camera"]
B["3-2-1 capture countdown"]
C["AI generates caricature"]
D["User picks 1 of 3 styles"]
E["Postcard prints"]
F["Visitor walks away"]
A --> B --> C --> D --> E --> F`,
  FC_SPIN_WHEEL: `graph TD
A["Scan QR launches microsite"]
B["Enter name and phone"]
C["Spin the wheel"]
D{"Result tier"}
E["Sample pack"]
F["Branded merch"]
G["Grand prize entry"]
H["Live dashboard logs"]
A --> B --> C --> D
D -- Tier 1 --> E
D -- Tier 2 --> F
D -- Tier 3 --> G
E --> H
F --> H
G --> H`,
  FC_AI_VIDEOBOOTH: `graph TD
A["Visitor enters booth"]
B["Records 5s clip"]
C["AI restyles in real-time"]
D["Preview shown on screen"]
E{"Approve?"}
F["Share via WhatsApp or email"]
G["Re-shoot"]
A --> B --> C --> D --> E
E -- Yes --> F
E -- No --> G --> B`,
  FC_RFID_CUBE: `graph TD
A["Pick up RFID cube"]
B["Place on smart pedestal"]
C["Screen shows linked content"]
D{"Scroll cubes?"}
E["Switch story"]
F["Watch full story"]
A --> B --> C --> D
D -- Yes --> E --> C
D -- No --> F`,
};

let failed = 0;
for (const [name, src] of Object.entries(SPECS)) {
  try {
    const result = await mermaid.parse(src);
    if (result === false) {
      console.log(`✗ ${name}: parser returned false`);
      failed++;
    } else {
      console.log(`✓ ${name}`);
    }
  } catch (err) {
    console.log(`✗ ${name}: ${err.message?.split('\n')[0] || err}`);
    failed++;
  }
}
process.exit(failed > 0 ? 1 : 0);
