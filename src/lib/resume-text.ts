import type { ResumeBullet } from "@/lib/types";

/** Apply accepted/edited bullets back into the full resume without losing headers or role lines. */
export function applyBulletEdits(
  resumeText: string,
  bullets: ResumeBullet[],
): string {
  let text = resumeText;
  for (const bullet of bullets) {
    const { original, currentText } = bullet;
    if (currentText !== original && text.includes(original)) {
      text = text.replace(original, currentText);
    }
  }
  return text;
}
