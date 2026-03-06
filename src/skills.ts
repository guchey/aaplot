import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Bun bundles the file content at compile time via text import
import SKILL_CONTENT from "../skills/aaplot/SKILL.md" with { type: "text" };

export async function installSkills(): Promise<void> {
  const targetDir = join(process.cwd(), ".claude", "skills", "aaplot");

  await mkdir(targetDir, { recursive: true });
  await writeFile(join(targetDir, "SKILL.md"), SKILL_CONTENT);

  process.stdout.write(`Installed aaplot skills into ${targetDir}\n`);
}
