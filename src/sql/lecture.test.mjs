import test from "node:test";
import assert from "node:assert/strict";
import { lireExo } from "../exo.js";
import { lireSql } from "./lecture.js";

const EXO = `## Base
\`\`\`sql
CREATE TABLE eleves (id INTEGER, nom TEXT);
INSERT INTO eleves VALUES (1, 'Alice');
\`\`\`
## Solutions
\`\`\`sql
SELECT nom FROM eleves;
\`\`\`
\`\`\`sql
SELECT eleves.nom FROM eleves;
\`\`\`
`;

test("lireSql lit la base et les solutions", () => {
  const r = lireSql(lireExo(EXO));
  assert.match(r.base, /^CREATE TABLE eleves/);
  assert.deepEqual(r.solutions, ["SELECT nom FROM eleves;", "SELECT eleves.nom FROM eleves;"]);
});

test("lireSql refuse une base ou des solutions manquantes", () => {
  assert.throws(() => lireSql(lireExo("## Solutions\n```sql\nSELECT 1;\n```\n")), /Base/);
  assert.throws(() => lireSql(lireExo("## Base\n```sql\nCREATE TABLE t (a);\n```\n")), /Solutions/);
});

test("lireSql refuse plusieurs blocs dans la base", () => {
  const exo = lireExo("## Base\n```sql\nA;\n```\n```sql\nB;\n```\n## Solutions\n```sql\nC;\n```\n");
  assert.throws(() => lireSql(exo), /un seul bloc/);
});
